import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { Empresa } from '../../models/empresa/empresa.model';
import { EmpresaService } from './Empresa.service';

describe('EmpresaService', () => {
  let service: EmpresaService;
  let httpTesting: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/empresas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EmpresaService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('lista las empresas disponibles', () => {
    const empresa = {
      id: 2,
      nombre: 'Beta',
      rut: '900000002',
      razonSocial: 'Beta S.A.S.',
      email: 'beta@example.com',
      estado: 'ACTIVO',
      fechaRegistro: '2026-10-26T10:00:00',
      adminUsuarioId: 4,
    } satisfies Empresa;

    service.listar().subscribe((respuesta) => expect(respuesta).toEqual([empresa]));

    const req = httpTesting.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([empresa]);
  });
});
