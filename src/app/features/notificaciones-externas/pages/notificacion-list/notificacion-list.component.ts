import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificacionExterna } from '../../../../models/notificacionexterna/notificacion-externa.model';
import { NotificacionExternaService } from '../../../../services/notificacion-externa.service';
import { DiagramaContexto } from '../../../diagrama/diagrama-contexto';
import { NotificacionExternaCardComponent } from '../../components/notificacion-card/notificacion-card.component';

@Component({
  selector: 'app-notificacion-list',
  imports: [RouterLink, NotificacionExternaCardComponent],
  templateUrl: './notificacion-list.component.html',
  styleUrls: ['../../../diagrama/diagrama.css', './notificacion-list.component.css'],
})
export class NotificacionExternaListComponent extends DiagramaContexto {
  private readonly service = inject(NotificacionExternaService);
  elementos: NotificacionExterna[] = [];
  eliminando = false;
  pendiente: NotificacionExterna | null = null;

  protected cargarContenido() {
    this.elementos = [];
    return this.service.listarPorProceso(this.procesoId).pipe(
      tap((datos) => {
        this.elementos = datos.filter((item) => item.procesoId === this.procesoId && item.activo);
      }),
    );
  }

  eliminar(elemento: NotificacionExterna): void {
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
          this.elementos = this.elementos.filter((item) => item.id !== elemento.id);
        },
        error: (error: unknown) => this.mostrarError(error),
      });
  }
}
