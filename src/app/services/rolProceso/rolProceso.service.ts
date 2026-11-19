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
 * que se usa para nombrar lanes.
 *
 * Ya no se envían empresaId ni usuarioId: el backend los toma del access token, así
 * que un usuario solo puede ver y modificar los roles de su propia empresa.
 * Consultar está permitido a todos los roles de acceso; crear, editar y eliminar
 * solo al ADMIN (el backend responde 403 a los demás).
 */
@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/roles-proceso`;

  consultar(filtros: ConsultarRolesProcesoParams = {}): Observable<PageResponse<RolProceso>> {
    let params = new HttpParams();

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
  listarTodos(): Observable<PageResponse<RolProceso>> {
    return this.consultar({ size: 200, sort: 'nombre,asc' });
  }

  buscarPorId(id: number): Observable<RolProceso> {
    return this.http.get<RolProceso>(`${this.apiUrl}/${id}`);
  }

  crear(request: CrearRolProcesoRequest): Observable<RolProceso> {
    return this.http.post<RolProceso>(this.apiUrl, request);
  }

  actualizar(id: number, request: ActualizarRolProcesoRequest): Observable<RolProceso> {
    return this.http.put<RolProceso>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
