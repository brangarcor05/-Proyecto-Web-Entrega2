import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ActualizarEventoRequest } from '../../models/evento/actualizar-evento-request.model';
import { CrearEventoRequest } from '../../models/evento/crear-evento-request.model';
import { Evento } from '../../models/evento/evento.model';

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

  crear(request: CrearEventoRequest): Observable<Evento> {
    return this.http.post<Evento>(this.apiUrl, request);
  }

  actualizar(id: number, request: ActualizarEventoRequest): Observable<Evento> {
    return this.http.put<Evento>(`${this.apiUrl}/${id}`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
