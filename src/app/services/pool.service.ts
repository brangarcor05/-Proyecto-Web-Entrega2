import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ActualizarPoolRequest } from '../models/pool/actualizar-pool-request.model';
import { CrearPoolRequest } from '../models/pool/crear-pool-request.model';
import { Pool } from '../models/pool/pool.model';

@Injectable({ providedIn: 'root' })
export class PoolService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/pools`;

  listarPorProceso(procesoId: number): Observable<Pool[]> {
    const params = new HttpParams().set('procesoId', procesoId);
    return this.http.get<Pool[]>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<Pool> {
    return this.http.get<Pool>(`${this.apiUrl}/${id}`);
  }

  crear(request: CrearPoolRequest, usuarioId: number): Observable<Pool> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.post<Pool>(this.apiUrl, request, { params });
  }

  actualizar(id: number, request: ActualizarPoolRequest, usuarioId: number): Observable<Pool> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.put<Pool>(`${this.apiUrl}/${id}`, request, { params });
  }

  eliminar(id: number, usuarioId: number): Observable<void> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }
}
