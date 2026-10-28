import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ActualizarArcoRequest } from '../../models/arco/actualizar-arco-request.model';
import { ArcoEliminado } from '../../models/arco/arco-eliminado.model';
import { Arco } from '../../models/arco/arco.model';
import { CrearArcoRequest } from '../../models/arco/crear-arco-request.model';

@Injectable({ providedIn: 'root' })
export class ArcoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/arcos`;

  listarPorProceso(procesoId: number): Observable<Arco[]> {
    const params = new HttpParams().set('procesoId', procesoId);
    return this.http.get<Arco[]>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<Arco> {
    return this.http.get<Arco>(`${this.apiUrl}/${id}`);
  }

  crear(request: CrearArcoRequest, usuarioId: number): Observable<Arco> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.post<Arco>(this.apiUrl, request, { params });
  }

  actualizar(id: number, request: ActualizarArcoRequest, usuarioId: number): Observable<Arco> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.put<Arco>(`${this.apiUrl}/${id}`, request, { params });
  }

  eliminar(id: number, usuarioId: number): Observable<ArcoEliminado> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.delete<ArcoEliminado>(`${this.apiUrl}/${id}`, { params });
  }
}
