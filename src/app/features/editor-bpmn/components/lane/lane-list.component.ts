import { Component, Input, OnChanges, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { Lane } from '../../../../models/bpmn/lane/lane.model';
import { RolProceso } from '../../../../models/bpmn/rolProceso/rolProceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { LaneService } from '../../../../services/lane/lane.service';
import { RolProcesoService } from '../../../../services/rolProceso/rolProceso.service';
import { puedeCrearOEditarLane, puedeEliminarLane } from '../../lane-permisos';

/**
 * Administra las lanes de un pool (HU-22). No tiene ruta propia: se embebe donde
 * viva la edición del pool (todavía no existe en el frontend — features/editor-bpmn/
 * components/pool sigue vacío), pasándole el poolId por @Input.
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
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly autenticacionService = inject(AutenticacionService);

  lanes = signal<Lane[]>([]);
  rolesDisponibles = signal<RolProceso[]>([]);
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
    const sesion = this.autenticacionService.sesion();
    return sesion !== null && puedeCrearOEditarLane(sesion.rolUsuario);
  }

  get puedeEliminar(): boolean {
    const sesion = this.autenticacionService.sesion();
    return sesion !== null && puedeEliminarLane(sesion.rolUsuario);
  }

  get esEdicion(): boolean {
    return this.editandoId() !== null;
  }

  ngOnChanges(): void {
    this.cargarLanes();
    this.cargarRolesDisponibles();
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
    if (!sesion || !puedeCrearOEditarLane(sesion.rolUsuario)) {
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const rolProcesoId = this.formulario.getRawValue().rolProcesoId!;
    this.guardando.set(true);
    this.error.set('');

    const idEnEdicion = this.editandoId();
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
    if (!sesion || !puedeEliminarLane(sesion.rolUsuario)) {
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
    if (!sesion || !puedeCrearOEditarLane(sesion.rolUsuario)) {
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
