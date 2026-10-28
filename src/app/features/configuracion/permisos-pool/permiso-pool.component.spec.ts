import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiErrorService } from '../../../core/services/api-error.service';
import { SesionResponse } from '../../../models/auth/auth.model';
import { ConfigurarPermisoPoolRequest } from '../../../models/permisopool/configurar-permiso-pool-request.model';
import { PermisoPool } from '../../../models/permisopool/permiso-pool.model';
import { AutenticacionService } from '../../../services/auth/auth.service';
import { PermisoPoolService } from '../../../services/permisoPool/permiso-pool.service';
import { PermisoPoolComponent } from './permiso-pool.component';

describe('PermisoPoolComponent', () => {
  const sesionAdmin: SesionResponse = {
    usuarioId: 1,
    nombre: 'Admin',
    email: 'admin@example.com',
    rolUsuario: 'ADMIN',
    empresaId: 9,
    empresaNombre: 'Empresa',
  };
  const permisoEditor: PermisoPool = {
    id: null,
    empresaId: 9,
    rolUsuario: 'EDITOR',
    puedeCrear: true,
    puedeEditar: true,
    puedeEliminar: false,
    configurado: false,
  };

  let sesion: SesionResponse | null;
  let empresaConsultada: number | null;
  let configuracion: { request: ConfigurarPermisoPoolRequest; usuarioId: number } | null;
  let navegacion: unknown[] | null;

  beforeEach(async () => {
    sesion = sesionAdmin;
    empresaConsultada = null;
    configuracion = null;
    navegacion = null;

    await TestBed.configureTestingModule({
      imports: [PermisoPoolComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesion } },
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
          provide: PermisoPoolService,
          useValue: {
            consultar: (empresaId: number) => {
              empresaConsultada = empresaId;
              return of([permisoEditor]);
            },
            configurar: (request: ConfigurarPermisoPoolRequest, usuarioId: number) => {
              configuracion = { request, usuarioId };
              return of({ ...permisoEditor, ...request, id: 4, configurado: true });
            },
          },
        },
        { provide: ApiErrorService, useValue: { obtenerMensaje: () => 'Error' } },
      ],
    })
      .overrideComponent(PermisoPoolComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('consulta los permisos de la empresa del administrador', () => {
    const fixture = TestBed.createComponent(PermisoPoolComponent);
    fixture.detectChanges();

    expect(empresaConsultada).toBe(9);
    expect(fixture.componentInstance.permisos).toEqual([permisoEditor]);
  });

  it('redirige al login cuando no existe sesión', () => {
    sesion = null;
    const fixture = TestBed.createComponent(PermisoPoolComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/login']);
    expect(empresaConsultada).toBeNull();
  });

  it('impide que un usuario no administrador configure permisos', () => {
    sesion = { ...sesionAdmin, rolUsuario: 'EDITOR' };
    const fixture = TestBed.createComponent(PermisoPoolComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/procesos']);
    expect(empresaConsultada).toBeNull();
  });

  it('guarda la configuración con el usuario de la sesión', () => {
    const fixture = TestBed.createComponent(PermisoPoolComponent);
    fixture.detectChanges();
    fixture.componentInstance.actualizarValor(permisoEditor, 'puedeEliminar', true);

    fixture.componentInstance.guardar(permisoEditor);

    expect(configuracion).toEqual({
      request: {
        rolUsuario: 'EDITOR',
        puedeCrear: true,
        puedeEditar: true,
        puedeEliminar: true,
      },
      usuarioId: 1,
    });
    expect(fixture.componentInstance.mensaje).toContain('EDITOR');
  });
});
