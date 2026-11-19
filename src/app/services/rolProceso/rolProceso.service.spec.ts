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

  it('consultar envia nombre y paginacion, pero no empresaId (sale del token)', () => {
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

    service.consultar({ nombre: 'Ana', page: 0, size: 10, sort: 'nombre,asc' }).subscribe((resultado) => {
      expect(resultado).toEqual(pagina);
    });

    const peticion = httpTesting.expectOne(
      (req) => req.url === apiUrl
        && req.params.get('nombre') === 'Ana'
        && req.params.get('page') === '0'
        && req.params.get('size') === '10'
        && req.params.get('sort') === 'nombre,asc',
    );
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.has('empresaId')).toBe(false);
    peticion.flush(pagina);
  });

  it('listarTodos pide una pagina grande ordenada por nombre', () => {
    service.listarTodos().subscribe();

    const peticion = httpTesting.expectOne(
      (req) => req.url === apiUrl && req.params.get('size') === '200' && req.params.get('sort') === 'nombre,asc',
    );
    peticion.flush({ content: [] });
  });

  it('buscarPorId hace GET a /roles-proceso/{id} sin query params', () => {
    service.buscarPorId(1).subscribe((resultado) => {
      expect(resultado).toEqual(rol);
    });

    const peticion = httpTesting.expectOne(`${apiUrl}/1`);
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.keys()).toEqual([]);
    peticion.flush(rol);
  });

  it('crear envia solo nombre y descripcion', () => {
    service.crear({ nombre: 'Analista', descripcion: 'Analiza solicitudes' }).subscribe((resultado) => {
      expect(resultado).toEqual(rol);
    });

    const peticion = httpTesting.expectOne(apiUrl);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.params.has('usuarioId')).toBe(false);
    expect(peticion.request.body).toEqual({ nombre: 'Analista', descripcion: 'Analiza solicitudes' });
    peticion.flush(rol);
  });

  it('actualizar hace PUT a /roles-proceso/{id}', () => {
    service.actualizar(1, { nombre: 'Analista senior' }).subscribe((resultado) => {
      expect(resultado).toEqual(rol);
    });

    const peticion = httpTesting.expectOne(`${apiUrl}/1`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.params.has('usuarioId')).toBe(false);
    peticion.flush(rol);
  });

  it('eliminar hace DELETE a /roles-proceso/{id}', () => {
    service.eliminar(1).subscribe();

    const peticion = httpTesting.expectOne(`${apiUrl}/1`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null);
  });
});
