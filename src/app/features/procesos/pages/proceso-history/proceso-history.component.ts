import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

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
  private readonly cdr = inject(ChangeDetectorRef); 

  procesoId: number | null = null;
  registros: Historial[] = [];
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargando = true;
    this.cdr.markForCheck(); 

    const sesion = this.obtenerSesion();
    if (!sesion) {
      this.cargando = false;
      this.cdr.markForCheck();
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'El identificador del proceso no es válido.';
      this.cargando = false;
      this.cdr.markForCheck();
      return;
    }

    this.procesoId = id;

    this.procesoService
      .consultarHistorial(id, sesion.empresaId)
      .pipe(
        catchError((error) => {
          console.error('Error al cargar historial:', error); 
          this.error = this.apiErrorService.obtenerMensaje(error);
          return of([]); 
        }),
        finalize(() => {
          this.cargando = false;
          this.cdr.markForCheck(); 
        })
      )
      .subscribe({
        next: (registros) => {
          console.log('Registros recibidos:', registros); 
          this.registros = registros ?? [];
          this.cdr.markForCheck(); 
        },
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