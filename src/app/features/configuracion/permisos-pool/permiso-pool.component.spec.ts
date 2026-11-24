import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { ApiErrorService } from '../../../core/services/api-error.service';
import { UsuarioSesion } from '../../../models/auth/auth.model';
import { ConfigurarPermisoPoolRequest } from '../../../models/permisopool/configurar-permiso-pool-request.model';
import { PermisoPool } from '../../../models/permisopool/permiso-pool.model';
import { AutenticacionService } from '../../../services/auth/auth.service';
import { PermisoPoolService } from '../../../services/permisoPool/permiso-pool.service';
import { PermisoPoolComponent } from './permiso-pool.component';

describe('PermisoPoolComponent', () => {
  const sesionAdmin: UsuarioSesion = {
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

  let sesion: UsuarioSesion | null;
  let consultas: number;
  let configuracion: { request: ConfigurarPermisoPoolRequest } | null;
  let navegacion: unknown[] | null;

  beforeEach(async () => {
    sesion = sesionAdmin;
    consultas = 0;
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
            consultar: () => {
              consultas++;
              return of([permisoEditor]);
            },
            configurar: (request: ConfigurarPermisoPoolRequest) => {
              configuracion = { request };
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

  it('consulta los permisos (la empresa sale del token)', () => {
    const fixture = TestBed.createComponent(PermisoPoolComponent);
    fixture.detectChanges();

    // La empresa sale del token: el componente ya no la envía
    expect(consultas).toBe(1);
    expect(fixture.componentInstance.permisos).toEqual([permisoEditor]);
  });

  it('redirige al login cuando no existe sesión', () => {
    sesion = null;
    const fixture = TestBed.createComponent(PermisoPoolComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/login']);
    expect(consultas).toBe(0);
  });

  it('impide que un usuario no administrador configure permisos', () => {
    sesion = { ...sesionAdmin, rolUsuario: 'EDITOR' };
    const fixture = TestBed.createComponent(PermisoPoolComponent);
    fixture.detectChanges();

    expect(navegacion).toEqual(['/procesos']);
    expect(consultas).toBe(0);
  });

  it('guarda la configuración del rol', () => {
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
    });
    expect(fixture.componentInstance.mensaje).toContain('EDITOR');
  });
});
