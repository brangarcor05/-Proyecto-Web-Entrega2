import { ChangeDetectorRef, DestroyRef, Directive, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, switchMap, tap } from 'rxjs';
import { ApiErrorService } from '../../core/services/api-error.service';
import { Proceso } from '../../models/proceso/proceso.model';
import { AutenticacionService } from '../../services/auth/auth.service';
import { ProcesoService } from '../../services/proceso/proceso.service';

export function idValido(valor: unknown): number | null {
  if (typeof valor !== 'number' && typeof valor !== 'string') return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

@Directive()
export abstract class DiagramaContexto implements OnInit {
  protected readonly auth = inject(AutenticacionService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly apiError = inject(ApiErrorService);
  protected readonly destroyRef = inject(DestroyRef);
  protected readonly cdr = inject(ChangeDetectorRef);
  private readonly procesos = inject(ProcesoService);
  proceso: Proceso | null = null;
  procesoId = 0;
  id: number | null = null;
  cargando = true;
  error = '';
  camposInvalidos: Record<string, string> = {};

  get puedeEditar(): boolean {
    const sesion = this.auth.sesion();
    return (
      !!sesion &&
      !!this.proceso &&
      !this.proceso.soloLectura &&
      this.proceso.estado !== 'INACTIVO' &&
      this.proceso.empresaId === sesion.empresaId &&
      (sesion.rolUsuario === 'ADMIN' || sesion.rolUsuario === 'EDITOR')
    );
  }

  get puedeEliminar(): boolean {
    return this.puedeEditar && this.auth.sesion()?.rolUsuario === 'ADMIN';
  }

  get erroresCampos(): [string, string][] {
    return Object.entries(this.camposInvalidos);
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.proceso = null;
          this.error = '';
          this.camposInvalidos = {};
          this.cargando = true;
          const sesion = this.auth.sesion();
          const procesoId = idValido(params.get('procesoId'));
          this.id = idValido(params.get('id'));
          if (!sesion) {
            this.cargando = false;
            void this.router.navigate(['/login']);
            return EMPTY;
          }
          if (!procesoId || (params.has('id') && !this.id)) {
            this.error = 'El identificador de la ruta no es válido.';
            this.cargando = false;
            return EMPTY;
          }
          this.procesoId = procesoId;
          return this.procesos.buscarPorId(procesoId, sesion.empresaId).pipe(
            tap((proceso) => {
              if (proceso.id !== procesoId) throw new Error('Proceso incorrecto');
              this.proceso = proceso;
              this.cdr.markForCheck();
            }),
            switchMap(() => this.cargarContenido()),
            catchError((error: unknown) => {
              this.mostrarError(error);
              return EMPTY;
            }),
            finalize(() => {
              this.cargando = false;
              this.cdr.markForCheck();
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  mostrarError(error: unknown): void {
    this.error = this.apiError.obtenerMensaje(error);
    this.camposInvalidos = this.apiError.obtenerCamposInvalidos(error);
    this.cdr.markForCheck();
  }

  protected validarPertenencia(procesoId: number, activo: boolean): void {
    if (procesoId !== this.procesoId || !activo) {
      throw new Error('El elemento no pertenece al proceso seleccionado o está inactivo.');
    }
  }

  protected abstract cargarContenido(): Observable<unknown>;
}
