import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso.service';
import { ProcesoDetailComponent } from './proceso-detail.component';

describe('ProcesoDetailComponent', () => {
  const sesionAdmin: SesionResponse = {
    usuarioId: 1,
    nombre: 'Admin',
    email: 'admin@example.com',
    rolUsuario: 'ADMIN',
    empresaId: 4,
    empresaNombre: 'Empresa',
  };
  const proceso: Proceso = {
    id: 9,
    empresaId: 4,
    empresaNombre: 'Empresa',
    nombre: 'Proceso',
    descripcion: 'Descripción',
    categoria: 'Operaciones',
    estado: 'BORRADOR',
    activo: true,
    compartido: false,
    soloLectura: false,
  };

  let sesion: SesionResponse | null;
  let routeId: string | null;
  let navegacion: unknown[] | null;
  let busqueda: { id: number; empresaId: number } | null;
  let eliminacion: { id: number; usuarioId: number } | null;

  beforeEach(async () => {
    sesion = sesionAdmin;
    routeId = '9';
    navegacion = null;
    busqueda = null;
    eliminacion = null;

    await TestBed.configureTestingModule({
      imports: [ProcesoDetailComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesion } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => routeId } } } },
        {
          provide: Router,
          useValue: {
            navigate: (comandos: unknown[]) => {
              navegacion = comandos;
              return Promise.resolve(true);
            },
          },
        },
        {
          provide: ProcesoService,
          useValue: {
            buscarPorId: (id: number, empresaId: number) => {
              busqueda = { id, empresaId };
              return of(proceso);
            },
            eliminar: (id: number, usuarioId: number) => {
              eliminacion = { id, usuarioId };
              return of(undefined);
            },
          },
        },
        { provide: ApiErrorService, useValue: { obtenerMensaje: () => 'Error' } },
      ],
    })
      .overrideComponent(ProcesoDetailComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('consulta el proceso usando la empresa de la sesión', () => {
    const fixture = TestBed.createComponent(ProcesoDetailComponent);
    fixture.detectChanges();

    expect(busqueda).toEqual({ id: 9, empresaId: 4 });
    expect(fixture.componentInstance.proceso).toEqual(proceso);
  });

  it('redirige al login si no existe sesión', () => {
    sesion = null;
    const fixture = TestBed.createComponent(ProcesoDetailComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/login']);
    expect(busqueda).toBeNull();
  });

  it('expone las acciones permitidas para cada rol', () => {
    const fixture = TestBed.createComponent(ProcesoDetailComponent);

    expect(fixture.componentInstance.puedeEditar).toBe(true);
    expect(fixture.componentInstance.puedeAdministrar).toBe(true);

    sesion = { ...sesionAdmin, rolUsuario: 'EDITOR' };
    expect(fixture.componentInstance.puedeEditar).toBe(true);
    expect(fixture.componentInstance.puedeAdministrar).toBe(false);

    sesion = { ...sesionAdmin, rolUsuario: 'LECTURA' };
    expect(fixture.componentInstance.puedeEditar).toBe(false);
    expect(fixture.componentInstance.puedeAdministrar).toBe(false);
  });

  it('permite eliminar únicamente al administrador y vuelve al listado', () => {
    const fixture = TestBed.createComponent(ProcesoDetailComponent);
    fixture.detectChanges();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    fixture.componentInstance.eliminar();

    expect(eliminacion).toEqual({ id: 9, usuarioId: 1 });
    expect(navegacion).toEqual(['/procesos']);
  });

  it('no elimina cuando el proceso es de solo lectura', () => {
    const fixture = TestBed.createComponent(ProcesoDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.proceso = { ...proceso, soloLectura: true };

    fixture.componentInstance.eliminar();

    expect(eliminacion).toBeNull();
  });
});
