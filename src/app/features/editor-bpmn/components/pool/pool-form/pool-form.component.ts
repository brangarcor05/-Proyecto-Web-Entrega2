import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../../models/auth/auth.model';
import { PermisoPool } from '../../../../../models/permisopool/permiso-pool.model';
import { AutenticacionService } from '../../../../../services/auth/auth.service';
import { PermisoPoolService } from '../../../../../services/permisoPool/permiso-pool.service';
import { PoolService } from '../../../../../services/pool/pool.service';
import { ProcesoService } from '../../../../../services/proceso/proceso.service';

@Component({
  selector: 'app-pool-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './pool-form.component.html',
  styleUrl: './pool-form.component.css',
})
export class PoolFormComponent implements OnInit {
  private readonly poolService = inject(PoolService);
  private readonly procesoService = inject(ProcesoService);
  private readonly permisoPoolService = inject(PermisoPoolService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef); // <-- Inyectado

  procesoId: number | null = null;
  poolId: number | null = null;
  permisoActual: PermisoPool | null = null;
  cargando = false;
  guardando = false;
  error = '';
  camposInvalidos: Record<string, string> = {};

  readonly formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    cajaNegra: new FormControl(false, { nonNullable: true }),
  });

  get esEdicion(): boolean {
    return this.poolId !== null;
  }

  get entradasCamposInvalidos(): [string, string][] {
    return Object.entries(this.camposInvalidos);
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

    const poolIdTexto = this.route.snapshot.paramMap.get('poolId');
    if (poolIdTexto !== null) {
      const poolId = this.obtenerId('poolId');
      if (poolId === null) {
        return;
      }
      this.poolId = poolId;
    }

    this.validarPermiso(sesion);
  }

  guardar(): void {
    const sesion = this.obtenerSesion();
    const tienePermiso = this.poolId === null
      ? this.permisoActual?.puedeCrear
      : this.permisoActual?.puedeEditar;
    if (!sesion || !tienePermiso || this.procesoId === null) {
      return;
    }
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();
    const datos = { nombre: valor.nombre.trim(), cajaNegra: valor.cajaNegra };
    const operacion = this.poolId === null
      ? this.poolService.crear({ procesoId: this.procesoId, ...datos }, sesion.usuarioId)
      : this.poolService.actualizar(this.poolId, datos, sesion.usuarioId);

    this.guardando = true;
    this.error = '';
    this.camposInvalidos = {};
    this.cdr.markForCheck(); // <-- Actualizamos vista al empezar a guardar

    operacion.pipe(finalize(() => {
      this.guardando = false;
      this.cdr.markForCheck(); // <-- Actualizamos vista al terminar
    })).subscribe({
      next: () => void this.router.navigate(['/procesos', this.procesoId, 'pools']),
      error: (error: unknown) => {
        this.error = this.apiErrorService.obtenerMensaje(error);
        this.camposInvalidos = this.apiErrorService.obtenerCamposInvalidos(error);
        this.cdr.markForCheck();
      },
    });
  }

  private validarPermiso(sesion: SesionResponse): void {
    this.cargando = true;
    this.cdr.markForCheck();
    this.permisoPoolService.consultar(sesion.empresaId).subscribe({
      next: (permisos) => {
        this.permisoActual = permisos.find(
          (permiso) => permiso.rolUsuario === sesion.rolUsuario,
        ) ?? null;
        const tienePermiso = this.poolId === null
          ? this.permisoActual?.puedeCrear
          : this.permisoActual?.puedeEditar;
        if (!tienePermiso) {
          void this.router.navigate(['/procesos', this.procesoId, 'pools']);
          return;
        }
        this.validarProcesoEditable(this.procesoId!, sesion);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.error = this.apiErrorService.obtenerMensaje(error);
        this.cdr.markForCheck();
      },
    });
  }

  campoNombreInvalido(): boolean {
    const control = this.formulario.controls.nombre;
    return control.invalid && (control.dirty || control.touched);
  }

  private validarProcesoEditable(procesoId: number, sesion: SesionResponse): void {
    this.procesoService.buscarPorId(procesoId, sesion.empresaId).subscribe({
      next: (proceso) => {
        if (proceso.soloLectura) {
          void this.router.navigate(['/procesos', procesoId, 'pools']);
          return;
        }
        if (this.poolId !== null) {
          this.cargarPool(this.poolId);
          return;
        }
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.error = this.apiErrorService.obtenerMensaje(error);
        this.cdr.markForCheck();
      },
    });
  }

  private cargarPool(poolId: number): void {
    this.poolService.buscarPorId(poolId)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (pool) => {
          if (pool.procesoId !== this.procesoId) {
            this.error = 'El pool no pertenece al proceso indicado.';
            this.formulario.disable();
            this.cdr.markForCheck();
            return;
          }
          this.formulario.patchValue({ nombre: pool.nombre, cajaNegra: pool.cajaNegra });
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
      this.error = `El identificador de ${nombre === 'procesoId' ? 'proceso' : 'pool'} no es válido.`;
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