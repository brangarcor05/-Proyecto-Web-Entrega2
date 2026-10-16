import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { Evento } from '../models/evento/evento.model';
import { CrearEventoRequest } from '../models/evento/crear-evento-request.model';
import { ActualizarEventoRequest } from '../models/evento/actualizar-evento-request.model';
import { EventoService } from './evento.service';

describe('EventoService', () => {
  let service: EventoService;
  let httpTesting: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/eventos`;
  const respuesta: Evento = { id: 5, procesoId: 2, poolId: 3, nombre: 'Inicio', tipo: 'INICIO', posicionX: null, posicionY: 0, activo: true };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EventoService);
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
