import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Evento } from '../../../../models/evento/evento.model';
import { EventoService } from '../../../../services/evento/evento.service';
import { DiagramaContexto } from '../../../diagrama/diagrama-contexto';
import { EventoCardComponent } from '../../components/evento-card/evento-card.component';

@Component({
  selector: 'app-evento-list',
  imports: [RouterLink, EventoCardComponent],
  templateUrl: './evento-list.component.html',
  styleUrls: ['../../../diagrama/diagrama.css', './evento-list.component.css'],
})
export class EventoListComponent extends DiagramaContexto {
  private readonly service = inject(EventoService);
  elementos: Evento[] = [];
  eliminando = false;
  pendiente: Evento | null = null;

  protected cargarContenido() {
    this.elementos = [];
    return this.service.listarPorProceso(this.procesoId).pipe(
      tap((datos) => {
        this.elementos = datos.filter((item) => item.procesoId === this.procesoId && item.activo);
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
          this.elementos = this.elementos.filter((item) => item.id !== elemento.id);
        },
        error: (error: unknown) => this.mostrarError(error),
      });
  }
}
