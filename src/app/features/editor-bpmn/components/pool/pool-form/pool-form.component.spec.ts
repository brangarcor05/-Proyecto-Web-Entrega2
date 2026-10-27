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
import { PoolFormComponent } from './pool-form.component';

describe('PoolFormComponent', () => {
  const sesionEditor: SesionResponse = {
    usuarioId: 4,
    nombre: 'Editor',
    email: 'editor@example.com',
    rolUsuario: 'EDITOR',
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
  let routeParams: Record<string, string | null>;
  let procesoConsultado: Proceso;
  let creacion: { request: unknown; usuarioId: number } | null;
  let actualizacion: { id: number; request: unknown; usuarioId: number } | null;
  let navegacion: unknown[] | null;

  beforeEach(async () => {
    sesion = sesionEditor;
    routeParams = { procesoId: '10', poolId: null };
    procesoConsultado = proceso;
    creacion = null;
    actualizacion = null;
    navegacion = null;

    await TestBed.configureTestingModule({
      imports: [PoolFormComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesion } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (nombre: string) => routeParams[nombre] } } },
        },
        {
          provide: Router,
          useValue: {
            navigate: (comandos: unknown[]) => {
              navegacion = comandos;
              return Promise.resolve(true);
            },
          },
        },
        { provide: ProcesoService, useValue: { buscarPorId: () => of(procesoConsultado) } },
        {
          provide: PoolService,
          useValue: {
            buscarPorId: () => of(pool),
            crear: (request: unknown, usuarioId: number) => {
              creacion = { request, usuarioId };
              return of(pool);
            },
            actualizar: (id: number, request: unknown, usuarioId: number) => {
              actualizacion = { id, request, usuarioId };
              return of(pool);
            },
          },
        },
        {
          provide: ApiErrorService,
          useValue: { obtenerMensaje: () => 'Error', obtenerCamposInvalidos: () => ({}) },
        },
      ],
    })
      .overrideComponent(PoolFormComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('crea un participante externo usando proceso y usuario de la sesión', () => {
    const fixture = TestBed.createComponent(PoolFormComponent);
    fixture.detectChanges();
    fixture.componentInstance.formulario.setValue({ nombre: '  Proveedor  ', cajaNegra: true });

    fixture.componentInstance.guardar();

    expect(creacion).toEqual({
      request: { procesoId: 10, nombre: 'Proveedor', cajaNegra: true },
      usuarioId: 4,
    });
    expect(navegacion).toEqual(['/procesos', 10, 'pools']);
  });

  it('carga y actualiza un pool existente', () => {
    routeParams['poolId'] = '2';
    const fixture = TestBed.createComponent(PoolFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.formulario.controls.nombre.value).toBe('Cliente');
    fixture.componentInstance.formulario.setValue({ nombre: 'Cliente externo', cajaNegra: true });
    fixture.componentInstance.guardar();

    expect(actualizacion).toEqual({
      id: 2,
      request: { nombre: 'Cliente externo', cajaNegra: true },
      usuarioId: 4,
    });
  });

  it('impide el acceso al rol LECTURA', () => {
    sesion = { ...sesionEditor, rolUsuario: 'LECTURA' };
    const fixture = TestBed.createComponent(PoolFormComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/procesos']);
    expect(creacion).toBeNull();
  });

  it('impide modificar pools de un proceso compartido en solo lectura', () => {
    procesoConsultado = { ...proceso, soloLectura: true };
    const fixture = TestBed.createComponent(PoolFormComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/procesos', 10, 'pools']);
  });
});
