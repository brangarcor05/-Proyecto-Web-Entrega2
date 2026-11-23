import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActividadService } from './actividad.service';
import { Actividad, CreateActividadRequest, UpdateActividadRequest } from '../../models/bpmn/actividad/actividad.model';

describe('ActividadService', () => {
  let service: ActividadService;
  let http: HttpTestingController;
  const apiUrl = '/api/actividades';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ActividadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarPorProceso hace GET /proceso/{id}', () => {
    const mockActividad: Actividad = { id: 1, nombre: 'Tarea 1' } as any;
    
    service.listarPorProceso(10).subscribe(res => expect(res).toEqual([mockActividad]));
    
    const req = http.expectOne(`${apiUrl}/proceso/10`);
    expect(req.request.method).toBe('GET');
    req.flush([mockActividad]);
  });

  it('obtenerPorId hace GET /{id}', () => {
    const mockActividad: Actividad = { id: 5, nombre: 'Tarea 5' } as any;
    
    service.obtenerPorId(5).subscribe(res => expect(res).toEqual(mockActividad));
    
    const req = http.expectOne(`${apiUrl}/5`);
    expect(req.request.method).toBe('GET');
    req.flush(mockActividad);
  });

  it('crear hace POST /', () => {
    const nuevo: CreateActividadRequest = { nombre: 'Nueva Tarea' } as any;
    const creada: Actividad = { id: 2, ...nuevo } as any;

    service.crear(nuevo).subscribe(res => expect(res).toEqual(creada));
    
    const req = http.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevo);
    req.flush(creada);
  });

  it('actualizar hace PUT /{id}', () => {
    const cambios: UpdateActividadRequest = { nombre: 'Tarea Actualizada' } as any;
    const actualizada: Actividad = { id: 3, ...cambios } as any;

    service.actualizar(3, cambios).subscribe(res => expect(res).toEqual(actualizada));
    
    const req = http.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(cambios);
    req.flush(actualizada);
  });

  it('eliminar hace DELETE /{id}', () => {
    service.eliminar(4).subscribe();
    
    const req = http.expectOne(`${apiUrl}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});