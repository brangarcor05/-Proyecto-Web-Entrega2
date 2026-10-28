import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import {
  ActualizarRolProcesoRequest,
  CrearRolProcesoRequest,
} from '../../../../models/bpmn/rolProceso/rolProceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { RolProcesoService } from '../../../../services/rolProceso/rolProceso.service';
import { puedeAdministrarRolesProceso } from '../../rol-proceso-permisos';

@Component({
  selector: 'app-rol-proceso-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './rol-proceso-form.component.html',
  styleUrl: './rol-proceso-form.component.css',
})
export class RolProcesoFormComponent implements OnInit {
  private readonly rolProcesoService = inject(RolProcesoService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly cdr = inject(ChangeDetectorRef);

  cargando = false;
  guardando = false;
  error = '';
  camposInvalidos: Record<string, string> = {};
  rolId: number | null = null;

  get entradasCamposInvalidos(): [string, string][] {
    return Object.entries(this.camposInvalidos);
  }

  get esEdicion(): boolean {
    return this.rolId !== null;
  }

  readonly formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });

  ngOnInit(): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }
    if (!puedeAdministrarRolesProceso(sesion.rolUsuario)) {
      void this.router.navigate(['/roles-proceso']);
      return;
    }

    const idTexto = this.route.snapshot.paramMap.get('id');
    if (!idTexto) {
      return;
    }

    const id = Number(idTexto);
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del rol de proceso no es válido.';
      return;
    }

    this.rolId = id;
    this.cargarRol(id);
  }

  guardar(): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !puedeAdministrarRolesProceso(sesion.rolUsuario)) {
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.limpiarError();
    this.cdr.markForCheck();
    const valor = this.formulario.getRawValue();
    const id = this.rolId;

    const operacion = id === null
      ? this.rolProcesoService.crear(this.construirCreacion(valor, sesion.empresaId), sesion.usuarioId)
      : this.rolProcesoService.actualizar(id, this.construirActualizacion(valor), sesion.usuarioId);

    operacion.pipe(finalize(() => {
      this.guardando = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => void this.router.navigate(['/roles-proceso']),
      error: (error: unknown) => this.manejarError(error),
    });
  }

  campoInvalido(campo: 'nombre' | 'descripcion'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  private cargarRol(id: number): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }

    this.cargando = true;
    this.limpiarError();
    this.cdr.markForCheck();
    this.rolProcesoService
      .buscarPorId(id, sesion.empresaId)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (rol) => {
          this.formulario.patchValue(rol);
          this.cdr.markForCheck();
        },
        error: (error: unknown) => this.manejarError(error),
      });
  }

  private construirCreacion(
    valor: typeof this.formulario.value,
    empresaId: number,
  ): CrearRolProcesoRequest {
    return {
      empresaId,
      nombre: valor.nombre?.trim() ?? '',
      descripcion: valor.descripcion?.trim() || undefined,
    };
  }

  private construirActualizacion(valor: typeof this.formulario.value): ActualizarRolProcesoRequest {
    return {
      nombre: valor.nombre?.trim() ?? '',
      descripcion: valor.descripcion?.trim() || undefined,
    };
  }

  private manejarError(error: unknown): void {
    this.error = this.apiErrorService.obtenerMensaje(error);
    this.camposInvalidos = this.apiErrorService.obtenerCamposInvalidos(error);
    this.cdr.markForCheck();
  }

  private limpiarError(): void {
    this.error = '';
    this.camposInvalidos = {};
  }

  private obtenerSesion(): SesionResponse | null {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) {
      void this.router.navigate(['/login']);
    }
    return sesion;
  }
}
