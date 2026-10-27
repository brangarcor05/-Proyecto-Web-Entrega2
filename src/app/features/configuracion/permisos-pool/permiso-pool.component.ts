import { Component, OnInit, inject } from '@angular/core';
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
    this.permisoPoolService.consultar(sesion.empresaId)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: (permisos) => (this.permisos = permisos),
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
      });
  }

  actualizarValor(permiso: PermisoPool, campo: CampoPermiso, valor: boolean): void {
    permiso[campo] = valor;
    this.mensaje = '';
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
    this.permisoPoolService.configurar(request, sesion.usuarioId)
      .pipe(finalize(() => (this.guardandoRol = null)))
      .subscribe({
        next: (actualizado) => {
          this.permisos = this.permisos.map((actual) =>
            actual.rolUsuario === actualizado.rolUsuario ? actualizado : actual,
          );
          this.mensaje = `Permisos de ${actualizado.rolUsuario} actualizados correctamente.`;
        },
        error: (error: unknown) => (this.error = this.apiErrorService.obtenerMensaje(error)),
      });
  }
}
