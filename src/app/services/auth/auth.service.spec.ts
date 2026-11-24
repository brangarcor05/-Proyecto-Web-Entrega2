import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { sesionDePrueba } from '../../testing/sesion-de-prueba';
import { AutenticacionService, CLAVE_SESION } from './auth.service';

describe('AutenticacionService', () => {
  const url = `${environment.apiUrl}/auth`;
  let service: AutenticacionService;
  let http: HttpTestingController;

  function crear(): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AutenticacionService);
    http = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('login guarda ambos tokens y expone los datos del usuario', () => {
    crear();
    service.login({ email: 'ana@acme.com', password: 'clave' }).subscribe();

    const peticion = http.expectOne(`${url}/login`);
    expect(peticion.request.method).toBe('POST');
    peticion.flush(sesionDePrueba());

    expect(service.accessToken()).toBe('access-1');
    expect(service.refreshToken()).toBe('refresh-1');
    expect(service.sesion()?.empresaNombre).toBe('Acme');
    expect(service.esAdmin()).toBe(true);
    expect(JSON.parse(localStorage.getItem(CLAVE_SESION)!).refreshToken).toBe('refresh-1');
  });

  it('recupera la sesion guardada al recargar la pagina', () => {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionDePrueba()));
    crear();
    expect(service.accessToken()).toBe('access-1');
  });

  it('descarta una sesion antigua guardada con un solo token', () => {
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ usuarioId: 3, token: 'viejo' }));
    crear();
    expect(service.sesion()).toBeNull();
  });

  it('renovar envia el refresh token y guarda el par nuevo', () => {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionDePrueba()));
    crear();

    service.renovar().subscribe();
    const peticion = http.expectOne(`${url}/refresh`);
    expect(peticion.request.body).toEqual({ refreshToken: 'refresh-1' });
    peticion.flush(sesionDePrueba({ accessToken: 'access-2', refreshToken: 'refresh-2' }));

    expect(service.accessToken()).toBe('access-2');
    expect(service.refreshToken()).toBe('refresh-2');
  });

  it('varias renovaciones simultaneas comparten una sola peticion', () => {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionDePrueba()));
    crear();

    const recibidos: string[] = [];
    service.renovar().subscribe((s) => recibidos.push(s.accessToken));
    service.renovar().subscribe((s) => recibidos.push(s.accessToken));

    http.expectOne(`${url}/refresh`).flush(sesionDePrueba({ accessToken: 'access-2' }));
    expect(recibidos).toEqual(['access-2', 'access-2']);
  });

  it('logout revoca el refresh token en el backend y borra la sesion local', () => {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionDePrueba()));
    crear();

    service.logout();

    expect(service.sesion()).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
    const peticion = http.expectOne(`${url}/logout`);
    expect(peticion.request.body).toEqual({ refreshToken: 'refresh-1' });
    peticion.flush(null, { status: 204, statusText: 'No Content' });
  });
});
