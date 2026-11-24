import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const textoObligatorio: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim().length > 0 ? null : { required: true };

export const numeroFinito: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  control.value === null ||
  control.value === '' ||
  (typeof control.value === 'number' && Number.isFinite(control.value))
    ? null
    : { numero: true };

export const idPositivo: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'number' && Number.isSafeInteger(control.value) && control.value > 0
    ? null
    : { identificador: true };
