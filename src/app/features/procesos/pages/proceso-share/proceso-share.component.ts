import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { CompartirProcesoRequest } from '../../../../models/proceso/compartir-proceso-request.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { ProcesoService } from '../../../../services/proceso.service';
import { PROCESO_CONTEXTO_TEMPORAL } from '../../proceso-contexto';

@Component({
  selector: 'app-proceso-share',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './proceso-share.component.html',
  styleUrl: './proceso-share.component.css',
})
export class ProcesoShareComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly proceso = signal<Proceso | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');

  readonly formulario = new FormGroup({
    compartido: new FormControl(false, { nonNullable: true }),
    empresasIds: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^\s*\d+(\s*,\s*\d+)*\s*$|^\s*$/)],
    }),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('El identificador del proceso no es válido.');
      return;
    }

    this.cargar(id);
  }

  guardar(): void {
    const proceso = this.proceso();
    if (!proceso || proceso.soloLectura) {
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();
    const empresasIds = valor.empresasIds
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (valor.compartido && empresasIds.length === 0) {
      this.error.set('Para compartir el proceso debes indicar al menos una empresa.');
      return;
    }

    const request: CompartirProcesoRequest = {
      compartido: valor.compartido,
      empresasIds: valor.compartido ? [...new Set(empresasIds)] : [],
    };

    this.guardando.set(true);
    this.error.set('');
    this.procesoService
      .compartir(proceso.id, request, PROCESO_CONTEXTO_TEMPORAL.usuarioId)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (actualizado) => void this.router.navigate(['/procesos', actualizado.id]),
        error: (error: unknown) => this.error.set(this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private cargar(id: number): void {
    this.cargando.set(true);
    this.procesoService
      .buscarPorId(id, PROCESO_CONTEXTO_TEMPORAL.empresaId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (proceso) => {
          this.proceso.set(proceso);
          this.formulario.patchValue({ compartido: proceso.compartido });
          if (proceso.soloLectura) {
            this.error.set('No puedes cambiar la compartición de un proceso ajeno.');
            this.formulario.disable();
          }
        },
        error: (error: unknown) => this.error.set(this.apiErrorService.obtenerMensaje(error)),
      });
  }
}
