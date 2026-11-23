import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmpresaService } from './Empresa.service';
import { CrearEmpresaRequest, Empresa } from '../../models/empresa/empresa.model';
import { environment } from '../../../environments/environment';

describe('EmpresaService', () => {
  let service: EmpresaService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/empresas`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EmpresaService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('crear hace POST /empresas con los datos de la empresa y del administrador', () => {
    const request: CrearEmpresaRequest = {
      nombre: 'Acme S.A.S.', rut: '900123456-7', razonSocial: 'Acme Sociedad Anónima',
      email: 'contacto@acme.com', adminNombre: 'Juan Pérez', adminPassword: 'claveSegura123'
    };
    service.crear(request).subscribe();

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush({ id: 1, nombre: 'Acme S.A.S.' } as Empresa);
  });

  it('obtener hace GET /empresas/{id}', () => {
    let resultado: Empresa | undefined;
    service.obtener(1).subscribe(e => (resultado = e));

    const req = http.expectOne(`${url}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, nombre: 'Acme S.A.S.' } as Empresa);

    expect(resultado?.nombre).toBe('Acme S.A.S.');
  });
});
