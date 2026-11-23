import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { UsuarioListComponent } from './usuario-list.component';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { environment } from '../../../../../environments/environment';
import { sesionAdmin, usuarioEditor } from '../../.././../testing/datos-prueba';

describe('UsuarioListComponent', () => {
  let http: HttpTestingController;
  let authMock: any;
  let destino: unknown[] | null;
  const urlLista = `${environment.apiUrl}/usuarios`;

  beforeEach(async () => {
    // Creamos el mock del servicio
    authMock = {
      sesion: signal(null), // Inicialmente sin sesión
      token: signal(null),
      esAdmin: signal(false),
      puedeEditar: signal(false),
      logout: vi.fn() // Mock del método logout
    };

    await TestBed.configureTestingModule({
      imports: [UsuarioListComponent],
      providers: [
        provideHttpClient(), 
        provideHttpClientTesting(), 
        provideRouter([]),
        { provide: AutenticacionService, useValue: authMock } // <-- AQUÍ USAMOS EL MOCK
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);

    destino = null;
    TestBed.inject(Router).navigate = ((c: unknown[]) => {
      destino = c;
      return Promise.resolve(true);
    }) as unknown as Router['navigate'];
  });

  afterEach(() => http.verify());

  it('sin sesión redirige al login y no consulta al backend', () => {
    // authMock.sesion ya es null por defecto
    const fixture = TestBed.createComponent(UsuarioListComponent);
    fixture.detectChanges(); 

    expect(destino).toEqual(['/login']);
    http.expectNone(urlLista);
  });

  it('con sesión carga los usuarios y pasa a estado success', () => {
    authMock.sesion.set(sesionAdmin); // <-- AHORA SÍ FUNCIONA (es un signal real)
    const fixture = TestBed.createComponent(UsuarioListComponent);
    fixture.detectChanges();

    http.expectOne(urlLista).flush([usuarioEditor]);

    expect(fixture.componentInstance.usuarios().length).toBe(1);
    expect(fixture.componentInstance.status()).toBe('success');
  });

  it('si el backend falla pasa a estado error con un mensaje', () => {
    authMock.sesion.set(sesionAdmin);
    const fixture = TestBed.createComponent(UsuarioListComponent);
    fixture.detectChanges();

    http.expectOne(urlLista).flush(null, { status: 500, statusText: 'Server Error' });

    expect(fixture.componentInstance.status()).toBe('error');
    expect(fixture.componentInstance.message()).toContain('Ocurrió un error');
  });

  it('cerrarSesion limpia la sesión y navega al login', () => {
    authMock.sesion.set(sesionAdmin);
    const fixture = TestBed.createComponent(UsuarioListComponent);
    fixture.detectChanges();
    http.expectOne(urlLista).flush([]);

    fixture.componentInstance.cerrarSesion();

    // Verificamos que se llamó al logout del mock
    expect(authMock.logout).toHaveBeenCalled();
    expect(destino).toEqual(['/login']);
  });
});