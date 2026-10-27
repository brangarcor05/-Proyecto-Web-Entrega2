import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Proceso } from '../../../../models/proceso/proceso.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso.service';
import { EstadoProcesoComponent } from '../../components/estado-proceso/estado-proceso.component';
import { puedeAdministrarProceso, puedeCrearOEditarProceso } from '../../proceso-permisos';

@Component({
  selector: 'app-proceso-detail',
  imports: [RouterLink, EstadoProcesoComponent],
  templateUrl: './proceso-detail.component.html',
  styleUrl: './proceso-detail.component.css',
})
export class ProcesoDetailComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly autenticacionService = inject(AutenticacionService);

  proceso: Proceso | null = null;
  cargando = false;
  eliminando = false;
  error = '';

  get puedeEditar(): boolean {
    const sesion = this.autenticacionService.sesion();
    return sesion !== null && puedeCrearOEditarProceso(sesion.rolUsuario);
  }

  get puedeAdministrar(): boolean {
    const sesion = this.autenticacionService.sesion();
    return sesion !== null && puedeAdministrarProceso(sesion.rolUsuario);
  }

  ngOnInit(): void {
    if (!this.obtenerSesion()) {
      return;
    }

    const id = this.obtenerId();
    if (id !== null) {
      this.cargar(id);
    }
  }

  eliminar(): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }

    const proceso = this.proceso;
    if (!proceso || proceso.soloLectura || !puedeAdministrarProceso(sesion.rolUsuario)) {
      return;
    }

    if (!window.confirm(`¿Deseas eliminar el proceso “${proceso.nombre}”?`)) {
      return;
    }

    this.eliminando = true;
    this.error = '';
    this.procesoService
      .eliminar(proceso.id, sesion.usuarioId)
      .pipe(finalize(() => (this.eliminando = false)))
      .subscribe({
        next: () => void this.router.navigate(['/procesos']),
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private cargar(id: number): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }

    this.cargando = true;
    this.error = '';
    this.procesoService
      .buscarPorId(id, sesion.empresaId)
      .pipe(
        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (proceso) => (this.proceso = proceso),
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
      });
  }

  private obtenerId(): number | null {
    const id = Number(this.route.snapshot.paramMap.get('id'));
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
