import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ApiError } from '../../models/common/api-error.model';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  obtenerMensaje(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Ocurrió un error inesperado.';
    }

    const apiError = this.obtenerApiError(error);
    return apiError?.mensaje ?? error.message ?? 'No fue posible completar la operación.';
  }

  obtenerCamposInvalidos(error: unknown): Record<string, string> {
    if (!(error instanceof HttpErrorResponse)) {
      return {};
    }

    return this.obtenerApiError(error)?.camposInvalidos ?? {};
  }

  private obtenerApiError(error: HttpErrorResponse): ApiError | null {
    const cuerpo: unknown = error.error;
    if (typeof cuerpo !== 'object' || cuerpo === null || !('mensaje' in cuerpo)) {
      return null;
    }

    return cuerpo as ApiError;
  }
}
