import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { PageResponse } from '../../../../models/common/page-response.model';
import { ConsultarProcesosParams } from '../../../../models/proceso/consultar-procesos-params.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso.service';
import { Router } from '@angular/router';
import { ProcesoListComponent } from './proceso-list.component';

describe('ProcesoListComponent', () => {
  const paginaVacia: PageResponse<Proceso> = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 9,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 0,
    empty: true,
  };

  const sesionActiva: SesionResponse = {
    usuarioId: 17,
    nombre: 'Juan',
    email: 'juan@example.com',
    rolUsuario: 'EDITOR',
    empresaId: 23,
    empresaNombre: 'Empresa de prueba',
  };

  let sesion: SesionResponse | null;
  let parametrosConsultados: ConsultarProcesosParams | null;
  let navegacion: unknown[] | null;

  beforeEach(async () => {
    sesion = sesionActiva;
    parametrosConsultados = null;
    navegacion = null;

    await TestBed.configureTestingModule({
      imports: [ProcesoListComponent],
      providers: [
        {
          provide: AutenticacionService,
          useValue: { sesion: () => sesion },
        },
        {
          provide: ProcesoService,
          useValue: {
            consultar: (parametros: ConsultarProcesosParams) => {
              parametrosConsultados = parametros;
              return of(paginaVacia);
            },
          },
        },
        {
          provide: ApiErrorService,
          useValue: {
            obtenerMensaje: () => '',
            obtenerCamposInvalidos: () => ({}),
          },
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
      ],
    })
      .overrideComponent(ProcesoListComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('consulta los procesos de la empresa de la sesión', () => {
    const fixture = TestBed.createComponent(ProcesoListComponent);
    fixture.detectChanges();

    expect(parametrosConsultados?.empresaId).toBe(23);
    expect(navegacion).toBeNull();
  });

  it('redirige al login cuando no existe una sesión', () => {
    sesion = null;
    const fixture = TestBed.createComponent(ProcesoListComponent);
    fixture.detectChanges();

    expect(parametrosConsultados).toBeNull();
    expect(navegacion).toEqual(['/login']);
  });

  it('permite crear y editar a un usuario EDITOR, pero no eliminar', () => {
    const fixture = TestBed.createComponent(ProcesoListComponent);

    expect(fixture.componentInstance.puedeCrearOEditar).toBe(true);
    expect(fixture.componentInstance.puedeEliminar).toBe(false);
  });

  it('deja al usuario LECTURA únicamente consultar procesos', () => {
    sesion = { ...sesionActiva, rolUsuario: 'LECTURA' };
    const fixture = TestBed.createComponent(ProcesoListComponent);

    expect(fixture.componentInstance.puedeCrearOEditar).toBe(false);
    expect(fixture.componentInstance.puedeEliminar).toBe(false);
  });

  it('permite al administrador crear, editar y eliminar procesos', () => {
    sesion = { ...sesionActiva, rolUsuario: 'ADMIN' };
    const fixture = TestBed.createComponent(ProcesoListComponent);

    expect(fixture.componentInstance.puedeCrearOEditar).toBe(true);
    expect(fixture.componentInstance.puedeEliminar).toBe(true);
  });
});
