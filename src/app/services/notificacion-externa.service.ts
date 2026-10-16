import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ActualizarNotificacionExternaRequest } from '../models/notificacionexterna/actualizar-notificacion-externa-request.model';
import { CrearNotificacionExternaRequest } from '../models/notificacionexterna/crear-notificacion-externa-request.model';
import { NotificacionExterna } from '../models/notificacionexterna/notificacion-externa.model';

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
    request: CrearNotificacionExternaRequest,
    usuarioId: number,
  ): Observable<NotificacionExterna> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.post<NotificacionExterna>(this.apiUrl, request, { params });
  }

  actualizar(
    id: number,
    request: ActualizarNotificacionExternaRequest,
    usuarioId: number,
  ): Observable<NotificacionExterna> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.put<NotificacionExterna>(`${this.apiUrl}/${id}`, request, { params });
  }

  eliminar(id: number, usuarioId: number): Observable<void> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }
}
