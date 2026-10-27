import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Empresa } from '../../../../models/empresa/empresa.model';
import { CompartirProcesoRequest } from '../../../../models/proceso/compartir-proceso-request.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { EmpresaService } from '../../../../services/empresa/Empresa.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';
import { puedeAdministrarProceso } from '../../proceso-permisos';

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
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly empresaService = inject(EmpresaService);

  readonly proceso = signal<Proceso | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly empresas = signal<Empresa[]>([]);
  readonly cargandoEmpresas = signal(false);

  readonly formulario = new FormGroup({
    compartido: new FormControl(false, { nonNullable: true }),
    empresasIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  ngOnInit(): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }
    if (!puedeAdministrarProceso(sesion.rolUsuario)) {
      void this.router.navigate(['/procesos']);
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error.set('El identificador del proceso no es válido.');
      return;
    }

    this.cargarEmpresas(sesion.empresaId);
    this.cargar(id);
  }

  cambiarEmpresa(empresaId: number, seleccionada: boolean): void {
    const actuales = this.formulario.controls.empresasIds.value;
    const empresasIds = seleccionada
      ? [...new Set([...actuales, empresaId])]
      : actuales.filter((id) => id !== empresaId);
    this.formulario.controls.empresasIds.setValue(empresasIds);
  }

  guardar(): void {
    const sesion = this.obtenerSesion();
    if (!sesion || !puedeAdministrarProceso(sesion.rolUsuario)) {
      return;
    }

    const proceso = this.proceso();
    if (!proceso || proceso.soloLectura) {
      return;
    }

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valor = this.formulario.getRawValue();
    const empresasIds = valor.empresasIds;

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
      .compartir(proceso.id, request, sesion.usuarioId)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: (actualizado) => void this.router.navigate(['/procesos', actualizado.id]),
        error: (error: unknown) => this.error.set(this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private cargar(id: number): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }

    this.cargando.set(true);
    this.procesoService
      .buscarPorId(id, sesion.empresaId)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (proceso) => {
          this.proceso.set(proceso);
          this.formulario.patchValue({
            compartido: proceso.compartido,
            empresasIds: proceso.empresasCompartidasIds ?? [],
          });
          if (proceso.soloLectura) {
            this.error.set('No puedes cambiar la compartición de un proceso ajeno.');
            this.formulario.disable();
          }
        },
        error: (error: unknown) => this.error.set(this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private cargarEmpresas(empresaActualId: number): void {
    this.cargandoEmpresas.set(true);
    this.empresaService
      .listar()
      .pipe(finalize(() => this.cargandoEmpresas.set(false)))
      .subscribe({
        next: (empresas) => {
          this.empresas.set(
            empresas.filter(
              (empresa) => empresa.id !== empresaActualId && empresa.estado === 'ACTIVO',
            ),
          );
        },
        error: (error: unknown) => this.error.set(this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private obtenerSesion(): SesionResponse | null {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) {
      void this.router.navigate(['/login']);
    }
    return sesion;
  }
}
