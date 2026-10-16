import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { NotificacionExterna } from '../models/notificacionexterna/notificacion-externa.model';
import { CrearNotificacionExternaRequest } from '../models/notificacionexterna/crear-notificacion-externa-request.model';
import { ActualizarNotificacionExternaRequest } from '../models/notificacionexterna/actualizar-notificacion-externa-request.model';
import { NotificacionExternaService } from './notificacion-externa.service';

describe('NotificacionExternaService', () => {
  let service: NotificacionExternaService;
  let httpTesting: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/notificaciones-externas`;
  const respuesta: NotificacionExterna = {
    id: 5,
    procesoId: 2,
    poolId: 3,
    poolDestinoId: 4,
    nombre: 'Aviso',
    tipoDestino: 'CORREO',
    momentoProceso: null,
    accionSiFalla: 'DERIVAR_ERROR',
    actividadManejoErrorId: 6,
    campos: [{ nombre: 'correo', tipoDato: 'String' }],
    posicionX: 0,
    posicionY: null,
    activo: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificacionExternaService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('lista por proceso y conserva los valores nulos de la respuesta', () => {
    service.listarPorProceso(2).subscribe((datos) => expect(datos).toEqual([respuesta]));
    const req = httpTesting.expectOne(`${apiUrl}?procesoId=2`);
    expect(req.request.method).toBe('GET');
    req.flush([respuesta]);
  });

  it('consulta un elemento por su identificador', () => {
    service.buscarPorId(5).subscribe((datos) => expect(datos).toEqual(respuesta));
    const req = httpTesting.expectOne(`${apiUrl}/5`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush(respuesta);
  });

  it('acepta un listado vacio', () => {
    service.listarPorProceso(2).subscribe((datos) => expect(datos).toEqual([]));
    httpTesting.expectOne(`${apiUrl}?procesoId=2`).flush([]);
  });

  it('crea con el cuerpo y el usuario indicados', () => {
    const request: CrearNotificacionExternaRequest = {
      procesoId: 2,
      poolId: 3,
      poolDestinoId: 4,
      nombre: 'Aviso',
      tipoDestino: 'CORREO',
      accionSiFalla: 'DERIVAR_ERROR',
      actividadManejoErrorId: 6,
      campos: [{ nombre: 'correo', tipoDato: 'String' }],
    };
    service.crear(request, 7).subscribe((datos) => expect(datos).toEqual(respuesta));
    const req = httpTesting.expectOne(`${apiUrl}?usuarioId=7`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(respuesta, { status: 201, statusText: 'Created' });
  });

  it('actualiza sin enviar proceso ni pool contenedor', () => {
    const request: ActualizarNotificacionExternaRequest = {
      nombre: 'Aviso actualizado',
      poolDestinoId: 4,
      tipoDestino: 'CORREO',
      accionSiFalla: 'DERIVAR_ERROR',
      actividadManejoErrorId: 6,
      campos: [],
    };
    const actualizada = { ...respuesta, ...request };
    service.actualizar(5, request, 7).subscribe((datos) => expect(datos).toEqual(actualizada));
    const req = httpTesting.expectOne(`${apiUrl}/5?usuarioId=7`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    expect(req.request.body.procesoId).toBeUndefined();
    expect(req.request.body.poolId).toBeUndefined();
    req.flush(actualizada);
  });

  it('elimina y acepta una respuesta sin contenido', () => {
    let completada = false;
    service.eliminar(5, 7).subscribe({
      complete: () => {
        completada = true;
      },
    });
    const req = httpTesting.expectOne(`${apiUrl}/5?usuarioId=7`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toBeNull();
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(completada).toBe(true);
  });

  it('propaga el recurso no encontrado sin convertirlo en una respuesta valida', () => {
    const error = { mensaje: 'Recurso no encontrado' };
    service.buscarPorId(99).subscribe({
      next: () => {
        throw new Error('La consulta debia fallar');
      },
      error: (response) => {
        expect(response.status).toBe(404);
        expect(response.error).toEqual(error);
      },
    });
    httpTesting.expectOne(`${apiUrl}/99`).flush(error, {
      status: 404,
      statusText: 'Not Found',
    });
  });

  it('propaga la denegacion de permisos al eliminar', () => {
    service.eliminar(5, 7).subscribe({
      next: () => {
        throw new Error('La eliminacion debia fallar');
      },
      error: (response) => expect(response.status).toBe(403),
    });
    httpTesting.expectOne(`${apiUrl}/5?usuarioId=7`).flush(null, {
      status: 403,
      statusText: 'Forbidden',
    });
  });
});
