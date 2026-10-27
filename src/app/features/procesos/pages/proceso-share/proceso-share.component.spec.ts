import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Empresa } from '../../../../models/empresa/empresa.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { EmpresaService } from '../../../../services/empresa/Empresa.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';
import { ProcesoShareComponent } from './proceso-share.component';

describe('ProcesoShareComponent', () => {
  const sesionAdmin: SesionResponse = {
    usuarioId: 3,
    nombre: 'Admin',
    email: 'admin@example.com',
    rolUsuario: 'ADMIN',
    empresaId: 7,
    empresaNombre: 'Empresa',
  };
  const proceso: Proceso = {
    id: 15,
    empresaId: 7,
    empresaNombre: 'Empresa',
    nombre: 'Proceso compartible',
    descripcion: 'Descripción',
    categoria: 'Operaciones',
    estado: 'PUBLICADO',
    activo: true,
    compartido: false,
    empresasCompartidasIds: [2],
    soloLectura: false,
  };
  const empresas: Empresa[] = [
    {
      id: 7,
      nombre: 'Empresa',
      rut: '900000001',
      razonSocial: 'Empresa actual',
      email: 'actual@example.com',
      estado: 'ACTIVO',
      fechaRegistro: '2026-10-26T10:00:00',
      adminUsuarioId: 3,
    },
    {
      id: 2,
      nombre: 'Empresa invitada',
      rut: '900000002',
      razonSocial: 'Empresa invitada',
      email: 'invitada@example.com',
      estado: 'ACTIVO',
      fechaRegistro: '2026-10-26T10:00:00',
      adminUsuarioId: 4,
    },
  ];

  let sesion: SesionResponse | null;
  let routeId: string | null;
  let navegacion: unknown[] | null;
  let busqueda: { id: number; empresaId: number } | null;
  let comparticion: { id: number; request: unknown; usuarioId: number } | null;

  beforeEach(async () => {
    sesion = sesionAdmin;
    routeId = '15';
    navegacion = null;
    busqueda = null;
    comparticion = null;

    await TestBed.configureTestingModule({
      imports: [ProcesoShareComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesion } },
        { provide: EmpresaService, useValue: { listar: () => of(empresas) } },
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
            compartir: (id: number, request: unknown, usuarioId: number) => {
              comparticion = { id, request, usuarioId };
              return of({ ...proceso, compartido: true });
            },
          },
        },
        { provide: ApiErrorService, useValue: { obtenerMensaje: () => 'Error' } },
      ],
    })
      .overrideComponent(ProcesoShareComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('permite al administrador cargar la configuración de compartición', () => {
    const fixture = TestBed.createComponent(ProcesoShareComponent);
    fixture.detectChanges();

    expect(busqueda).toEqual({ id: 15, empresaId: 7 });
    expect(fixture.componentInstance.proceso()).toEqual(proceso);
    expect(fixture.componentInstance.empresas()).toEqual([empresas[1]]);
    expect(fixture.componentInstance.formulario.controls.empresasIds.value).toEqual([2]);
  });

  it('impide el acceso directo a EDITOR y LECTURA', () => {
    sesion = { ...sesionAdmin, rolUsuario: 'EDITOR' };
    const fixture = TestBed.createComponent(ProcesoShareComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/procesos']);
    expect(busqueda).toBeNull();
  });

  it('comparte con identificadores válidos y elimina duplicados', () => {
    const fixture = TestBed.createComponent(ProcesoShareComponent);
    fixture.detectChanges();
    fixture.componentInstance.formulario.setValue({
      compartido: true,
      empresasIds: [2, 3, 2],
    });

    fixture.componentInstance.guardar();

    expect(comparticion).toEqual({
      id: 15,
      request: { compartido: true, empresasIds: [2, 3] },
      usuarioId: 3,
    });
    expect(navegacion).toEqual(['/procesos', 15]);
  });

  it('exige al menos una empresa cuando se activa la compartición', () => {
    const fixture = TestBed.createComponent(ProcesoShareComponent);
    fixture.detectChanges();
    fixture.componentInstance.formulario.setValue({ compartido: true, empresasIds: [] });

    fixture.componentInstance.guardar();

    expect(comparticion).toBeNull();
    expect(fixture.componentInstance.error()).toContain('al menos una empresa');
  });

  it('agrega y retira empresas desde el selector', () => {
    const fixture = TestBed.createComponent(ProcesoShareComponent);
    fixture.detectChanges();

    fixture.componentInstance.cambiarEmpresa(2, true);
    expect(fixture.componentInstance.formulario.controls.empresasIds.value).toEqual([2]);

    fixture.componentInstance.cambiarEmpresa(2, false);
    expect(fixture.componentInstance.formulario.controls.empresasIds.value).toEqual([]);
  });
});
