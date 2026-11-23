import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { EmpresaFormComponent } from './empresa-form.component';
import { environment } from '../../../../environments/environment';

describe('EmpresaFormComponent', () => {
  let component: EmpresaFormComponent;
  let http: HttpTestingController;
  let destino: unknown[] | null;
  const urlEmpresas = `${environment.apiUrl}/empresas`;

  const datosValidos = {
    nombre: 'Acme S.A.S.', rut: '900123456-7', razonSocial: 'Acme Sociedad Anónima',
    email: 'contacto@acme.com', telefono: '', direccion: '', sector: '',
    adminNombre: 'Juan Pérez', adminPassword: 'claveSegura123'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmpresaFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    component = TestBed.createComponent(EmpresaFormComponent).componentInstance;
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

  it('exige mínimo 8 caracteres en la contraseña del administrador', () => {
    component.form.patchValue({ adminPassword: '1234567' });
    expect(component.form.controls.adminPassword.hasError('minlength')).toBe(true);

    component.form.patchValue({ adminPassword: '12345678' });
    expect(component.form.controls.adminPassword.hasError('minlength')).toBe(false);
  });

  it('sin datos válidos no llama al backend', () => {
    component.guardar();
    http.expectNone(urlEmpresas);
  });

  it('con datos válidos registra la empresa y navega al login', () => {
    component.form.setValue(datosValidos);

    component.guardar();
    const req = http.expectOne(urlEmpresas);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.rut).toBe('900123456-7');
    req.flush({ id: 1, adminUsuarioId: 10 });

    expect(destino).toEqual(['/login']);
  });

  it('si el RUT ya existe (409) muestra el mensaje del backend', () => {
    component.form.setValue(datosValidos);

    component.guardar();
    http.expectOne(urlEmpresas).flush(
      { mensaje: 'Ya existe una empresa registrada con el RUT 900123456-7' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(component.mensaje()).toContain('Ya existe una empresa');
    expect(destino).toBeNull();
  });
});
