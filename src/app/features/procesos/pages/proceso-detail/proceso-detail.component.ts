import { Component, OnInit, inject } from '@angular/core';
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

  proceso: Proceso | null = null;
  cargando = false;
  eliminando = false;
  error = '';

  ngOnInit(): void {
    const id = this.obtenerId();
    if (id !== null) {
      this.cargar(id);
    }
  }

  eliminar(): void {
    const proceso = this.proceso;
    if (!proceso || proceso.soloLectura) {
      return;
    }

    if (!window.confirm(`¿Deseas eliminar el proceso “${proceso.nombre}”?`)) {
      return;
    }

    this.eliminando = true;
    this.error = '';
    this.procesoService
      .eliminar(proceso.id, PROCESO_CONTEXTO_TEMPORAL.usuarioId)
      .pipe(finalize(() => (this.eliminando = false)))
      .subscribe({
        next: () => void this.router.navigate(['/procesos']),
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private cargar(id: number): void {
    this.cargando = true;
    this.error = '';
    this.procesoService
      .buscarPorId(id, PROCESO_CONTEXTO_TEMPORAL.empresaId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (proceso) => (this.proceso = proceso),
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private obtenerId(): number | null {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del proceso no es válido.';
      return null;
    }
    return id;
  }
}
