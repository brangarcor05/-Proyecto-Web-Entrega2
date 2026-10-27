import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificacionExterna } from '../../../../models/notificacionexterna/notificacion-externa.model';

@Component({
  selector: 'app-notificacion-card',
  imports: [RouterLink],
  templateUrl: './notificacion-card.component.html',
  styleUrl: './notificacion-card.component.css',
})
export class NotificacionExternaCardComponent {
  elemento = input.required<NotificacionExterna>();
  puedeEditar = input(false);
  puedeEliminar = input(false);
  eliminando = input(false);
  detalle = input(false);
  eliminar = output<NotificacionExterna>();
}
