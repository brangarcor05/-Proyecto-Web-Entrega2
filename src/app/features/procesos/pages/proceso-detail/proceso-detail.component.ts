import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { ProcesoService } from '../../../../services/proceso.service';
import { EstadoProcesoComponent } from '../../components/estado-proceso/estado-proceso.component';
import { PROCESO_CONTEXTO_TEMPORAL } from '../../proceso-contexto';

@Component({
  selector: 'app-proceso-detail',
  imports: [RouterLink, EstadoProcesoComponent],
  templateUrl: './proceso-detail.component.html',
  styleUrl: './proceso-detail.component.css',
})
export class ProcesoDetailComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly proceso = signal<Proceso | null>(null);
  readonly cargando = signal(false);
  readonly eliminando = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    const id = this.obtenerId();
    if (id !== null) {
      this.cargar(id);
    }
  }

  eliminar(): void {
    const proceso = this.proceso();
    if (!proceso || proceso.soloLectura) {
      return;
    }

    if (!window.confirm(`¿Deseas eliminar el proceso “${proceso.nombre}”?`)) {
      return;
    }

    this.eliminando.set(true);
    this.error.set('');
    this.procesoService
      .eliminar(proceso.id, PROCESO_CONTEXTO_TEMPORAL.usuarioId)
      .pipe(finalize(() => this.eliminando.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/procesos']),
        error: (error: unknown) => this.error.set(this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.error.set('');
    this.procesoService
      .buscarPorId(id, PROCESO_CONTEXTO_TEMPORAL.empresaId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (proceso) => this.proceso.set(proceso),
        error: (error: unknown) => this.error.set(this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private obtenerId(): number | null {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('El identificador del proceso no es válido.');
      return null;
    }
    return id;
  }
}
