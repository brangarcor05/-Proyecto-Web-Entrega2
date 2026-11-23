import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { UsuarioSesion } from '../../../../models/auth/auth.model';
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
  const sesionEditor: UsuarioSesion = {
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

  let sesion: UsuarioSesion | null;
  let permisosConfigurados: PermisoPool[];
  let creacion: { request: unknown } | null;

  function configurar(): void {
    TestBed.configureTestingModule({
      imports: [LaneListComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesion } },
        { provide: LaneService, useValue: {
          listarPorPool: () => of([lane]),
          crear: (request: unknown) => {
            creacion = { request };
            return of(lane);
          },
          eliminar: () => of(undefined), // <-- Agregamos el mock de eliminar
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

  it('crea una lane con el poolId recibido', () => {
    configurar();
    const fixture = TestBed.createComponent(LaneListComponent);
    fixture.componentInstance.poolId = 20;
    fixture.detectChanges();
    fixture.componentInstance.ngOnChanges();

    fixture.componentInstance.formulario.setValue({ rolProcesoId: 2 });
    fixture.componentInstance.guardar();

    expect(creacion).toEqual({ request: { poolId: 20, rolProcesoId: 2 } });
  });

  it('debería iniciar el modo edición y llenar el formulario', () => {
    configurar();
    const fixture = TestBed.createComponent(LaneListComponent);
    fixture.componentInstance.poolId = 20;
    fixture.detectChanges();
    fixture.componentInstance.ngOnChanges();

    fixture.componentInstance.iniciarEdicion(lane);

    expect(fixture.componentInstance.editandoId()).toBe(lane.id);
    expect(fixture.componentInstance.formulario.value.rolProcesoId).toBe(lane.rolProcesoId);
    expect(fixture.componentInstance.mostrandoFormulario()).toBe(true);
  });

  it('debería cancelar la edición y limpiar el formulario', () => {
    configurar();
    const fixture = TestBed.createComponent(LaneListComponent);
    fixture.componentInstance.poolId = 20;
    fixture.componentInstance.iniciarEdicion(lane);

    fixture.componentInstance.cancelarEdicion();

    expect(fixture.componentInstance.editandoId()).toBeNull();
    expect(fixture.componentInstance.formulario.value.rolProcesoId).toBeNull();
    expect(fixture.componentInstance.mostrandoFormulario()).toBe(false);
  });

  it('debería eliminar una lane si el usuario confirma', () => {
    configurar(); // Primero configuramos
    const laneService = TestBed.inject(LaneService); // Luego inyectamos
    const spyEliminar = vi.spyOn(laneService, 'eliminar').mockReturnValue(of(undefined));
    vi.spyOn(window, 'confirm').mockReturnValue(true); // Simulamos el OK del usuario

    const fixture = TestBed.createComponent(LaneListComponent);
    fixture.componentInstance.poolId = 20;
    fixture.componentInstance.permiso.set({ puedeEliminar: true } as any); // Forzamos permiso

    fixture.componentInstance.eliminar(lane);

    expect(spyEliminar).toHaveBeenCalledWith(lane.id);
  });

  it('NO debería eliminar si el usuario cancela', () => {
    configurar();
    const laneService = TestBed.inject(LaneService);
    const spyEliminar = vi.spyOn(laneService, 'eliminar');
    vi.spyOn(window, 'confirm').mockReturnValue(false); // Simulamos el Cancelar

    const fixture = TestBed.createComponent(LaneListComponent);
    fixture.componentInstance.poolId = 20;
    fixture.componentInstance.permiso.set({ puedeEliminar: true } as any);

    fixture.componentInstance.eliminar(lane);

    expect(spyEliminar).not.toHaveBeenCalled();
  });

  it('debería mostrar error si falla la carga de lanes', () => {
    TestBed.configureTestingModule({
      imports: [LaneListComponent],
      providers: [
        { provide: AutenticacionService, useValue: { sesion: () => sesionEditor } },
        { provide: LaneService, useValue: { listarPorPool: () => throwError(() => new Error('Error de red')) } },
        { provide: RolProcesoService, useValue: { listarTodos: () => of(rolesPagina) } },
        { provide: PermisoPoolService, useValue: { consultar: () => of([]) } },
        { provide: ApiErrorService, useValue: { obtenerMensaje: () => 'Error de red' } },
      ],
    }).overrideComponent(LaneListComponent, { set: { template: '' } });

    const fixture = TestBed.createComponent(LaneListComponent);
    fixture.componentInstance.poolId = 20;
    fixture.detectChanges();
    fixture.componentInstance.ngOnChanges();

    expect(fixture.componentInstance.error()).toBe('Error de red');
  });
});