import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ActualizarNotificacionExternaRequest } from '../../models/notificacionexterna/actualizar-notificacion-externa-request.model';
import { CrearNotificacionExternaRequest } from '../../models/notificacionexterna/crear-notificacion-externa-request.model';
import { NotificacionExterna } from '../../models/notificacionexterna/notificacion-externa.model';

@Injectable({ providedIn: 'root' })
export class NotificacionExternaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notificaciones-externas`;

  listarPorProceso(procesoId: number): Observable<NotificacionExterna[]> {
    const params = new HttpParams().set('procesoId', procesoId);
    return this.http.get<NotificacionExterna[]>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<NotificacionExterna> {
    return this.http.get<NotificacionExterna>(`${this.apiUrl}/${id}`);
  }

  crear(
    request: CrearNotificacionExternaRequest
  ): Observable<NotificacionExterna> {
    return this.http.post<NotificacionExterna>(this.apiUrl, request);
  }

  actualizar(
    id: number,
    request: ActualizarNotificacionExternaRequest
  ): Observable<NotificacionExterna> {
    return this.http.put<NotificacionExterna>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
