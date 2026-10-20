import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ConsultarProcesosParams } from '../../../../models/proceso/consultar-procesos-params.model';
import { EstadoProceso } from '../../../../models/proceso/estado-proceso.model';

export type FiltrosProceso = Omit<ConsultarProcesosParams, 'empresaId' | 'page' | 'size'>;

@Component({
  selector: 'app-proceso-filter',
  imports: [ReactiveFormsModule],
  templateUrl: './proceso-filter.component.html',
  styleUrl: './proceso-filter.component.css',
})
export class ProcesoFilterComponent {
  @Output() buscar = new EventEmitter<FiltrosProceso>();

  readonly formulario = new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    estado: new FormControl<EstadoProceso | ''>('', { nonNullable: true }),
    categoria: new FormControl('', { nonNullable: true }),
    incluirInactivos: new FormControl(false, { nonNullable: true }),
    sort: new FormControl('id,asc', { nonNullable: true }),
  });

  aplicar(): void {
    const valor = this.formulario.getRawValue();
    this.buscar.emit({
      nombre: valor.nombre.trim() || undefined,
      estado: valor.estado || undefined,
      categoria: valor.categoria.trim() || undefined,
      incluirInactivos: valor.incluirInactivos,
      sort: valor.sort,
    });
  }

  limpiar(): void {
    this.formulario.reset({
      nombre: '',
      estado: '',
      categoria: '',
      incluirInactivos: false,
      sort: 'id,asc',
    });
    this.aplicar();
  }
}
