import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Proceso } from '../../../../models/proceso/proceso.model';
import { EstadoProcesoComponent } from '../estado-proceso/estado-proceso.component';

@Component({
  selector: 'app-proceso-card',
  imports: [RouterLink, EstadoProcesoComponent],
  templateUrl: './proceso-card.component.html',
  styleUrl: './proceso-card.component.css',
})
export class ProcesoCardComponent {
  @Input({ required: true }) proceso!: Proceso;
  @Input() puedeEditar = false;
  @Input() puedeEliminar = false;
  @Output() eliminar = new EventEmitter<Proceso>();
}
