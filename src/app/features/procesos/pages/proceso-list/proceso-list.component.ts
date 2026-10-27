import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { PageResponse } from '../../../../models/common/page-response.model';
import { ConsultarProcesosParams } from '../../../../models/proceso/consultar-procesos-params.model';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso.service';
import { FiltrosProceso, ProcesoFilterComponent } from '../../components/proceso-filter/proceso-filter.component';
import { ProcesoCardComponent } from '../../components/proceso-card/proceso-card.component';
import { puedeAdministrarProceso, puedeCrearOEditarProceso } from '../../proceso-permisos';

@Component({
  selector: 'app-proceso-list',
  imports: [RouterLink, ProcesoFilterComponent, ProcesoCardComponent],
  templateUrl: './proceso-list.component.html',
  styleUrl: './proceso-list.component.css',
})
export class ProcesoListComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly apiErrorService = inject(ApiErrorService);
  readonly autenticacionService = inject(AutenticacionService);
  private readonly router = inject(Router);

  pagina: PageResponse<Proceso> | null = null;
  cargando = false;
  eliminandoId: number | null = null;
  error = '';
  camposInvalidos: Record<string, string> = {};

  get entradasCamposInvalidos(): [string, string][] {
    return Object.entries(this.camposInvalidos);
  }

  get puedeCrearOEditar(): boolean {
    const sesion = this.autenticacionService.sesion();
    return sesion !== null && puedeCrearOEditarProceso(sesion.rolUsuario);
  }

  get puedeEliminar(): boolean {
    const sesion = this.autenticacionService.sesion();
    return sesion !== null && puedeAdministrarProceso(sesion.rolUsuario);
  }

  private filtros: FiltrosProceso = {
    incluirInactivos: false,
    sort: 'id,asc',
  };

  ngOnInit(): void {
    if (this.obtenerSesion()) {
      this.consultar(0);
    }
  }

  aplicarFiltros(filtros: FiltrosProceso): void {
    this.filtros = filtros;
    this.consultar(0);
  }

  paginaAnterior(): void {
    const paginaActual = this.pagina;
    if (paginaActual && !paginaActual.first) {
      this.consultar(paginaActual.number - 1);
    }
  }

  paginaSiguiente(): void {
    const paginaActual = this.pagina;
    if (paginaActual && !paginaActual.last) {
      this.consultar(paginaActual.number + 1);
    }
  }

  solicitarEliminacion(proceso: Proceso): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !puedeAdministrarProceso(sesion.rolUsuario) || proceso.soloLectura) {
      return;
    }

    const confirmado = window.confirm(
      `¿Deseas eliminar el proceso “${proceso.nombre}”? Esta acción lo marcará como inactivo.`,
    );
    if (!confirmado) {
      return;
    }

    this.eliminandoId = proceso.id;
    this.limpiarError();
    this.procesoService
      .eliminar(proceso.id, sesion.usuarioId)
      .pipe(finalize(() => (this.eliminandoId = null)))
      .subscribe({
        next: () => this.consultar(this.pagina?.number ?? 0),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  private consultar(numeroPagina: number): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }

    this.cargando = true;
    this.limpiarError();

    const parametros: ConsultarProcesosParams = {
      empresaId: sesion.empresaId,
      ...this.filtros,
      page: numeroPagina,
      size: 9,
    };

    this.procesoService
      .consultar(parametros)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (pagina) => (this.pagina = pagina),
        error: (error: unknown) => {
          this.pagina = null;
          this.manejarError(error);
        },
      });
  }

  private manejarError(error: unknown): void {
    this.error = this.apiErrorService.obtenerMensaje(error);
    this.camposInvalidos = this.apiErrorService.obtenerCamposInvalidos(error);
  }

  private limpiarError(): void {
    this.error = '';
    this.camposInvalidos = {};
  }

  private obtenerSesion(): SesionResponse | null {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) {
      void this.router.navigate(['/login']);
    }
    return sesion;
  }
}
