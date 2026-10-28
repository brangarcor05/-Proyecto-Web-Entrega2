import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Pool } from '../../../../models/pool/pool.model';
import { TipoEvento } from '../../../../models/evento/tipo-evento.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { EventoService } from '../../../../services/evento/evento.service';
import { PoolService } from '../../../../services/pool/pool.service';

@Component({
  selector: 'app-evento-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: 'evento-form.component.html',
})
export class EventoFormComponent implements OnInit {
  private readonly eventoService = inject(EventoService);
  private readonly poolService = inject(PoolService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  procesoId: number | null = null;
  eventoId: number | null = null;
  pools: Pool[] = [];
  cargando = false;
  guardando = false;
  error = '';

  readonly formulario = new FormGroup({
    poolId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipo: new FormControl<TipoEvento>('INICIO', { nonNullable: true, validators: [Validators.required] }),
    canvasId: new FormControl('', { nonNullable: true }), // <-- EL PUENTE CON EL CANVAS
  });

  get esEdicion(): boolean {
    return this.eventoId !== null;
  }

  ngOnInit(): void {
    const sesion = this.obtenerSesion();
    if (!sesion) return;

    this.procesoId = Number(this.route.snapshot.paramMap.get('procesoId'));
    if (!this.procesoId) {
      this.router.navigate(['/procesos']);
      return;
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.eventoId = Number(idParam);
    }

    this.cargarPools(sesion);
    if (this.eventoId) {
      this.cargarEvento(this.eventoId);
    }
  }

  private cargarPools(sesion: SesionResponse): void {
    this.poolService.listarPorProceso(this.procesoId!).subscribe({
      next: (pools) => {
        this.pools = pools;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = this.apiErrorService.obtenerMensaje(err);
        this.cdr.markForCheck();
      },
    });
  }

  private cargarEvento(id: number): void {
    this.cargando = true;
    this.eventoService.buscarPorId(id)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (evento) => {
          this.formulario.patchValue({
            poolId: evento.poolId,
            nombre: evento.nombre,
            tipo: evento.tipo,
            canvasId: evento.canvasId ?? '',
          });
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = this.apiErrorService.obtenerMensaje(err);
          this.cdr.markForCheck();
        },
      });
  }

  guardar(): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !this.procesoId) return;
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();
    const request = {
      procesoId: this.procesoId,
      poolId: valor.poolId!,
      nombre: valor.nombre,
      tipo: valor.tipo,
      canvasId: valor.canvasId || null,
    };

    this.guardando = true;
    this.error = '';
    this.cdr.markForCheck();

    const operacion = this.eventoId
      ? this.eventoService.actualizar(this.eventoId, request, sesion.usuarioId)
      : this.eventoService.crear(request, sesion.usuarioId);

    operacion.pipe(finalize(() => {
      this.guardando = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: () => void this.router.navigate(['/procesos', this.procesoId, 'eventos']),
      error: (err) => {
        this.error = this.apiErrorService.obtenerMensaje(err);
        this.cdr.markForCheck();
      },
    });
  }

  private obtenerSesion(): SesionResponse | null {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) {
      this.router.navigate(['/login']);
    }
    return sesion;
  }
}