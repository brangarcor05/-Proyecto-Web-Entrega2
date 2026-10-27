import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Evento } from '../../../../models/evento/evento.model';
import { EventoService } from '../../../../services/evento/evento.service';
import { DiagramaContexto } from '../../../diagrama/diagrama-contexto';
import { EventoCardComponent } from '../../components/evento-card/evento-card.component';

@Component({
  selector: 'app-evento-detail',
  imports: [RouterLink, EventoCardComponent],
  templateUrl: './evento-detail.component.html',
  styleUrls: ['../../../diagrama/diagrama.css', './evento-detail.component.css'],
})
export class EventoDetailComponent extends DiagramaContexto {
  private readonly service = inject(EventoService);
  elemento: Evento | null = null;
  eliminando = false;
  pendiente: Evento | null = null;

  protected cargarContenido() {
    this.elemento = null;
    return this.service.buscarPorId(this.id!).pipe(
      tap((datos) => {
        this.validarPertenencia(datos.procesoId, datos.activo);
        this.elemento = datos;
      }),
    );
  }

  eliminar(elemento: Evento): void {
    const sesion = this.auth.sesion();
    if (!sesion || !this.puedeEliminar || this.eliminando || elemento.procesoId !== this.procesoId)
      return;
    this.pendiente = elemento;
  }

  cancelarEliminacion(): void {
    if (!this.eliminando) this.pendiente = null;
  }

  confirmarEliminacion(): void {
    const elemento = this.pendiente;
    const sesion = this.auth.sesion();
    if (
      !elemento ||
      !sesion ||
      !this.puedeEliminar ||
      this.eliminando ||
      elemento.procesoId !== this.procesoId
    )
      return;
    this.eliminando = true;
    this.error = '';
    this.service
      .eliminar(elemento.id, sesion.usuarioId)
      .pipe(
        finalize(() => {
          this.eliminando = false;
          this.pendiente = null;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          void this.router.navigate(['/procesos', this.procesoId, 'eventos']);
        },
        error: (error: unknown) => this.mostrarError(error),
      });
  }
}
