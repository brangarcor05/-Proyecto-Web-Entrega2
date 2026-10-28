import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotificacionExterna } from '../../../../models/notificacionexterna/notificacion-externa.model';
import { NotificacionExternaService } from '../../../../services/notificacionExterna/notificacion-externa.service';
import { DiagramaContexto } from '../../../diagrama/diagrama-contexto';
import { NotificacionExternaCardComponent } from '../../components/notificacion-card/notificacion-card.component';

@Component({
  selector: 'app-notificacion-detail',
  imports: [RouterLink, NotificacionExternaCardComponent],
  templateUrl: './notificacion-detail.component.html',
  styleUrls: ['../../../diagrama/diagrama.css', './notificacion-detail.component.css'],
})
export class NotificacionExternaDetailComponent extends DiagramaContexto {
  private readonly service = inject(NotificacionExternaService);
  elemento: NotificacionExterna | null = null;
  eliminando = false;
  pendiente: NotificacionExterna | null = null;

  protected cargarContenido() {
    this.elemento = null;
    return this.service.buscarPorId(this.id!).pipe(
      tap((datos) => {
        this.validarPertenencia(datos.procesoId, datos.activo);
        this.elemento = datos;
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
          void this.router.navigate(['/procesos', this.procesoId, 'notificaciones']);
        },
        error: (error: unknown) => this.mostrarError(error),
      });
  }
}
