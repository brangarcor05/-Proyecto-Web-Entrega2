import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, rolGuard } from './auth.guard';
import { AutenticacionService } from '../../services/auth/auth.service';
import { sesionAdmin } from '../../testing/datos-prueba';

describe('guards de autenticación', () => {
  let sesion: ReturnType<typeof signal<ReturnType<AutenticacionService['sesion']>>>;
  let router: Router;

  // Los guards son funciones que usan inject(): se ejecutan dentro de un contexto de inyección
  function ejecutar(guard: CanActivateFn): boolean | UrlTree {
    return TestBed.runInInjectionContext(
      () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    ) as boolean | UrlTree;
  }

  beforeEach(() => {
    sessionStorage.clear();
    sesion = signal<ReturnType<AutenticacionService['sesion']>>(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AutenticacionService, useValue: { sesion } },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('authGuard permite el paso con sesión', () => {
    sesion.set(sesionAdmin);
    expect(ejecutar(authGuard)).toBe(true);
  });

  it('authGuard redirige a /login sin sesión', () => {
    const resultado = ejecutar(authGuard);
    expect(resultado instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  it('rolGuard permite el paso si el rol está autorizado', () => {
    sesion.set(sesionAdmin);
    expect(ejecutar(rolGuard('ADMIN'))).toBe(true);
  });

  it('rolGuard manda a /procesos si el rol NO está autorizado', () => {
    sesion.set({ ...sesionAdmin, rolUsuario: 'LECTURA' });
    const resultado = ejecutar(rolGuard('ADMIN', 'EDITOR'));
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/procesos');
  });

  it('rolGuard manda a /login si no hay sesión', () => {
    const resultado = ejecutar(rolGuard('ADMIN'));
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });
});
