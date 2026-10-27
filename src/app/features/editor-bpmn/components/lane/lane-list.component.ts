import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { Lane } from '../../../../models/bpmn/lane/lane.model';
import { PermisoPool } from '../../../../models/permisopool/permiso-pool.model';
import { RolProceso } from '../../../../models/bpmn/rolProceso/rolProceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { LaneService } from '../../../../services/lane/lane.service';
import { PermisoPoolService } from '../../../../services/permisoPool/permiso-pool.service';
import { RolProcesoService } from '../../../../services/rolProceso/rolProceso.service';

/**
 * Administra las lanes de un pool (HU-22). Se embebe en pool-form.component
 * (solo cuando se edita un pool existente y no es caja negra), pasándole el
 * poolId por @Input.
 *
 * El permiso para crear/editar/eliminar lanes es el mismo que para pools
 * (HU-24, PermisoService#validarPuedeXPoolsYLanes en el backend): cada
 * empresa puede configurarlo via PermisoPoolService, con ADMIN/EDITOR
 * pudiendo crear y editar, y solo ADMIN pudiendo eliminar, como reglas por
 * defecto mientras la empresa no defina las suyas. Por eso se consulta
 * PermisoPoolService en vez de usar una regla fija en el frontend.
 */
@Component({
  selector: 'app-lane-list',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './lane-list.component.html',
  styleUrl: './lane-list.component.css',
})
export class LaneListComponent implements OnChanges {
  @Input({ required: true }) poolId!: number;

  private readonly laneService = inject(LaneService);
  private readonly rolProcesoService = inject(RolProcesoService);
  private readonly permisoPoolService = inject(PermisoPoolService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly autenticacionService = inject(AutenticacionService);

  lanes = signal<Lane[]>([]);
  rolesDisponibles = signal<RolProceso[]>([]);
  permiso = signal<PermisoPool | null>(null);
  cargando = signal(false);
  guardando = signal(false);
  reordenando = signal(false);
  eliminandoId = signal<number | null>(null);
  error = signal('');
  editandoId = signal<number | null>(null);
  mostrandoFormulario = signal(false);

  readonly formulario = new FormGroup({
    rolProcesoId: new FormControl<number | null>(null, { validators: [Validators.required] }),
  });

  get puedeEditar(): boolean {
    return this.permiso()?.puedeEditar ?? false;
  }

  get puedeCrear(): boolean {
    return this.permiso()?.puedeCrear ?? false;
  }

  get puedeEliminar(): boolean {
    return this.permiso()?.puedeEliminar ?? false;
  }

  get esEdicion(): boolean {
    return this.editandoId() !== null;
  }

  ngOnChanges(): void {
    this.cargarLanes();
    this.cargarRolesDisponibles();
    this.cargarPermiso();
  }

  cargarLanes(): void {
    this.cargando.set(true);
    this.error.set('');
    this.laneService
      .listarPorPool(this.poolId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (lanes) => this.lanes.set(lanes),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  private cargarRolesDisponibles(): void {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) {
      return;
    }
    this.rolProcesoService.listarTodos(sesion.empresaId).subscribe({
      next: (pagina) => this.rolesDisponibles.set(pagina.content.filter((rol) => rol.activo)),
      error: (error: unknown) => this.manejarError(error),
    });
  }

  /**
   * Trae el permiso configurado para el rol del usuario actual, con el
   * mismo fallback por defecto que aplica el backend (ADMIN/EDITOR pueden
   * crear y editar; solo ADMIN puede eliminar) por si la empresa no ha
   * configurado nada en /configuracion/permisos-pool.
   */
  private cargarPermiso(): void {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) {
      return;
    }
    this.permisoPoolService.consultar(sesion.empresaId).subscribe({
      next: (permisos) => {
        const configurado = permisos.find((permiso) => permiso.rolUsuario === sesion.rolUsuario);
        this.permiso.set(configurado ?? this.permisoPorDefecto(sesion.rolUsuario));
      },
      error: (error: unknown) => this.manejarError(error),
    });
  }

  private permisoPorDefecto(rolUsuario: PermisoPool['rolUsuario']): PermisoPool {
    const puedeEditarPorDefecto = rolUsuario === 'ADMIN' || rolUsuario === 'EDITOR';
    return {
      id: null,
      empresaId: this.autenticacionService.sesion()?.empresaId ?? 0,
      rolUsuario,
      puedeCrear: puedeEditarPorDefecto,
      puedeEditar: puedeEditarPorDefecto,
      puedeEliminar: rolUsuario === 'ADMIN',
      configurado: false,
    };
  }

  iniciarCreacion(): void {
    this.editandoId.set(null);
    this.formulario.reset();
    this.mostrandoFormulario.set(true);
  }

  iniciarEdicion(lane: Lane): void {
    this.editandoId.set(lane.id);
    this.formulario.setValue({ rolProcesoId: lane.rolProcesoId });
    this.mostrandoFormulario.set(true);
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.formulario.reset();
    this.mostrandoFormulario.set(false);
  }

  guardar(): void {
    const sesion = this.autenticacionService.sesion();
    const idEnEdicion = this.editandoId();
    const tienePermiso = idEnEdicion === null ? this.puedeCrear : this.puedeEditar;
    if (!sesion || !tienePermiso) {
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const rolProcesoId = this.formulario.getRawValue().rolProcesoId!;
    this.guardando.set(true);
    this.error.set('');

    const operacion = idEnEdicion === null
      ? this.laneService.crear({ poolId: this.poolId, rolProcesoId }, sesion.usuarioId)
      : this.laneService.actualizar(idEnEdicion, { rolProcesoId }, sesion.usuarioId);

    operacion.pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: () => {
        this.editandoId.set(null);
        this.formulario.reset();
        this.mostrandoFormulario.set(false);
        this.cargarLanes();
      },
      error: (error: unknown) => this.manejarError(error),
    });
  }

