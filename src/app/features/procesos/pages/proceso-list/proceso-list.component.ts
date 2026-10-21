import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { PageResponse } from '../../../../models/common/page-response.model';
import { ConsultarProcesosParams } from '../../../../models/proceso/consultar-procesos-params.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { ProcesoService } from '../../../../services/proceso.service';
import { FiltrosProceso, ProcesoFilterComponent } from '../../components/proceso-filter/proceso-filter.component';
import { ProcesoCardComponent } from '../../components/proceso-card/proceso-card.component';
import { PROCESO_CONTEXTO_TEMPORAL } from '../../proceso-contexto';

@Component({
  selector: 'app-proceso-list',
  imports: [RouterLink, ProcesoFilterComponent, ProcesoCardComponent],
  templateUrl: './proceso-list.component.html',
  styleUrl: './proceso-list.component.css',
})
export class ProcesoListComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly apiErrorService = inject(ApiErrorService);

  pagina: PageResponse<Proceso> | null = null;
  cargando = false;
  eliminandoId: number | null = null;
  error = '';
  camposInvalidos: Record<string, string> = {};

  get entradasCamposInvalidos(): [string, string][] {
    return Object.entries(this.camposInvalidos);
  }

  private filtros: FiltrosProceso = {
    incluirInactivos: false,
    sort: 'id,asc',
  };

  ngOnInit(): void {
    this.consultar(0);
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
    const confirmado = window.confirm(
      `¿Deseas eliminar el proceso “${proceso.nombre}”? Esta acción lo marcará como inactivo.`,
    );
    if (!confirmado) {
      return;
    }

    this.eliminandoId = proceso.id;
    this.limpiarError();
    this.procesoService
      .eliminar(proceso.id, PROCESO_CONTEXTO_TEMPORAL.usuarioId)
      .pipe(finalize(() => (this.eliminandoId = null)))
      .subscribe({
        next: () => this.consultar(this.pagina?.number ?? 0),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  private consultar(numeroPagina: number): void {
    this.cargando = true;
    this.limpiarError();

    const parametros: ConsultarProcesosParams = {
      empresaId: PROCESO_CONTEXTO_TEMPORAL.empresaId,
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
}
