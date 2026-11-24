import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiError } from '../../models/common/api-error.model';

export const errorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((response: HttpErrorResponse) => {
      if (response.status !== 0) {
        return throwError(() => response);
      }

      const networkError: ApiError = {
        estado: 0,
        error: 'NETWORK_ERROR',
        mensaje: 'No fue posible conectar con el servidor.',
        camposInvalidos: null,
        momento: new Date().toISOString(),
      };

      return throwError(
        () =>
          new HttpErrorResponse({
            error: networkError,
            status: 0,
            statusText: 'Network Error',
            url: response.url ?? undefined,
          }),
      );
    }),
  );
