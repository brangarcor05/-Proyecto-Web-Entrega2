import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../../models/auth/auth.model';
import { PermisoPool } from '../../../../../models/permisopool/permiso-pool.model';
import { Pool } from '../../../../../models/pool/pool.model';
import { AutenticacionService } from '../../../../../services/auth/auth.service';
import { PermisoPoolService } from '../../../../../services/permisoPool/permiso-pool.service';
import { PoolService } from '../../../../../services/pool/pool.service';
import { ProcesoService } from '../../../../../services/proceso/proceso.service';

@Component({
  selector: 'app-pool-list',
  imports: [RouterLink],
  templateUrl: './pool-list.component.html',
  styleUrl: './pool-list.component.css',
})
export class PoolListComponent implements OnInit {
  private readonly poolService = inject(PoolService);
  private readonly procesoService = inject(ProcesoService);
  private readonly permisoPoolService = inject(PermisoPoolService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef); // <-- Inyectado

  procesoId: number | null = null;
  procesoSoloLectura = true;
  permisoActual: PermisoPool | null = null;
  pools: Pool[] = [];
  cargando = false;
  eliminandoId: number | null = null;
  error = '';

  get puedeCrearOEditar(): boolean {
    return this.permisoActual !== null
      && (this.permisoActual.puedeCrear || this.permisoActual.puedeEditar)
      && !this.procesoSoloLectura;
  }

  get puedeEliminar(): boolean {
    return this.permisoActual?.puedeEliminar === true && !this.procesoSoloLectura;
  }

  ngOnInit(): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }

    const procesoId = this.obtenerId('procesoId');
    if (procesoId === null) {
      return;
    }

    this.procesoId = procesoId;
    this.cargarPermiso(sesion);
    this.cargarProceso(procesoId, sesion);
    this.cargarPools(procesoId);
  }

  private cargarPermiso(sesion: SesionResponse): void {
    this.permisoPoolService.consultar(sesion.empresaId).subscribe({
      next: (permisos) => {
        this.permisoActual = permisos.find(
          (permiso) => permiso.rolUsuario === sesion.rolUsuario,
        ) ?? null;
        this.cdr.markForCheck(); // <-- Actualizamos vista
      },
      error: (error: unknown) => {
        this.error = this.apiErrorService.obtenerMensaje(error);
        this.cdr.markForCheck();
      },
    });
  }

  eliminar(pool: Pool): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !this.puedeEliminar || pool.esPropietario) {
      return;
    }

    if (!window.confirm(`¿Deseas eliminar el pool “${pool.nombre}”?`)) {
      return;
    }

    this.eliminandoId = pool.id;
    this.error = '';
    this.poolService.eliminar(pool.id, sesion.usuarioId)
      .pipe(finalize(() => {
        this.eliminandoId = null;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.pools = this.pools.filter((actual) => actual.id !== pool.id);
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.apiErrorService.obtenerMensaje(error);
          this.cdr.markForCheck();
        },
      });
  }

  private cargarProceso(procesoId: number, sesion: SesionResponse): void {
    this.procesoService.buscarPorId(procesoId, sesion.empresaId).subscribe({
      next: (proceso) => {
        this.procesoSoloLectura = proceso.soloLectura;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.error = this.apiErrorService.obtenerMensaje(error);
        this.cdr.markForCheck();
      },
    });
  }

  private cargarPools(procesoId: number): void {
    this.cargando = true;
    this.cdr.markForCheck(); // <-- Forzamos actualización al iniciar
    this.poolService.listarPorProceso(procesoId)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck(); // <-- Forzamos actualización al terminar
      }))
      .subscribe({
        next: (pools) => {
          this.pools = pools;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.apiErrorService.obtenerMensaje(error);
          this.cdr.markForCheck();
        },
      });
  }

  private obtenerId(nombre: string): number | null {
    const id = Number(this.route.snapshot.paramMap.get(nombre));
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del proceso no es válido.';
      return null;
    }
    return id;
  }

  private obtenerSesion(): SesionResponse | null {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) {
      void this.router.navigate(['/login']);
    }
    return sesion;
  }
}