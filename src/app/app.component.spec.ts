import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { App } from './app.component';
import { AutenticacionService } from './services/auth/auth.service';

describe('App', () => {
  let authMock: any;
  let router: Router;

  beforeEach(async () => {
    authMock = {
      sesion: signal(null),
      logout: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AutenticacionService, useValue: authMock }
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debería mostrar enlaces de login cuando no hay sesión', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('Ingresar');
    expect(compiled.textContent).toContain('Registrar empresa');
  });

  it('debería mostrar enlaces de admin cuando el rol es ADMIN', () => {
    authMock.sesion.set({ 
      nombre: 'Admin', empresaNombre: 'Acme', rolUsuario: 'ADMIN' 
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.textContent).toContain('Procesos');
    expect(compiled.textContent).toContain('Usuarios');
    expect(compiled.textContent).toContain('Permisos de pools');
  });

  it('debería llamar a logout y navegar al login', () => {
    authMock.sesion.set({ 
      nombre: 'Editor', empresaNombre: 'Acme', rolUsuario: 'EDITOR' 
    });
    const fixture = TestBed.createComponent(App);
    
    fixture.componentInstance.cerrarSesion();

    expect(authMock.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});