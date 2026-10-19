import { Component, input, output } from '@angular/core';
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
  readonly proceso = input.required<Proceso>();
  readonly eliminar = output<Proceso>();
}
