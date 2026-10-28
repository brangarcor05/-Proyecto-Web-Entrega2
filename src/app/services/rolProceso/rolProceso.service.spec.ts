import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { PageResponse } from '../../models/common/page-response.model';
import { RolProceso } from '../../models/bpmn/rolProceso/rolProceso.model';
import { RolProcesoService } from './rolProceso.service';

describe('RolProcesoService', () => {
  const apiUrl = `${environment.apiUrl}/roles-proceso`;

  const rol: RolProceso = {
    id: 1,
    empresaId: 1,
    nombre: 'Analista',
    descripcion: 'Analiza solicitudes',
    activo: true,
    enUso: false,
    procesosDondeSeUsa: [],
  };

  let service: RolProcesoService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RolProcesoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(RolProcesoService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('consultar envia empresaId, nombre y paginacion como query params', () => {
    const pagina: PageResponse<RolProceso> = {
      content: [rol],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    };

    service.consultar({ empresaId: 1, nombre: 'Ana', page: 0, size: 10, sort: 'nombre,asc' }).subscribe((resultado) => {
      expect(resultado).toEqual(pagina);
    });

    const peticion = httpTesting.expectOne(
      (req) => req.url === apiUrl
        && req.params.get('empresaId') === '1'
        && req.params.get('nombre') === 'Ana'
        && req.params.get('page') === '0'
        && req.params.get('size') === '10'
        && req.params.get('sort') === 'nombre,asc',
    );
    expect(peticion.request.method).toBe('GET');
    peticion.flush(pagina);
  });

  it('buscarPorId envia empresaId como query param', () => {
    service.buscarPorId(1, 1).subscribe((resultado) => {
      expect(resultado).toEqual(rol);
    });

    const peticion = httpTesting.expectOne((req) => req.url === `${apiUrl}/1` && req.params.get('empresaId') === '1');
    expect(peticion.request.method).toBe('GET');
    peticion.flush(rol);
  });

  it('crear envia usuarioId como query param y el body de creacion', () => {
    service.crear({ empresaId: 1, nombre: 'Analista', descripcion: 'Analiza solicitudes' }, 5).subscribe((resultado) => {
      expect(resultado).toEqual(rol);
    });

    const peticion = httpTesting.expectOne((req) => req.url === apiUrl && req.params.get('usuarioId') === '5');
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ empresaId: 1, nombre: 'Analista', descripcion: 'Analiza solicitudes' });
    peticion.flush(rol);
  });

  it('actualizar hace PUT a /roles-proceso/{id} con usuarioId', () => {
    service.actualizar(1, { nombre: 'Analista senior' }, 5).subscribe((resultado) => {
      expect(resultado).toEqual(rol);
    });

    const peticion = httpTesting.expectOne((req) => req.url === `${apiUrl}/1` && req.params.get('usuarioId') === '5');
    expect(peticion.request.method).toBe('PUT');
    peticion.flush(rol);
  });

  it('eliminar hace DELETE a /roles-proceso/{id} con usuarioId', () => {
    service.eliminar(1, 5).subscribe();

    const peticion = httpTesting.expectOne((req) => req.url === `${apiUrl}/1` && req.params.get('usuarioId') === '5');
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null);
  });
});
