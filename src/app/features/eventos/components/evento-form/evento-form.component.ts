import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of, finalize, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CrearEventoRequest } from '../../../../models/evento/crear-evento-request.model';
import { ActualizarEventoRequest } from '../../../../models/evento/actualizar-evento-request.model';
import { EventoService } from '../../../../services/evento.service';
import { DiagramaContexto } from '../../../diagrama/diagrama-contexto';
import { DiagramaCatalogoService, PoolDiagrama } from '../../../diagrama/diagrama-catalogo.service';
import { textoObligatorio, numeroFinito, idPositivo } from '../../../diagrama/diagrama-validadores';
import { TipoEvento } from '../../../../models/evento/tipo-evento.model';

@Component({
  selector: 'app-evento-form',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './evento-form.component.html',
  styleUrls: ['../../../diagrama/diagrama.css', './evento-form.component.css'],
})
export class EventoFormComponent extends DiagramaContexto {
  private readonly service = inject(EventoService);
  private readonly catalogo = inject(DiagramaCatalogoService);

  pools: PoolDiagrama[] = [];
  guardando = false;
  readonly formulario = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [textoObligatorio, Validators.maxLength(150)],
    }),
    poolId: new FormControl<number | null>(null, [idPositivo]),
    posicionX: new FormControl<number | null>(null, [numeroFinito]),
    posicionY: new FormControl<number | null>(null, [numeroFinito]),
    tipo: new FormControl<TipoEvento>('INICIO', {
      nonNullable: true,
      validators: [Validators.pattern(/^(INICIO|FIN)$/)],
    }),
  });

  get esEdicion(): boolean {
    return this.id !== null;
  }

  protected cargarContenido() {
    this.formulario.reset();

    this.formulario.disable();
    this.pools = [];

    return forkJoin({
      pools: this.catalogo.listarPools(this.procesoId),
      elemento: this.id ? this.service.buscarPorId(this.id) : of(null),
    }).pipe(
      tap((datos) => {
        const activos = datos.pools.filter(
          (pool) => pool.activo && pool.procesoId === this.procesoId,
        );
        this.pools = activos.filter((pool) => !pool.cajaNegra);

        if (datos.elemento) {
          this.validarPertenencia(datos.elemento.procesoId, datos.elemento.activo);
          this.formulario.patchValue({
            ...datos.elemento,
          });
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
    if (!this.pools.some((pool) => pool.id === valor.poolId)) {
      this.error = 'Selecciona pools activos del proceso con el tipo correcto.';
      return;
    }
    const request: ActualizarEventoRequest = {
      nombre: valor.nombre.trim(),
      posicionX: valor.posicionX,
      posicionY: valor.posicionY,
      tipo: valor.tipo,
    };
    this.guardando = true;
    this.error = '';
    this.camposInvalidos = {};
    const crear: CrearEventoRequest = {
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
          void this.router.navigate(['/procesos', this.procesoId, 'eventos', item.id]),
        error: (error: unknown) => this.mostrarError(error),
      });
  }
}
