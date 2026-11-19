import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { CLAVE_SESION, AutenticacionService } from '../../services/auth/auth.service';
import { sesionDePrueba } from '../../testing/sesion-de-prueba';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const api = environment.apiUrl;
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AutenticacionService;
  const navegaciones: unknown[][] = [];

  beforeEach(() => {
    localStorage.clear();
    navegaciones.length = 0;
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionDePrueba()));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: (ruta: unknown[]) => navegaciones.push(ruta) } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AutenticacionService);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('agrega el access token a las peticiones a la API', () => {
    http.get(`${api}/procesos`).subscribe();
    const peticion = backend.expectOne(`${api}/procesos`);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer access-1');
    peticion.flush([]);
  });

  it('no envia el token a otros dominios ni a los endpoints de sesion', () => {
    http.get('https://otro.com/datos').subscribe();
    http.post(`${api}/auth/refresh`, {}).subscribe();

    const externa = backend.expectOne('https://otro.com/datos');
    const refresh = backend.expectOne(`${api}/auth/refresh`);
    expect(externa.request.headers.has('Authorization')).toBe(false);
    expect(refresh.request.headers.has('Authorization')).toBe(false);
    externa.flush({});
    refresh.flush(sesionDePrueba());
  });

  it('ante un 401 renueva con el refresh token y repite la peticion', () => {
    let respuesta: unknown;
    http.get(`${api}/procesos`).subscribe((r) => (respuesta = r));

    backend.expectOne(`${api}/procesos`).flush(null, { status: 401, statusText: 'Unauthorized' });

    const refresh = backend.expectOne(`${api}/auth/refresh`);
    expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
    refresh.flush(sesionDePrueba({ accessToken: 'access-2', refreshToken: 'refresh-2' }));

    const reintento = backend.expectOne(`${api}/procesos`);
    expect(reintento.request.headers.get('Authorization')).toBe('Bearer access-2');
    reintento.flush(['ok']);

    expect(respuesta).toEqual(['ok']);
    expect(auth.refreshToken()).toBe('refresh-2');
  });

  it('si el refresh token tampoco sirve, cierra la sesion y va al login', () => {
    let error: unknown;
    http.get(`${api}/procesos`).subscribe({ error: (e) => (error = e) });

    backend.expectOne(`${api}/procesos`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${api}/auth/refresh`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(error).toBeTruthy();
    expect(auth.sesion()).toBeNull();
    expect(navegaciones).toEqual([['/login']]);
  });

  it('un 403 no dispara la renovacion', () => {
    let estado = 0;
    http.post(`${api}/roles-proceso`, {}).subscribe({ error: (e) => (estado = e.status) });

    backend.expectOne(`${api}/roles-proceso`).flush(null, { status: 403, statusText: 'Forbidden' });

    backend.expectNone(`${api}/auth/refresh`);
    expect(estado).toBe(403);
    expect(auth.sesion()).not.toBeNull();
  });

  it('dos peticiones con 401 a la vez hacen una sola renovacion', () => {
    http.get(`${api}/procesos`).subscribe();
    http.get(`${api}/pools`).subscribe();

    backend.expectOne(`${api}/procesos`).flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne(`${api}/pools`).flush(null, { status: 401, statusText: 'Unauthorized' });

    backend.expectOne(`${api}/auth/refresh`)
      .flush(sesionDePrueba({ accessToken: 'access-2', refreshToken: 'refresh-2' }));

    const reintentos = backend.match((req) => req.headers.get('Authorization') === 'Bearer access-2');
    expect(reintentos.length).toBe(2);
    reintentos.forEach((p) => p.flush([]));
  });
});
