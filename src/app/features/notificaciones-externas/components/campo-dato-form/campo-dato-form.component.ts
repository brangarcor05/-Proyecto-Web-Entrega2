import { Component, input } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { textoObligatorio } from '../../../diagrama/diagrama-validadores';

export type CampoDatoGrupo = FormGroup<{
  nombre: FormControl<string>;
  tipoDato: FormControl<string>;
}>;

export function crearCampoDato(nombre = '', tipoDato = ''): CampoDatoGrupo {
  return new FormGroup({
    nombre: new FormControl(nombre, {
      nonNullable: true,
      validators: [textoObligatorio, Validators.maxLength(100)],
    }),
    tipoDato: new FormControl(tipoDato, {
      nonNullable: true,
      validators: [textoObligatorio, Validators.maxLength(50)],
    }),
  });
}

@Component({
  selector: 'app-campo-dato-form',
  imports: [ReactiveFormsModule],
  templateUrl: './campo-dato-form.component.html',
  styleUrl: './campo-dato-form.component.css',
})
export class CampoDatoFormComponent {
  campos = input.required<FormArray<CampoDatoGrupo>>();
  bloqueado = input(false);

  agregar(): void {
    if (!this.bloqueado()) this.campos().push(crearCampoDato());
  }

  quitar(indice: number): void {
    if (!this.bloqueado()) this.campos().removeAt(indice);
  }
}
