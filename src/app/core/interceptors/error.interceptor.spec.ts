import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiError } from '../../models/common/api-error.model';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('propaga el cuerpo de error enviado por el backend', () => {
    const backendError: ApiError = {
      estado: 404,
      error: 'No encontrado',
      mensaje: 'Proceso no encontrado: 1',
      camposInvalidos: null,
      momento: '2026-10-13T12:00:00',
    };

    http.get('/api/procesos/1').subscribe({
      error: (response) => {
        expect(response.status).toBe(404);
        expect(response.error).toEqual(backendError);
      },
    });

    httpTesting.expectOne('/api/procesos/1').flush(backendError, {
      status: 404,
      statusText: 'Not Found',
    });
  });

  it('convierte un fallo de red en un error comprensible', () => {
    http.get('/api/procesos').subscribe({
      error: (response) => {
        expect(response.status).toBe(0);
        expect(response.error.error).toBe('NETWORK_ERROR');
        expect(response.error.mensaje).toBe('No fue posible conectar con el servidor.');
      },
    });

    httpTesting.expectOne('/api/procesos').error(new ProgressEvent('error'));
  });
});
