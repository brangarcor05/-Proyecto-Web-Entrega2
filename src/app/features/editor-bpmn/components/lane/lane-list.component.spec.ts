import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Lane } from '../../../../models/bpmn/lane/lane.model';
import { PermisoPool } from '../../../../models/permisopool/permiso-pool.model';
import { RolProceso } from '../../../../models/bpmn/rolProceso/rolProceso.model';
import { PageResponse } from '../../../../models/common/page-response.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { LaneService } from '../../../../services/lane/lane.service';
import { PermisoPoolService } from '../../../../services/permisoPool/permiso-pool.service';
import { RolProcesoService } from '../../../../services/rolProceso/rolProceso.service';
import { LaneListComponent } from './lane-list.component';

describe('LaneListComponent', () => {
  const sesionEditor: SesionResponse = {
    usuarioId: 4,
    nombre: 'Editor',
    email: 'editor@example.com',
    rolUsuario: 'EDITOR',
    empresaId: 5,
    empresaNombre: 'Empresa',
  };

  const lane: Lane = {
    id: 1,
    poolId: 20,
    rolProcesoId: 2,
    rolProcesoNombre: 'Analista',
    orden: 0,
    activo: true,
  };

  const rol: RolProceso = {
    id: 2,
    empresaId: 5,
    nombre: 'Analista',
    descripcion: '',
    activo: true,
    enUso: true,
    procesosDondeSeUsa: ['Proceso de compras'],
  };

  const rolesPagina: PageResponse<RolProceso> = {
    content: [rol],
    totalElements: 1,
    totalPages: 1,
    size: 200,
    number: 0,
    first: true,
    last: true,
    numberOfElements: 1,
    empty: false,
  };

  let sesion: SesionResponse | null;
  let permisosConfigurados: PermisoPool[];
  let creacion: { request: unknown; usuarioId: number } | null;

  function configurar(): void {
    TestBed.configureTestingModule({
      imports: [LaneListComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesion } },
        { provide: LaneService, useValue: {
          listarPorPool: () => of([lane]),
          crear: (request: unknown, usuarioId: number) => {
            creacion = { request, usuarioId };
            return of(lane);
          },
        } },
        { provide: RolProcesoService, useValue: { listarTodos: () => of(rolesPagina) } },
        { provide: PermisoPoolService, useValue: { consultar: () => of(permisosConfigurados) } },
        { provide: ApiErrorService, useValue: { obtenerMensaje: () => 'Error' } },
      ],
    }).overrideComponent(LaneListComponent, { set: { template: '' } });
  }

  beforeEach(() => {
    sesion = sesionEditor;
    permisosConfigurados = [];
    creacion = null;
  });

  it('usa el permiso por defecto (ADMIN/EDITOR crean y editan) cuando la empresa no configuro nada', () => {
    configurar();
    const fixture = TestBed.createComponent(LaneListComponent);
    fixture.componentInstance.poolId = 20;
    fixture.detectChanges();
    fixture.componentInstance.ngOnChanges();

    expect(fixture.componentInstance.puedeCrear).toBe(true);
    expect(fixture.componentInstance.puedeEditar).toBe(true);
    expect(fixture.componentInstance.puedeEliminar).toBe(false);
    expect(fixture.componentInstance.lanes()).toEqual([lane]);
    expect(fixture.componentInstance.rolesDisponibles()).toEqual([rol]);
  });

  it('respeta el permiso configurado por la empresa aunque difiera del default', () => {
    permisosConfigurados = [{
      id: 9,
      empresaId: 5,
      rolUsuario: 'EDITOR',
      puedeCrear: false,
      puedeEditar: false,
      puedeEliminar: true,
      configurado: true,
    }];
    configurar();
    const fixture = TestBed.createComponent(LaneListComponent);
    fixture.componentInstance.poolId = 20;
    fixture.detectChanges();
    fixture.componentInstance.ngOnChanges();

    expect(fixture.componentInstance.puedeCrear).toBe(false);
    expect(fixture.componentInstance.puedeEditar).toBe(false);
    expect(fixture.componentInstance.puedeEliminar).toBe(true);
  });

  it('crea una lane con el poolId recibido y el usuario de la sesion', () => {
    configurar();
    const fixture = TestBed.createComponent(LaneListComponent);
    fixture.componentInstance.poolId = 20;
    fixture.detectChanges();
    fixture.componentInstance.ngOnChanges();

    fixture.componentInstance.formulario.setValue({ rolProcesoId: 2 });
    fixture.componentInstance.guardar();

    expect(creacion).toEqual({ request: { poolId: 20, rolProcesoId: 2 }, usuarioId: 4 });
  });
});
