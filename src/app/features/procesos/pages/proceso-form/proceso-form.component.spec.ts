import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso.service';
import { ProcesoFormComponent } from './proceso-form.component';

describe('ProcesoFormComponent', () => {
  const sesionEditor: SesionResponse = {
    usuarioId: 17,
    nombre: 'Juan',
    email: 'juan@example.com',
    rolUsuario: 'EDITOR',
    empresaId: 23,
    empresaNombre: 'Empresa de prueba',
  };

  const proceso: Proceso = {
    id: 8,
    empresaId: 23,
    empresaNombre: 'Empresa de prueba',
    nombre: 'Solicitud de compra',
    descripcion: 'Proceso interno',
    categoria: 'Compras',
    estado: 'BORRADOR',
    activo: true,
    compartido: false,
    soloLectura: false,
  };

  let sesion: SesionResponse | null;
  let routeId: string | null;
  let navegacion: unknown[] | null;
  let creacion: { request: unknown; usuarioId: number } | null;
  let actualizacion: { id: number; request: unknown; usuarioId: number } | null;
  let busqueda: { id: number; empresaId: number } | null;
  let procesoConsultado: Proceso;

  beforeEach(async () => {
    sesion = sesionEditor;
    routeId = null;
    navegacion = null;
    creacion = null;
    actualizacion = null;
    busqueda = null;
    procesoConsultado = proceso;

    await TestBed.configureTestingModule({
      imports: [ProcesoFormComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesion } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => routeId } } },
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
        {
          provide: ProcesoService,
          useValue: {
            buscarPorId: (id: number, empresaId: number) => {
              busqueda = { id, empresaId };
              return of(procesoConsultado);
            },
            crear: (request: unknown, usuarioId: number) => {
              creacion = { request, usuarioId };
              return of(proceso);
            },
            actualizar: (id: number, request: unknown, usuarioId: number) => {
              actualizacion = { id, request, usuarioId };
              return of(proceso);
            },
          },
        },
        {
          provide: ApiErrorService,
          useValue: { obtenerMensaje: () => 'Error', obtenerCamposInvalidos: () => ({}) },
        },
      ],
    })
      .overrideComponent(ProcesoFormComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('redirige al login cuando no existe sesión', () => {
    sesion = null;
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/login']);
    expect(busqueda).toBeNull();
  });

  it('impide el acceso directo al formulario para el rol LECTURA', () => {
    sesion = { ...sesionEditor, rolUsuario: 'LECTURA' };
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/procesos']);
  });

  it('crea un proceso con la empresa y el usuario de la sesión', () => {
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();
    fixture.componentInstance.formulario.setValue({
      nombre: '  Solicitud de compra  ',
      descripcion: '  Proceso interno  ',
      categoria: '  Compras  ',
      estado: 'BORRADOR',
    });

    fixture.componentInstance.guardar();

    expect(creacion).toEqual({
      request: {
        empresaId: 23,
        nombre: 'Solicitud de compra',
        descripcion: 'Proceso interno',
        categoria: 'Compras',
      },
      usuarioId: 17,
    });
    expect(navegacion).toEqual(['/procesos', 8]);
  });

  it('carga y actualiza el proceso indicado por la ruta', () => {
    routeId = '8';
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();

    expect(busqueda).toEqual({ id: 8, empresaId: 23 });
    expect(fixture.componentInstance.formulario.controls.nombre.value).toBe('Solicitud de compra');

    fixture.componentInstance.formulario.patchValue({ estado: 'PUBLICADO' });
    fixture.componentInstance.guardar();

    expect(actualizacion).toEqual({
      id: 8,
      request: {
        nombre: 'Solicitud de compra',
        descripcion: 'Proceso interno',
        categoria: 'Compras',
        estado: 'PUBLICADO',
      },
      usuarioId: 17,
    });
  });

  it('deshabilita la edición de un proceso compartido en solo lectura', () => {
    routeId = '8';
    procesoConsultado = { ...proceso, soloLectura: true };
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.formulario.disabled).toBe(true);
    expect(fixture.componentInstance.error).toContain('solo lectura');
  });
});
