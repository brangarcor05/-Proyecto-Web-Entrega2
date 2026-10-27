import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../../core/services/api-error.service';
import { SesionResponse } from '../../../../models/auth/auth.model';
import { Historial } from '../../../../models/proceso/historial.model';
import { AutenticacionService } from '../../../../services/auth/auth.service';
import { ProcesoService } from '../../../../services/proceso/proceso.service';

@Component({
  selector: 'app-proceso-history',
  imports: [RouterLink],
  templateUrl: './proceso-history.component.html',
  styleUrl: './proceso-history.component.css',
})
export class ProcesoHistoryComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly autenticacionService = inject(AutenticacionService);

  procesoId: number | null = null;
  registros: Historial[] = [];
  cargando = false;
  error = '';

  ngOnInit(): void {
    const sesion = this.obtenerSesion();
    if (!sesion) {
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del proceso no es válido.';
      return;
    }

    this.procesoId = id;
    this.cargando = true;
    this.procesoService
      .consultarHistorial(id, sesion.empresaId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (registros) => (this.registros = registros),
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
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
