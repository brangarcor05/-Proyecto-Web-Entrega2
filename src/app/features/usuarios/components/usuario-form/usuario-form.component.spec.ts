import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { UsuarioFormComponent } from './usuario-form.component';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { environment } from '../../../../../environments/environment';
import { sesionAdmin, usuarioEditor } from '../../../../testing/datos-prueba';

describe('UsuarioFormComponent', () => {
  let component: UsuarioFormComponent;
  let http: HttpTestingController;
  let destino: unknown[] | null;
  let authMock: any;
  const urlUsuarios = `${environment.apiUrl}/usuarios`;

  const datosValidos = {
    nombre: 'Ana Ruiz', email: 'ana@acme.com', rolUsuario: 'EDITOR' as const, password: 'claveSegura123'
  };

  beforeEach(async () => {
    // Creamos el mock del servicio con un signal real
    authMock = {
      sesion: signal(sesionAdmin),
      token: signal('token-falso'),
      esAdmin: signal(true),
      puedeEditar: signal(true)
    };

    await TestBed.configureTestingModule({
      imports: [UsuarioFormComponent],
      providers: [
        provideHttpClient(), 
        provideHttpClientTesting(), 
        provideRouter([]),
        { provide: AutenticacionService, useValue: authMock } // <-- AQUÍ USAMOS EL MOCK
      ]
    }).compileComponents();

    component = TestBed.createComponent(UsuarioFormComponent).componentInstance;
    http = TestBed.inject(HttpTestingController);

    destino = null;
    TestBed.inject(Router).navigate = ((c: unknown[]) => {
      destino = c;
      return Promise.resolve(true);
    }) as unknown as Router['navigate'];
  });

  afterEach(() => http.verify());

  it('el formulario nace inválido', () => {
    expect(component.form.invalid).toBe(true);
  });

  it('el rol por defecto es EDITOR', () => {
    expect(component.form.controls.rolUsuario.value).toBe('EDITOR');
  });

  it('sin datos válidos no llama al backend', () => {
    component.guardar();
    http.expectNone(urlUsuarios);
  });

  it('con datos válidos invita al usuario y vuelve a la lista', () => {
    component.form.setValue(datosValidos);

    component.guardar();
    const req = http.expectOne(urlUsuarios);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('ana@acme.com');
    req.flush(usuarioEditor);

    expect(destino).toEqual(['/usuarios']);
  });

  it('si el correo ya existe (409) muestra el mensaje y no navega', () => {
    component.form.setValue(datosValidos);

    component.guardar();
    http.expectOne(urlUsuarios).flush(
      { mensaje: 'El correo ana@acme.com ya está registrado' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(component.mensaje()).toContain('ya está registrado');
    expect(destino).toBeNull();
  });
});