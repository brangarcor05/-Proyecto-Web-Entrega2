import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../../models/auth/auth.model';
import { Pool } from '../../../../../models/pool/pool.model';
import { AutenticacionService } from '../../../../../services/auth/auth.service';
import { PoolService } from '../../../../../services/pool.service';
import { ProcesoService } from '../../../../../services/proceso.service';
import { puedeAdministrarProceso, puedeCrearOEditarProceso } from '../../../../procesos/proceso-permisos';

@Component({
  selector: 'app-pool-list',
  imports: [RouterLink],
  templateUrl: './pool-list.component.html',
  styleUrl: './pool-list.component.css',
})
export class PoolListComponent implements OnInit {
  private readonly poolService = inject(PoolService);
  private readonly procesoService = inject(ProcesoService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  procesoId: number | null = null;
  procesoSoloLectura = true;
  pools: Pool[] = [];
  cargando = false;
  eliminandoId: number | null = null;
  error = '';

  get puedeCrearOEditar(): boolean {
    const sesion = this.autenticacionService.sesion();
    return sesion !== null
      && puedeCrearOEditarProceso(sesion.rolUsuario)
      && !this.procesoSoloLectura;
  }

  get puedeEliminar(): boolean {
    const sesion = this.autenticacionService.sesion();
    return sesion !== null
      && puedeAdministrarProceso(sesion.rolUsuario)
      && !this.procesoSoloLectura;
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
    this.cargarProceso(procesoId, sesion);
    this.cargarPools(procesoId);
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
      .pipe(finalize(() => (this.eliminandoId = null)))
      .subscribe({
        next: () => (this.pools = this.pools.filter((actual) => actual.id !== pool.id)),
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private cargarProceso(procesoId: number, sesion: SesionResponse): void {
    this.procesoService.buscarPorId(procesoId, sesion.empresaId).subscribe({
      next: (proceso) => (this.procesoSoloLectura = proceso.soloLectura),
      error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
    });
  }

  private cargarPools(procesoId: number): void {
    this.cargando = true;
    this.poolService.listarPorProceso(procesoId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (pools) => (this.pools = pools),
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
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