  eliminar(lane: Lane): void {
    const sesion = this.autenticacionService.sesion();
    if (!sesion || !this.puedeEliminar) {
      return;
    }

    const confirmado = window.confirm(`¿Deseas eliminar la lane “${lane.rolProcesoNombre}”?`);
    if (!confirmado) {
      return;
    }

    this.eliminandoId.set(lane.id);
    this.error.set('');
    this.laneService
      .eliminar(lane.id, sesion.usuarioId)
      .pipe(finalize(() => this.eliminandoId.set(null)))
      .subscribe({
        next: () => this.cargarLanes(),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  moverArriba(lane: Lane): void {
    this.mover(lane, -1);
  }

  moverAbajo(lane: Lane): void {
    this.mover(lane, 1);
  }

  private mover(lane: Lane, direccion: -1 | 1): void {
    const sesion = this.autenticacionService.sesion();
    if (!sesion || !this.puedeEditar) {
      return;
    }

    const ordenActual = [...this.lanes()].sort((a, b) => a.orden - b.orden).map((l) => l.id);
    const indice = ordenActual.indexOf(lane.id);
    const nuevoIndice = indice + direccion;
    if (nuevoIndice < 0 || nuevoIndice >= ordenActual.length) {
      return;
    }

    [ordenActual[indice], ordenActual[nuevoIndice]] = [ordenActual[nuevoIndice], ordenActual[indice]];

    this.reordenando.set(true);
    this.error.set('');
    this.laneService
      .reordenar(this.poolId, { laneIdsEnOrden: ordenActual }, sesion.usuarioId)
      .pipe(finalize(() => this.reordenando.set(false)))
      .subscribe({
        next: (lanes) => this.lanes.set(lanes),
        error: (error: unknown) => this.manejarError(error),
      });
  }

  private manejarError(error: unknown): void {
    this.error.set(this.apiErrorService.obtenerMensaje(error));
  }
}
