import { Component, Input } from '@angular/core';

import { EstadoProceso } from '../../../../models/proceso/estado-proceso.model';

@Component({
  selector: 'app-estado-proceso',
  templateUrl: './estado-proceso.component.html',
  styleUrl: './estado-proceso.component.css',
})
export class EstadoProcesoComponent {
  @Input({ required: true }) estado!: EstadoProceso;

  get etiqueta(): string {
    const etiquetas: Record<EstadoProceso, string> = {
      BORRADOR: 'Borrador',
      PUBLICADO: 'Publicado',
      INACTIVO: 'Inactivo',
    };
    return etiquetas[this.estado];
  }
}
