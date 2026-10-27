import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { ConfigurarPermisoPoolRequest } from '../../models/permisopool/configurar-permiso-pool-request.model';
import { PermisoPool } from '../../models/permisopool/permiso-pool.model';
import { PermisoPoolService } from './permiso-pool.service';

describe('PermisoPoolService', () => {
  const apiUrl = `${environment.apiUrl}/permisos-pool`;
  const permiso: PermisoPool = {
    id: null,
    empresaId: 3,
    rolUsuario: 'EDITOR',
    puedeCrear: true,
    puedeEditar: true,
    puedeEliminar: false,
    configurado: false,
  };

  let service: PermisoPoolService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PermisoPoolService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PermisoPoolService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('consulta los permisos de la empresa autenticada', () => {
    service.consultar(3).subscribe((resultado) => expect(resultado).toEqual([permiso]));

    const request = httpTesting.expectOne(`${apiUrl}?empresaId=3`);
    expect(request.request.method).toBe('GET');
    request.flush([permiso]);
  });

  it('configura los permisos de un rol con el usuario administrador', () => {
    const body: ConfigurarPermisoPoolRequest = {
      rolUsuario: 'EDITOR',
      puedeCrear: true,
      puedeEditar: true,
      puedeEliminar: true,
    };
    const actualizado: PermisoPool = { ...permiso, id: 8, puedeEliminar: true, configurado: true };

    service.configurar(body, 5).subscribe((resultado) => expect(resultado).toEqual(actualizado));

    const request = httpTesting.expectOne(`${apiUrl}?usuarioId=5`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    request.flush(actualizado);
  });
});
