import { HttpErrorResponse } from '@angular/common/http';
import { mensajeDeError } from './mensaje.error';

describe('mensajeDeError', () => {
  it('avisa que no hay conexión cuando el status es 0', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 0 }))).toBe('No hay conexión con el servidor');
  });

  it('usa el mensaje del backend en un 409', () => {
    const err = new HttpErrorResponse({ status: 409, error: { mensaje: 'Ya existe una empresa con ese RUC' } });
    expect(mensajeDeError(err)).toBe('Ya existe una empresa con ese RUC');
  });

  it('usa un mensaje genérico si el 409 no trae cuerpo', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 409 }))).toBe('No se pudo completar la operación');
  });

  it('pide revisar el formulario en un 400', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 400 }))).toBe('Revisa los datos del formulario');
  });

  it('no filtra detalles técnicos en un 500', () => {
    const err = new HttpErrorResponse({ status: 500, error: 'NullPointerException en línea 42' });
    expect(mensajeDeError(err)).toBe('Ocurrió un error inesperado. Intenta de nuevo');
  });
});
