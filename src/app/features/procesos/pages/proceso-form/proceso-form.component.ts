import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { ActualizarProcesoRequest } from '../../../../models/proceso/actualizar-proceso-request.model';
import { CrearProcesoRequest } from '../../../../models/proceso/crear-proceso-request.model';
import { EstadoProceso } from '../../../../models/proceso/estado-proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';
import { puedeCrearOEditarProceso } from '../../proceso-permisos';

@Component({
  selector: 'app-proceso-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './proceso-form.component.html',
  styleUrl: './proceso-form.component.css',
})
export class ProcesoFormComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly autenticacionService = inject(AutenticacionService);

  cargando = false;
  guardando = false;
  error = '';
  camposInvalidos: Record<string, string> = {};
  procesoId: number | null = null;

  get entradasCamposInvalidos(): [string, string][] {
    return Object.entries(this.camposInvalidos);
  }

  get esEdicion(): boolean {
    return this.procesoId !== null;
  }

  readonly formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(2000)],
    }),
    categoria: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    estado: new FormControl<EstadoProceso>('BORRADOR', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }
    if (!puedeCrearOEditarProceso(sesion.rolUsuario)) {
      void this.router.navigate(['/procesos']);
      return;
    }

    const idTexto = this.route.snapshot.paramMap.get('id');
    if (!idTexto) {
      return;
    }

    const id = Number(idTexto);
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del proceso no es válido.';
      return;
    }

    this.procesoId = id;
    this.cargarProceso(id);
  }

  guardar(): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !puedeCrearOEditarProceso(sesion.rolUsuario)) {
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando = true;
    this.limpiarError();
    const valor = this.formulario.getRawValue();
    const id = this.procesoId;

    const operacion = id === null
      ? this.procesoService.crear(this.construirCreacion(valor, sesion.empresaId), sesion.usuarioId)
      : this.procesoService.actualizar(id, this.construirActualizacion(valor), sesion.usuarioId);

    operacion.pipe(finalize(() => (this.guardando = false))).subscribe({
      next: (proceso) => void this.router.navigate(['/procesos', proceso.id]),
      error: (error: unknown) => this.manejarError(error),
    });
  }

  campoInvalido(campo: 'nombre' | 'descripcion' | 'categoria' | 'estado'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.dirty || control.touched);
  }

  private cargarProceso(id: number): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }

    this.cargando = true;
    this.limpiarError();
    this.procesoService
      .buscarPorId(id, sesion.empresaId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (proceso) => {
          if (proceso.soloLectura) {
            this.error = 'Este proceso fue compartido en modo de solo lectura y no puede editarse.';
            this.formulario.disable();
            return;
          }
          this.formulario.patchValue(proceso);
        },
        error: (error: unknown) => this.manejarError(error),
      });
  }

  private construirCreacion(valor: typeof this.formulario.value, empresaId: number): CrearProcesoRequest {
    return {
      empresaId,
      nombre: valor.nombre?.trim() ?? '',
      descripcion: valor.descripcion?.trim() ?? '',
      categoria: valor.categoria?.trim() ?? '',
    };
  }

  private construirActualizacion(valor: typeof this.formulario.value): ActualizarProcesoRequest {
    return {
      nombre: valor.nombre?.trim() ?? '',
      descripcion: valor.descripcion?.trim() ?? '',
      categoria: valor.categoria?.trim() ?? '',
      estado: valor.estado ?? 'BORRADOR',
    };
  }

  private manejarError(error: unknown): void {
    this.error = this.apiErrorService.obtenerMensaje(error);
    this.camposInvalidos = this.apiErrorService.obtenerCamposInvalidos(error);
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
