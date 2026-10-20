import { Component, OnInit, inject, signal } from '@angular/core';
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

  readonly procesoId = signal<number | null>(null);
  readonly registros = signal<Historial[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('El identificador del proceso no es válido.');
      return;
    }

    this.procesoId.set(id);
    this.cargando.set(true);
    this.procesoService
      .consultarHistorial(id, PROCESO_CONTEXTO_TEMPORAL.empresaId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (registros) => this.registros.set(registros),
        error: (error: unknown) => this.error.set(this.apiErrorService.obtenerMensaje(error)),
      });
  }
}
