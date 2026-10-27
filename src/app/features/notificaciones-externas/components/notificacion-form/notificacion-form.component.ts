import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of, finalize, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CrearNotificacionExternaRequest } from '../../../../models/notificacionexterna/crear-notificacion-externa-request.model';
import { ActualizarNotificacionExternaRequest } from '../../../../models/notificacionexterna/actualizar-notificacion-externa-request.model';
import { NotificacionExternaService } from '../../../../services/notificacion-externa.service';
import { DiagramaContexto } from '../../../diagrama/diagrama-contexto';
import { DiagramaCatalogoService, PoolDiagrama } from '../../../diagrama/diagrama-catalogo.service';
import { textoObligatorio, numeroFinito, idPositivo } from '../../../diagrama/diagrama-validadores';
import { ActividadService } from '../../../../services/actividad/actividad.service';
import { Actividad } from '../../../../models/bpmn/actividad/actividad.model';
import {
  AccionFalloNotificacion,
  TipoDestinoExterno,
  ACCIONES_FALLO,
  TIPOS_DESTINO,
} from '../../../../models/notificacionexterna/opciones-notificacion.model';
import {
  CampoDatoFormComponent,
  CampoDatoGrupo,
  crearCampoDato,
} from '../campo-dato-form/campo-dato-form.component';

@Component({
  selector: 'app-notificacion-form',
  imports: [RouterLink, ReactiveFormsModule, CampoDatoFormComponent],
  templateUrl: './notificacion-form.component.html',
  styleUrls: ['../../../diagrama/diagrama.css', './notificacion-form.component.css'],
})
export class NotificacionExternaFormComponent extends DiagramaContexto {
  private readonly service = inject(NotificacionExternaService);
  private readonly catalogo = inject(DiagramaCatalogoService);
  private readonly actividadesService = inject(ActividadService);
  readonly tiposDestino = TIPOS_DESTINO;
  readonly accionesFallo = ACCIONES_FALLO;
  poolsDestino: PoolDiagrama[] = [];
  actividades: Actividad[] = [];
  pools: PoolDiagrama[] = [];
  guardando = false;
  readonly formulario = new FormGroup(
    {
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [textoObligatorio, Validators.maxLength(150)],
      }),
      poolId: new FormControl<number | null>(null, [idPositivo]),
      posicionX: new FormControl<number | null>(null, [numeroFinito]),
      posicionY: new FormControl<number | null>(null, [numeroFinito]),
      poolDestinoId: new FormControl<number | null>(null, [idPositivo]),
      tipoDestino: new FormControl<TipoDestinoExterno>('CORREO', {
        nonNullable: true,
        validators: [Validators.pattern(/^(CORREO|SERVICIO_WEB|COLA)$/)],
      }),
      momentoProceso: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(250)],
      }),
      accionSiFalla: new FormControl<AccionFalloNotificacion>('CONTINUAR', {
        nonNullable: true,
        validators: [Validators.pattern(/^(CONTINUAR|DERIVAR_ERROR|FINALIZAR)$/)],
      }),
      actividadManejoErrorId: new FormControl<number | null>(null),
      campos: new FormArray<CampoDatoGrupo>([]),
    },
    {
      validators: (control) => {
        const accion = control.get('accionSiFalla')?.value;
        const actividad = control.get('actividadManejoErrorId')?.value;
        return accion === 'DERIVAR_ERROR' && !this.actividades.some((item) => item.id === actividad)
          ? { actividadError: true }
          : null;
      },
    },
  );

  get esEdicion(): boolean {
    return this.id !== null;
  }

  protected cargarContenido() {
    this.formulario.reset();
    this.formulario.controls.campos.clear();
    this.formulario.disable();
    this.pools = [];
    this.poolsDestino = [];
    this.actividades = [];
    return forkJoin({
      pools: this.catalogo.listarPools(this.procesoId),
      elemento: this.id ? this.service.buscarPorId(this.id) : of(null),
      actividades: this.actividadesService.listarPorProceso(this.procesoId),
    }).pipe(
      tap((datos) => {
        const activos = datos.pools.filter(
          (pool) => pool.activo && pool.procesoId === this.procesoId,
        );
        this.pools = activos.filter((pool) => !pool.cajaNegra);
        this.poolsDestino = activos.filter((pool) => pool.cajaNegra);
        this.actividades = datos.actividades.filter(
          (item) => item.activo && item.procesoId === this.procesoId,
        );
        if (datos.elemento) {
          this.validarPertenencia(datos.elemento.procesoId, datos.elemento.activo);
          this.formulario.patchValue({
            ...datos.elemento,
            momentoProceso: datos.elemento.momentoProceso ?? '',
          });
          for (const campo of datos.elemento.campos) {
            this.formulario.controls.campos.push(crearCampoDato(campo.nombre, campo.tipoDato));
          }
        }
        if (this.puedeEditar) {
          this.formulario.enable();
          if (this.esEdicion) this.formulario.controls.poolId.disable();
        }
        this.formulario.updateValueAndValidity();
      }),
    );
  }

  guardar(): void {
    const sesion = this.auth.sesion();
    if (!sesion || !this.puedeEditar || this.cargando || this.guardando || this.formulario.disabled)
      return;
    this.formulario.markAllAsTouched();
    this.formulario.updateValueAndValidity();
    const valor = this.formulario.getRawValue();
    if (this.formulario.invalid) {
      this.error = 'Revisa los campos obligatorios y los valores del formulario.';
      return;
    }
    if (
      !this.pools.some((pool) => pool.id === valor.poolId) ||
      !this.poolsDestino.some((pool) => pool.id === valor.poolDestinoId)
    ) {
      this.error = 'Selecciona pools activos del proceso con el tipo correcto.';
      return;
    }
    const request: ActualizarNotificacionExternaRequest = {
      nombre: valor.nombre.trim(),
      posicionX: valor.posicionX,
      posicionY: valor.posicionY,
      poolDestinoId: valor.poolDestinoId!,
      tipoDestino: valor.tipoDestino,
      momentoProceso: valor.momentoProceso.trim() || null,
      accionSiFalla: valor.accionSiFalla,
      actividadManejoErrorId:
        valor.accionSiFalla === 'DERIVAR_ERROR' ? valor.actividadManejoErrorId : null,
      campos: valor.campos.map((campo) => ({
        nombre: campo.nombre.trim(),
        tipoDato: campo.tipoDato.trim(),
      })),
    };
    this.guardando = true;
    this.error = '';
    this.camposInvalidos = {};
    const crear: CrearNotificacionExternaRequest = {
      ...request,
      procesoId: this.procesoId,
      poolId: valor.poolId!,
    };
    const operacion = this.id
      ? this.service.actualizar(this.id, request, sesion.usuarioId)
      : this.service.crear(crear, sesion.usuarioId);
    operacion
      .pipe(
        finalize(() => {
          this.guardando = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (item) =>
          void this.router.navigate(['/procesos', this.procesoId, 'notificaciones', item.id]),
        error: (error: unknown) => this.mostrarError(error),
      });
  }
}
