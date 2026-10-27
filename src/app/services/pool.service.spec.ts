import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { ActualizarPoolRequest } from '../models/pool/actualizar-pool-request.model';
import { CrearPoolRequest } from '../models/pool/crear-pool-request.model';
import { Pool } from '../models/pool/pool.model';
import { PoolService } from './pool.service';

describe('PoolService', () => {
  const apiUrl = `${environment.apiUrl}/pools`;
  const pool: Pool = {
    id: 2,
    procesoId: 8,
    nombre: 'Cliente',
    cajaNegra: false,
    esPropietario: false,
    activo: true,
  };

  let service: PoolService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoolService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PoolService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lista los pools de un proceso', () => {
    service.listarPorProceso(8).subscribe((resultado) => expect(resultado).toEqual([pool]));

    const request = httpTesting.expectOne(`${apiUrl}?procesoId=8`);
    expect(request.request.method).toBe('GET');
    request.flush([pool]);
  });

  it('consulta un pool por su identificador', () => {
    service.buscarPorId(2).subscribe((resultado) => expect(resultado).toEqual(pool));

    const request = httpTesting.expectOne(`${apiUrl}/2`);
    expect(request.request.method).toBe('GET');
    request.flush(pool);
  });

  it('crea un pool con el usuario de la sesión', () => {
    const body: CrearPoolRequest = { procesoId: 8, nombre: 'Cliente', cajaNegra: false };
    service.crear(body, 4).subscribe((resultado) => expect(resultado).toEqual(pool));

    const request = httpTesting.expectOne(`${apiUrl}?usuarioId=4`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush(pool, { status: 201, statusText: 'Created' });
  });

  it('actualiza un pool', () => {
    const body: ActualizarPoolRequest = { nombre: 'Cliente externo', cajaNegra: true };
    service.actualizar(2, body, 4).subscribe((resultado) => expect(resultado).toEqual(pool));

    const request = httpTesting.expectOne(`${apiUrl}/2?usuarioId=4`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush(pool);
  });

  it('elimina lógicamente un pool', () => {
    service.eliminar(2, 1).subscribe();

    const request = httpTesting.expectOne(`${apiUrl}/2?usuarioId=1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
