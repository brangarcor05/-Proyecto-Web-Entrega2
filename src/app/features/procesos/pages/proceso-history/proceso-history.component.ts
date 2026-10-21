import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { Historial } from '../../../../models/proceso/historial.model';
import { ProcesoService } from '../../../../services/proceso.service';
import { PROCESO_CONTEXTO_TEMPORAL } from '../../proceso-contexto';

@Component({
  selector: 'app-proceso-history',
  imports: [RouterLink],
  templateUrl: './proceso-history.component.html',
  styleUrl: './proceso-history.component.css',
})
export class ProcesoHistoryComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);

  procesoId: number | null = null;
  registros: Historial[] = [];
  cargando = false;
  error = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del proceso no es válido.';
      return;
    }

    this.procesoId = id;
    this.cargando = true;
    this.procesoService
      .consultarHistorial(id, PROCESO_CONTEXTO_TEMPORAL.empresaId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (registros) => (this.registros = registros),
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
      });
  }
}
