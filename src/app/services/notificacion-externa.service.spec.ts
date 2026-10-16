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
  const respuesta: NotificacionExterna = { id: 5, procesoId: 2, poolId: 3, poolDestinoId: 4, nombre: 'Aviso', tipoDestino: 'CORREO', momentoProceso: null, accionSiFalla: 'DERIVAR_ERROR', actividadManejoErrorId: 6, campos: [{ nombre: 'correo', tipoDato: 'String' }], posicionX: 0, posicionY: null, activo: true };

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
});
