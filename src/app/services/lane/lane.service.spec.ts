import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Lane } from '../../models/bpmn/lane/lane.model';
import { LaneService } from './lane.service';

describe('LaneService', () => {
  const apiUrl = `${environment.apiUrl}/lanes`;

  const lane: Lane = {
    id: 1,
    poolId: 10,
    rolProcesoId: 2,
    rolProcesoNombre: 'Analista',
    orden: 0,
    activo: true,
  };

  let service: LaneService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LaneService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(LaneService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('listarPorPool envia poolId como query param', () => {
    service.listarPorPool(10).subscribe((resultado) => {
      expect(resultado).toEqual([lane]);
    });

    const peticion = httpTesting.expectOne((req) => req.url === apiUrl && req.params.get('poolId') === '10');
    expect(peticion.request.method).toBe('GET');
    peticion.flush([lane]);
  });

  it('crear envia usuarioId como query param y el body de creacion', () => {
    service.crear({ poolId: 10, rolProcesoId: 2 }, 5).subscribe((resultado) => {
      expect(resultado).toEqual(lane);
    });

    const peticion = httpTesting.expectOne((req) => req.url === apiUrl && req.params.get('usuarioId') === '5');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ poolId: 10, rolProcesoId: 2 });
    peticion.flush(lane);
  });

  it('actualizar hace PUT a /lanes/{id} con usuarioId', () => {
    service.actualizar(1, { rolProcesoId: 3 }, 5).subscribe((resultado) => {
      expect(resultado).toEqual(lane);
    });

    const peticion = httpTesting.expectOne((req) => req.url === `${apiUrl}/1` && req.params.get('usuarioId') === '5');
    expect(peticion.request.method).toBe('PUT');
    peticion.flush(lane);
  });

  it('reordenar hace PUT a /lanes/reordenar con poolId y usuarioId', () => {
    service.reordenar(10, { laneIdsEnOrden: [2, 1] }, 5).subscribe((resultado) => {
      expect(resultado).toEqual([lane]);
    });

    const peticion = httpTesting.expectOne(
      (req) => req.url === `${apiUrl}/reordenar` && req.params.get('poolId') === '10' && req.params.get('usuarioId') === '5',
    );
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({ laneIdsEnOrden: [2, 1] });
    peticion.flush([lane]);
  });

  it('eliminar hace DELETE a /lanes/{id} con usuarioId', () => {
    service.eliminar(1, 5).subscribe();

    const peticion = httpTesting.expectOne((req) => req.url === `${apiUrl}/1` && req.params.get('usuarioId') === '5');
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null);
  });
});
