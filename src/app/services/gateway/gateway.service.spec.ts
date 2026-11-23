import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GatewayService } from './gateway.service';
import { Gateway, NewGateway } from '../../models/bpmn/gateway/gateway.model';

describe('GatewayService', () => {
  let service: GatewayService;
  let http: HttpTestingController;
  const apiUrl = '/api/gateways';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(GatewayService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listarPorProceso hace GET /proceso/{id}', () => {
    const mockGateway: Gateway = { id: 1, nombre: 'Decisión', tipo: 'EXCLUSIVO' } as any;
    
    service.listarPorProceso(10).subscribe(res => expect(res).toEqual([mockGateway]));
    
    const req = http.expectOne(`${apiUrl}/proceso/10`);
    expect(req.request.method).toBe('GET');
    req.flush([mockGateway]);
  });

  it('obtenerPorId hace GET /{id}', () => {
    const mockGateway: Gateway = { id: 5, nombre: 'Gateway 5' } as any;
    
    service.obtenerPorId(5).subscribe(res => expect(res).toEqual(mockGateway));
    
    const req = http.expectOne(`${apiUrl}/5`);
    expect(req.request.method).toBe('GET');
    req.flush(mockGateway);
  });

  it('crear hace POST /', () => {
    const nuevo: NewGateway = { nombre: 'Nuevo', tipo: 'PARALELO' } as any;
    const creado: Gateway = { id: 2, ...nuevo } as any;

    service.crear(nuevo).subscribe(res => expect(res).toEqual(creado));
    
    const req = http.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(nuevo);
    req.flush(creado);
  });

  it('actualizar hace PUT /{id}', () => {
    const cambios: NewGateway = { nombre: 'Actualizado' } as any;
    const actualizado: Gateway = { id: 3, ...cambios } as any;

    service.actualizar(3, cambios).subscribe(res => expect(res).toEqual(actualizado));
    
    const req = http.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(cambios);
    req.flush(actualizado);
  });

  it('eliminar hace DELETE /{id}', () => {
    service.eliminar(4).subscribe();
    
    const req = http.expectOne(`${apiUrl}/4`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});