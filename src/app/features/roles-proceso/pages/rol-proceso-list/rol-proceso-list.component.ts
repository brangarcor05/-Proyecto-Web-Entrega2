import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { PageResponse } from '../../../../models/common/page-response.model';
import { ConsultarRolesProcesoParams } from '../../../../models/bpmn/rolProceso/consultar-roles-proceso-params.model';
import { RolProceso } from '../../../../models/bpmn/rolProceso/rolProceso.model';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { RolProcesoService } from '../../../../services/rolProceso/rolProceso.service';
import { puedeAdministrarRolesProceso } from '../../rol-proceso-permisos';

@Component({
  selector: 'app-rol-proceso-list',
  imports: [RouterLink],
  templateUrl: './rol-proceso-list.component.html',
  styleUrl: './rol-proceso-list.component.css',
})
export class RolProcesoListComponent implements OnInit {
  private readonly rolProcesoService = inject(RolProcesoService);
  private readonly apiErrorService = inject(ApiErrorService);
  readonly autenticacionService = inject(AutenticacionService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  pagina: PageResponse<RolProceso> | null = null;
  cargando = false;
  eliminandoId: number | null = null;
  error = '';
  camposInvalidos: Record<string, string> = {};
  filtroNombre = '';

  get entradasCamposInvalidos(): [string, string][] {
    return Object.entries(this.camposInvalidos);
  }

  get puedeAdministrar(): boolean {
    const sesion = this.autenticacionService.sesion();
    return sesion !== null && puedeAdministrarRolesProceso(sesion.rolUsuario);
  }

  ngOnInit(): void {
    if (this.obtenerSesion()) {
      this.consultar(0);
    }
  }

  buscar(nombre: string): void {
    this.filtroNombre = nombre;
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

  solicitarEliminacion(rol: RolProceso): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !puedeAdministrarRolesProceso(sesion.rolUsuario)) {
      return;
    }

    if (rol.enUso) {
      this.error = `No se puede eliminar “${rol.nombre}”: está en uso en ${rol.procesosDondeSeUsa.join(', ')}.`;
      return;
    }

    const confirmado = window.confirm(`¿Deseas eliminar el rol de proceso “${rol.nombre}”?`);
    if (!confirmado) {
      return;
    }

    this.eliminandoId = rol.id;
    this.limpiarError();
    this.cdr.markForCheck();
    this.rolProcesoService
      .eliminar(rol.id, sesion.usuarioId)
      .pipe(finalize(() => {
        this.eliminandoId = null;
        this.cdr.markForCheck();
      }))
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
    this.cdr.markForCheck();

    const parametros: ConsultarRolesProcesoParams = {
      empresaId: sesion.empresaId,
      nombre: this.filtroNombre || undefined,
      page: numeroPagina,
      size: 10,
      sort: 'nombre,asc',
    };

    this.rolProcesoService
      .consultar(parametros)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (pagina) => {
          this.pagina = pagina;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.pagina = null;
          this.manejarError(error);
        },
      });
  }

  private manejarError(error: unknown): void {
    this.error = this.apiErrorService.obtenerMensaje(error);
    this.camposInvalidos = this.apiErrorService.obtenerCamposInvalidos(error);
    this.cdr.markForCheck();
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
