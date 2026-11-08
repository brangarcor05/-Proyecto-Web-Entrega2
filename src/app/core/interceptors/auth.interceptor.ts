import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AutenticacionService } from '../../services/auth/auth.service';

// Se ejecuta en CADA petición HTTP: añade el token y vigila los 401.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AutenticacionService);
  const router = inject(Router);

  const token = auth.token();
  // El token solo viaja hacia NUESTRA API, nunca hacia terceros
  const peticion = token && req.url.startsWith(environment.apiUrl)
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((err: HttpErrorResponse) => {
      // Token vencido o inválido: se cierra la sesión (el login mismo responde 401 con
      // credenciales malas y eso NO debe sacar al usuario de la pantalla)
      if (err.status === 401 && !req.url.endsWith('/auth/login')) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
