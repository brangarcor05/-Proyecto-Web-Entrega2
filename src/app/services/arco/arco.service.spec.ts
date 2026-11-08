import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ActualizarArcoRequest } from '../../models/arco/actualizar-arco-request.model';
import { ArcoEliminado } from '../../models/arco/arco-eliminado.model';
import { Arco } from '../../models/arco/arco.model';
import { CrearArcoRequest } from '../../models/arco/crear-arco-request.model';
import { SincronizarArcoRequest } from '../../models/arco/sincronizar-arco-request.model';
import { ArcoService } from './arco.service';

describe('ArcoService', () => {
  const apiUrl = `${environment.apiUrl}/arcos`;
  const arco: Arco = {
    id: 7,
    procesoId: 3,
    origenId: 10,
    origenNombre: 'Validar solicitud',
    destinoId: 11,
    destinoNombre: 'Aprobar solicitud',
    etiqueta: 'Aprobada',
    condicion: null,
    canvasId: 'Flow_1',
    activo: true,
  };

  let service: ArcoService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ArcoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ArcoService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lista los arcos de un proceso', () => {
    service.listarPorProceso(3).subscribe((resultado) => expect(resultado).toEqual([arco]));

    const request = httpTesting.expectOne(`${apiUrl}?procesoId=3`);
    expect(request.request.method).toBe('GET');
    request.flush([arco]);
  });

  it('consulta un arco por su identificador', () => {
    service.buscarPorId(7).subscribe((resultado) => expect(resultado).toEqual(arco));

    const request = httpTesting.expectOne(`${apiUrl}/7`);
    expect(request.request.method).toBe('GET');
    request.flush(arco);
  });

  it('crea un arco con el usuario de la sesión', () => {
    const body: CrearArcoRequest = {
      procesoId: 3,
      origenId: 10,
      destinoId: 11,
      etiqueta: 'Aprobada',
      condicion: null,
    };
    service.crear(body, 4).subscribe((resultado) => expect(resultado).toEqual(arco));

    const request = httpTesting.expectOne(`${apiUrl}?usuarioId=4`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush(arco, { status: 201, statusText: 'Created' });
  });

  it('actualiza los extremos y datos editables de un arco', () => {
    const body: ActualizarArcoRequest = {
      origenId: 12,
      destinoId: 13,
      etiqueta: 'Revisada',
      condicion: 'monto > 1000',
    };
    service.actualizar(7, body, 4).subscribe((resultado) => expect(resultado).toEqual(arco));

    const request = httpTesting.expectOne(`${apiUrl}/7?usuarioId=4`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush(arco);
  });

  it('elimina un arco y conserva las advertencias del backend', () => {
    const respuesta: ArcoEliminado = {
      id: 7,
      advertencias: ["'Validar solicitud' queda sin camino de salida"],
    };
    service.eliminar(7, 4).subscribe((resultado) => expect(resultado).toEqual(respuesta));

    const request = httpTesting.expectOne(`${apiUrl}/7?usuarioId=4`);
    expect(request.request.method).toBe('DELETE');
    request.flush(respuesta);
  });

  it('sincroniza los flujos visuales de un proceso', () => {
    const body: SincronizarArcoRequest[] = [{
      canvasId: 'Flow_1',
      origenCanvasId: 'StartEvent_1',
      destinoCanvasId: 'Activity_1',
      etiqueta: 'Continuar',
      condicion: null,
    }];

    service.sincronizar(3, body, 4).subscribe((resultado) => expect(resultado).toEqual([arco]));

    const request = httpTesting.expectOne(`${apiUrl}/sincronizar?procesoId=3&usuarioId=4`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush([arco]);
  });

  it('propaga las validaciones de negocio del backend', () => {
    service.crear({ procesoId: 3, origenId: 10, destinoId: 10 }, 4).subscribe({
      next: () => {
        throw new Error('La creación debía fallar');
      },
      error: (error) => expect(error.status).toBe(400),
    });

    httpTesting.expectOne(`${apiUrl}?usuarioId=4`).flush(
      { mensaje: 'Un arco no puede tener el mismo elemento como origen y destino' },
      { status: 400, statusText: 'Bad Request' },
    );
  });
});
