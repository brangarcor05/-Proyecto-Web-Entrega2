import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginFormComponent } from './login-form.component';
import { environment } from '../../../../environments/environment';
import { sesionAdmin } from '../../../testing/datos-prueba';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let http: HttpTestingController;
  let destino: unknown[] | null;
  const urlLogin = `${environment.apiUrl}/auth/login`;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    component = TestBed.createComponent(LoginFormComponent).componentInstance;
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

  it('rechaza un correo con formato inválido', () => {
    component.form.patchValue({ email: 'no-es-correo', password: 'x' });
    expect(component.form.controls.email.invalid).toBe(true);
  });

  it('con el formulario inválido no llama al backend y marca los campos', () => {
    component.ingresar();

    http.expectNone(urlLogin);
    expect(component.form.controls.email.touched).toBe(true);
  });

  it('con credenciales válidas entra y navega a /usuarios', () => {
    component.form.setValue({ email: 'admin@acme.com', password: 'claveSegura123' });

    component.ingresar();
    http.expectOne(urlLogin).flush(sesionAdmin);

    expect(destino).toEqual(['/usuarios']);
    expect(component.cargando()).toBe(false);
  });

  it('con credenciales inválidas muestra el mensaje del backend y no navega', () => {
    component.form.setValue({ email: 'admin@acme.com', password: 'mala-clave' });

    component.ingresar();
    http.expectOne(urlLogin).flush(
      { mensaje: 'Correo o contraseña incorrectos' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(component.mensaje()).toBe('Correo o contraseña incorrectos');
    expect(destino).toBeNull();
    expect(component.cargando()).toBe(false);
  });
});
