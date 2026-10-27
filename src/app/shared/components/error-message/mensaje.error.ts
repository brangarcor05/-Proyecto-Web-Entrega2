import { HttpErrorResponse } from '@angular/common/http';


export function mensajeDeError(err: HttpErrorResponse): string {
  if (err.status === 0) return 'No hay conexión con el servidor';
  if ([401, 403, 404, 409].includes(err.status)) {
    return err.error?.mensaje ?? 'No se pudo completar la operación';
  }
  if (err.status === 400) return 'Revisa los datos del formulario';
  return 'Ocurrió un error inesperado. Intenta de nuevo';
}