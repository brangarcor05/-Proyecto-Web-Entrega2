import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ActualizarEventoRequest } from '../models/evento/actualizar-evento-request.model';
import { CrearEventoRequest } from '../models/evento/crear-evento-request.model';
import { Evento } from '../models/evento/evento.model';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/eventos`;

  listarPorProceso(procesoId: number): Observable<Evento[]> {
    const params = new HttpParams().set('procesoId', procesoId);
    return this.http.get<Evento[]>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrl}/${id}`);
  }

  crear(request: CrearEventoRequest, usuarioId: number): Observable<Evento> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.post<Evento>(this.apiUrl, request, { params });
  }

  actualizar(id: number, request: ActualizarEventoRequest, usuarioId: number): Observable<Evento> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.put<Evento>(`${this.apiUrl}/${id}`, request, { params });
  }

  eliminar(id: number, usuarioId: number): Observable<void> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }
}
