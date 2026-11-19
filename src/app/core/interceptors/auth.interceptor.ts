import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AutenticacionService } from '../../services/auth/auth.service';

/** Endpoints de sesión: no llevan access token ni disparan una renovación. */
const RUTAS_DE_SESION = ['/auth/login', '/auth/refresh', '/auth/logout'];

/**
 * Se ejecuta en CADA petición HTTP:
 *  1. Añade el access token (corta duración) a las peticiones hacia NUESTRA API.
 *  2. Si la API responde 401 (access token vencido), pide un par nuevo con el refresh
 *     token (larga duración) y repite la petición UNA vez con el token nuevo.
 *  3. Si el refresh token tampoco sirve, cierra la sesión y lleva al login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AutenticacionService);
  const router = inject(Router);

  const esNuestraApi = req.url.startsWith(environment.apiUrl);
  const esRutaDeSesion = RUTAS_DE_SESION.some((ruta) => req.url.endsWith(ruta));
  if (!esNuestraApi || esRutaDeSesion) {
    return next(req);
  }

  const tokenEnviado = auth.accessToken();

  return next(conToken(req, tokenEnviado)).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Otra petición ya renovó mientras esta viajaba: basta con reintentar
      const tokenActual = auth.accessToken();
      if (tokenActual && tokenActual !== tokenEnviado) {
        return next(conToken(req, tokenActual));
      }

      if (!auth.refreshToken()) {
        terminarSesion(auth, router);
        return throwError(() => error);
      }

      return auth.renovar().pipe(
        // Este catchError va ANTES del switchMap: solo atrapa fallos de la renovación,
        // no los de la petición reintentada.
        catchError((errorRenovacion: unknown) => {
          const sesionInvalida =
            !(errorRenovacion instanceof HttpErrorResponse) ||
            errorRenovacion.status === 401 ||
            errorRenovacion.status === 400;
          if (sesionInvalida) {
            terminarSesion(auth, router);
          }
          return throwError(() => error);
        }),
        switchMap((sesion) => next(conToken(req, sesion.accessToken))),
      );
    }),
  );
};

function conToken<T>(req: HttpRequest<T>, token: string | null): HttpRequest<T> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

function terminarSesion(auth: AutenticacionService, router: Router): void {
  auth.cerrarSesionLocal();
  void router.navigate(['/login']);
}
