import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { PageResponse } from '../models/common/page-response.model';
import { ActualizarProcesoRequest } from '../models/proceso/actualizar-proceso-request.model';
import { CompartirProcesoRequest } from '../models/proceso/compartir-proceso-request.model';
import { CrearProcesoRequest } from '../models/proceso/crear-proceso-request.model';
import { Historial } from '../models/proceso/historial.model';
import { Proceso } from '../models/proceso/proceso.model';
import { ProcesoService } from './proceso.service';

describe('ProcesoService', () => {
  const apiUrl = `${environment.apiUrl}/procesos`;

  const proceso: Proceso = {
    id: 1,
    empresaId: 1,
    empresaNombre: 'Procesos Javeriana',
    nombre: 'Solicitud de compra',
    descripcion: 'Proceso interno de compras',
    categoria: 'Compras',
    estado: 'BORRADOR',
    activo: true,
    compartido: false,
    soloLectura: false,
  };

  let service: ProcesoService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProcesoService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProcesoService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('consulta procesos con filtros y paginación', () => {
    const respuesta: PageResponse<Proceso> = {
      content: [proceso],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    };

    service
      .consultar({
        empresaId: 1,
        nombre: 'Solicitud',
        estado: 'BORRADOR',
        categoria: 'Compras',
        incluirInactivos: false,
        page: 0,
        size: 10,
        sort: 'id,asc',
      })
      .subscribe((pagina) => expect(pagina).toEqual(respuesta));

    const request = httpTesting.expectOne((candidate) => candidate.url === apiUrl);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('empresaId')).toBe('1');
    expect(request.request.params.get('nombre')).toBe('Solicitud');
    expect(request.request.params.get('estado')).toBe('BORRADOR');
    expect(request.request.params.get('categoria')).toBe('Compras');
    expect(request.request.params.get('incluirInactivos')).toBe('false');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('10');
    expect(request.request.params.get('sort')).toBe('id,asc');

    request.flush(respuesta);
  });

  it('busca un proceso por id y empresa', () => {
    service.buscarPorId(1, 2).subscribe((resultado) => {
      expect(resultado).toEqual(proceso);
    });

    const request = httpTesting.expectOne(`${apiUrl}/1?empresaId=2`);

    expect(request.request.method).toBe('GET');
    request.flush(proceso);
  });

  it('consulta el historial de un proceso', () => {
    const historial: Historial[] = [
      {
        id: 1,
        entidadTipo: 'PROCESO',
        entidadId: 1,
        accion: 'CREACION',
        detalle: 'Proceso creado',
        fecha: '2026-10-13T15:30:00',
        usuarioId: 1,
        usuarioNombre: 'Juan',
      },
    ];

    service.consultarHistorial(1, 2).subscribe((resultado) => {
      expect(resultado).toEqual(historial);
    });

    const request = httpTesting.expectOne(`${apiUrl}/1/historial?empresaId=2`);

    expect(request.request.method).toBe('GET');
    request.flush(historial);
  });

  it('crea un proceso', () => {
    const body: CrearProcesoRequest = {
      empresaId: 1,
      nombre: 'Solicitud de compra',
      descripcion: 'Proceso interno de compras',
      categoria: 'Compras',
    };

    service.crear(body, 3).subscribe((resultado) => {
      expect(resultado).toEqual(proceso);
    });

    const request = httpTesting.expectOne(`${apiUrl}?usuarioId=3`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush(proceso, { status: 201, statusText: 'Created' });
  });

  it('actualiza un proceso', () => {
    const body: ActualizarProcesoRequest = {
      nombre: 'Solicitud actualizada',
      descripcion: 'Descripción actualizada',
      categoria: 'Compras',
      estado: 'PUBLICADO',
    };

    service.actualizar(1, body, 3).subscribe((resultado) => {
      expect(resultado).toEqual(proceso);
    });

    const request = httpTesting.expectOne(`${apiUrl}/1?usuarioId=3`);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush(proceso);
  });

  it('comparte un proceso con otras empresas', () => {
    const body: CompartirProcesoRequest = {
      compartido: true,
      empresasIds: [2, 3],
    };

    service.compartir(1, body, 4).subscribe((resultado) => {
      expect(resultado).toEqual(proceso);
    });

    const request = httpTesting.expectOne(`${apiUrl}/1/comparticion?usuarioId=4`);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush(proceso);
  });

  it('elimina un proceso', () => {
    let completed = false;

    service.eliminar(1, 5).subscribe({
      complete: () => {
        completed = true;
      },
    });

    const request = httpTesting.expectOne(`${apiUrl}/1?usuarioId=5`);

    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });
});
