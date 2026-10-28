import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { Arco } from '../../../../models/arco/arco.model';
import { ArcoDiagrama } from '../../../../models/arco/arco-diagrama.model';
import { ArcoService } from '../../../../services/arco/arco.service';

@Component({
  selector: 'app-arco-panel',
  templateUrl: './arco-panel.component.html',
  styleUrl: './arco-panel.component.css',
})
export class ArcoPanelComponent implements OnChanges {
  private readonly arcoService = inject(ArcoService);
  private readonly apiErrorService = inject(ApiErrorService);

  @Input({ required: true }) procesoId!: number;
  @Input() arcosDiagrama: ArcoDiagrama[] = [];

  readonly arcosPersistidos = signal<Arco[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['procesoId'] && Number.isInteger(this.procesoId) && this.procesoId > 0) {
      this.cargar();
    }
  }

  recargar(): void {
    this.cargar();
  }

  private cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.arcoService.listarPorProceso(this.procesoId).subscribe({
      next: (arcos) => {
        this.arcosPersistidos.set(arcos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.arcosPersistidos.set([]);
        this.error.set(this.apiErrorService.obtenerMensaje(error));
        this.cargando.set(false);
      },
    });
  }
}
