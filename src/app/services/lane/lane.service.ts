import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ActualizarLaneRequest,
  CrearLaneRequest,
  Lane,
  ReordenarLanesRequest,
} from '../../models/bpmn/lane/lane.model';

/**
 * Lanes del diagrama (HU-22). Crear/editar: ADMIN o EDITOR. Eliminar: solo ADMIN
 * (ver PermisoService#validarPuedeCrearPoolsYLanes / validarPuedeEliminarPoolsYLanes).
 */
@Injectable({ providedIn: 'root' })
export class LaneService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/lanes`;

  listarPorPool(poolId: number): Observable<Lane[]> {
    const params = new HttpParams().set('poolId', poolId);
    return this.http.get<Lane[]>(this.apiUrl, { params });
  }

  crear(request: CrearLaneRequest): Observable<Lane> {
    return this.http.post<Lane>(this.apiUrl, request);
  }

  actualizar(id: number, request: ActualizarLaneRequest): Observable<Lane> {
    return this.http.put<Lane>(`${this.apiUrl}/${id}`, request);
  }

  /** HU-22: reordena todas las lanes de un pool en un solo llamado. */
  reordenar(
    poolId: number,
    request: ReordenarLanesRequest
  ): Observable<Lane[]> {
    const params = new HttpParams().set('poolId', poolId);
    return this.http.put<Lane[]>(`${this.apiUrl}/reordenar`, request, { params });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
