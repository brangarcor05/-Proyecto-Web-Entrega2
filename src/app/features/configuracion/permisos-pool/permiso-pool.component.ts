import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiErrorService } from '../../../core/services/api-error.service';
import { ConfigurarPermisoPoolRequest } from '../../../models/permisopool/configurar-permiso-pool-request.model';
import { PermisoPool } from '../../../models/permisopool/permiso-pool.model';
import { AutenticacionService } from '../../../services/auth/auth.service';
import { PermisoPoolService } from '../../../services/permisoPool/permiso-pool.service';

type CampoPermiso = 'puedeCrear' | 'puedeEditar' | 'puedeEliminar';

@Component({
  selector: 'app-permiso-pool',
  imports: [RouterLink],
  templateUrl: './permiso-pool.component.html',
  styleUrl: './permiso-pool.component.css',
})
export class PermisoPoolComponent implements OnInit {
  private readonly permisoPoolService = inject(PermisoPoolService);
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly apiErrorService = inject(ApiErrorService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef); // <-- Inyectado

  permisos: PermisoPool[] = [];
  cargando = false;
  guardandoRol: string | null = null;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    const sesion = this.autenticacionService.sesion();
    if (!sesion) {
      void this.router.navigate(['/login']);
      return;
    }
    if (sesion.rolUsuario !== 'ADMIN') {
      void this.router.navigate(['/procesos']);
      return;
    }

    this.cargando = true;
    this.cdr.markForCheck(); // <-- Forzamos actualización al iniciar

    this.permisoPoolService.consultar(sesion.empresaId)
      .pipe(finalize(() => {
        this.cargando = false;
        this.cdr.markForCheck(); // <-- Forzamos actualización al terminar
      }))
      .subscribe({
        next: (permisos) => {
          this.permisos = permisos;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.apiErrorService.obtenerMensaje(error);
          this.cdr.markForCheck();
        },
      });
  }

  actualizarValor(permiso: PermisoPool, campo: CampoPermiso, valor: boolean): void {
    permiso[campo] = valor;
    this.mensaje = '';
    this.cdr.markForCheck(); // <-- Actualizamos vista al cambiar un checkbox
  }

  guardar(permiso: PermisoPool): void {
    const sesion = this.autenticacionService.sesion();
    if (!sesion || sesion.rolUsuario !== 'ADMIN') {
      return;
    }

    const request: ConfigurarPermisoPoolRequest = {
      rolUsuario: permiso.rolUsuario,
      puedeCrear: permiso.puedeCrear,
      puedeEditar: permiso.puedeEditar,
      puedeEliminar: permiso.puedeEliminar,
    };

    this.guardandoRol = permiso.rolUsuario;
    this.error = '';
    this.mensaje = '';
    this.cdr.markForCheck(); // <-- Actualizamos al empezar a guardar

    this.permisoPoolService.configurar(request, sesion.usuarioId)
      .pipe(finalize(() => {
        this.guardandoRol = null;
        this.cdr.markForCheck(); // <-- Actualizamos al terminar de guardar
      }))
      .subscribe({
        next: (actualizado) => {
          this.permisos = this.permisos.map((actual) =>
            actual.rolUsuario === actualizado.rolUsuario ? actualizado : actual,
          );
          this.mensaje = `Permisos de ${actualizado.rolUsuario} actualizados correctamente.`;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.error = this.apiErrorService.obtenerMensaje(error);
          this.cdr.markForCheck();
        },
      });
  }
}