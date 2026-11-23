import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { usuarioService } from './usuario.service';
import { environment } from '../../../environments/environment';
import { usuarioEditor } from '../../testing/datos-prueba';

describe('UsuarioService', () => {
  let service: usuarioService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/usuarios`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(usuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list hace GET /usuarios', () => {
    let resultado = [] as unknown[];
    service.list().subscribe(r => (resultado = r));

    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([usuarioEditor]);

    expect(resultado).toEqual([usuarioEditor]);
  });

  it('invitar hace POST /usuarios con el cuerpo de la invitación', () => {
    const body = { nombre: 'Ana Ruiz', email: 'ana@acme.com', rolUsuario: 'EDITOR' as const, password: 'claveSegura123' };
    service.invitar(body).subscribe();

    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(usuarioEditor);
  });

  it('cambiarRol hace PATCH /usuarios/{id}/rol', () => {
    service.cambiarRol(2, { rolUsuario: 'ADMIN' }).subscribe();

    const req = http.expectOne(`${url}/2/rol`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ rolUsuario: 'ADMIN' });
    req.flush({ ...usuarioEditor, rolUsuario: 'ADMIN' });
  });

  it('desactivar hace DELETE /usuarios/{id}', () => {
    service.desactivar(2).subscribe();

    const req = http.expectOne(`${url}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
