import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PageResponse } from '../../models/common/page-response.model';
import {
  ActualizarRolProcesoRequest,
  CrearRolProcesoRequest,
  RolProceso,
} from '../../models/bpmn/rolProceso/rolProceso.model';
import { ConsultarRolesProcesoParams } from '../../models/bpmn/rolProceso/consultar-roles-proceso-params.model';

/**
 * Roles de proceso (HU-17 a HU-20): catálogo de funciones de la empresa
 * que se usa para nombrar lanes. Solo el administrador puede crear,
 * editar o eliminar roles (ver RolProcesoService en el backend).
 */
@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles-proceso`;

  consultar(filtros: ConsultarRolesProcesoParams): Observable<PageResponse<RolProceso>> {
    let params = new HttpParams().set('empresaId', filtros.empresaId);

    if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }
    if (filtros.page !== undefined) {
      params = params.set('page', filtros.page);
    }
    if (filtros.size !== undefined) {
      params = params.set('size', filtros.size);
    }
    if (filtros.sort) {
      params = params.set('sort', filtros.sort);
    }

    return this.http.get<PageResponse<RolProceso>>(this.apiUrl, { params });
  }

  /** Catálogo completo (sin paginar) para usarlo en selects, como el del formulario de lanes. */
  listarTodos(empresaId: number): Observable<PageResponse<RolProceso>> {
    return this.consultar({ empresaId, size: 200, sort: 'nombre,asc' });
  }

  buscarPorId(id: number, empresaId: number): Observable<RolProceso> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<RolProceso>(`${this.apiUrl}/${id}`, { params });
  }

  crear(request: CrearRolProcesoRequest, usuarioId: number): Observable<RolProceso> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.post<RolProceso>(this.apiUrl, request, { params });
  }

  actualizar(
    id: number,
    request: ActualizarRolProcesoRequest,
    usuarioId: number,
  ): Observable<RolProceso> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.put<RolProceso>(`${this.apiUrl}/${id}`, request, { params });
  }

  eliminar(id: number, usuarioId: number): Observable<void> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }
}
