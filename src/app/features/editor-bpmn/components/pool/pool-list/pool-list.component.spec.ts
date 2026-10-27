import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiErrorService } from '../../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../../models/auth/auth.model';
import { Pool } from '../../../../../models/pool/pool.model';
import { Proceso } from '../../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../../services/auth/auth.service';
import { PoolService } from '../../../../../services/pool.service';
import { ProcesoService } from '../../../../../services/proceso.service';
import { PoolListComponent } from './pool-list.component';

describe('PoolListComponent', () => {
  const sesionAdmin: SesionResponse = {
    usuarioId: 1,
    nombre: 'Admin',
    email: 'admin@example.com',
    rolUsuario: 'ADMIN',
    empresaId: 5,
    empresaNombre: 'Empresa',
  };
  const proceso: Proceso = {
    id: 10,
    empresaId: 5,
    empresaNombre: 'Empresa',
    nombre: 'Proceso',
    descripcion: 'Descripción',
    categoria: 'Operaciones',
    estado: 'BORRADOR',
    activo: true,
    compartido: false,
    soloLectura: false,
  };
  const pool: Pool = {
    id: 2,
    procesoId: 10,
    nombre: 'Cliente',
    cajaNegra: false,
    esPropietario: false,
    activo: true,
  };

  let sesion: SesionResponse | null;
  let procesoConsultado: Proceso;
  let consultaPools: number | null;
  let eliminacion: { id: number; usuarioId: number } | null;
  let navegacion: unknown[] | null;

  beforeEach(async () => {
    sesion = sesionAdmin;
    procesoConsultado = proceso;
    consultaPools = null;
    eliminacion = null;
    navegacion = null;

    await TestBed.configureTestingModule({
      imports: [PoolListComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesion } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '10' } } } },
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
          useValue: { buscarPorId: () => of(procesoConsultado) },
        },
        {
          provide: PoolService,
          useValue: {
            listarPorProceso: (procesoId: number) => {
              consultaPools = procesoId;
              return of([pool]);
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
      .overrideComponent(PoolListComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('lista los pools del proceso indicado por la ruta', () => {
    const fixture = TestBed.createComponent(PoolListComponent);
    fixture.detectChanges();

    expect(consultaPools).toBe(10);
    expect(fixture.componentInstance.pools).toEqual([pool]);
  });

  it('respeta los permisos ADMIN, EDITOR y LECTURA', () => {
    const fixture = TestBed.createComponent(PoolListComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.puedeCrearOEditar).toBe(true);
    expect(fixture.componentInstance.puedeEliminar).toBe(true);

    sesion = { ...sesionAdmin, rolUsuario: 'EDITOR' };
    expect(fixture.componentInstance.puedeCrearOEditar).toBe(true);
    expect(fixture.componentInstance.puedeEliminar).toBe(false);

    sesion = { ...sesionAdmin, rolUsuario: 'LECTURA' };
    expect(fixture.componentInstance.puedeCrearOEditar).toBe(false);
    expect(fixture.componentInstance.puedeEliminar).toBe(false);
  });

  it('desactiva las acciones sobre un proceso compartido en solo lectura', () => {
    procesoConsultado = { ...proceso, soloLectura: true };
    const fixture = TestBed.createComponent(PoolListComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.puedeCrearOEditar).toBe(false);
    expect(fixture.componentInstance.puedeEliminar).toBe(false);
  });

  it('permite al administrador eliminar un pool que no es propietario', () => {
    const fixture = TestBed.createComponent(PoolListComponent);
    fixture.detectChanges();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    fixture.componentInstance.eliminar(pool);

    expect(eliminacion).toEqual({ id: 2, usuarioId: 1 });
    expect(fixture.componentInstance.pools).toEqual([]);
  });

  it('redirige al login cuando no existe sesión', () => {
    sesion = null;
    const fixture = TestBed.createComponent(PoolListComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/login']);
    expect(consultaPools).toBeNull();
  });
});
