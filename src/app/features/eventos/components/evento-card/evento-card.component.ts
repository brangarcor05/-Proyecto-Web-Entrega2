import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Evento } from '../../../../models/evento/evento.model';

@Component({
  selector: 'app-evento-card',
  imports: [RouterLink],
  templateUrl: './evento-card.component.html',
  styleUrl: './evento-card.component.css',
})
export class EventoCardComponent {
  elemento = input.required<Evento>();
  puedeEditar = input(false);
  puedeEliminar = input(false);
  eliminando = input(false);
  detalle = input(false);
  eliminar = output<Evento>();
}
