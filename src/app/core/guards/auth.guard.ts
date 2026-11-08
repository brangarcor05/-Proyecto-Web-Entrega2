import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolUsuario } from '../../models/usuario/usuario.model';
import { AutenticacionService } from '../../services/auth/auth.service';

// Exige haber iniciado sesión
export const authGuard: CanActivateFn = () => {
  const auth = inject(AutenticacionService);
  const router = inject(Router);
  return auth.sesion() ? true : router.createUrlTree(['/login']);
};

// Exige además uno de los roles indicados. Uso en rutas: canActivate: [rolGuard('ADMIN')]
// OJO: esto es solo comodidad de interfaz. La seguridad real está en el backend (@PreAuthorize).
export const rolGuard = (...roles: RolUsuario[]): CanActivateFn => () => {
  const auth = inject(AutenticacionService);
  const router = inject(Router);
  const sesion = auth.sesion();
  if (!sesion) return router.createUrlTree(['/login']);
  return roles.includes(sesion.rolUsuario) ? true : router.createUrlTree(['/usuarios']);
};
