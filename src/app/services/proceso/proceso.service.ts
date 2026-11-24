import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

import { PageResponse } from '../../models/common/page-response.model';
import { ActualizarProcesoRequest } from '../../models/proceso/actualizar-proceso-request.model';
import { CompartirProcesoRequest } from '../../models/proceso/compartir-proceso-request.model';
import { ConsultarProcesosParams } from '../../models/proceso/consultar-procesos-params.model';
import { CrearProcesoRequest } from '../../models/proceso/crear-proceso-request.model';
import { Historial } from '../../models/proceso/historial.model';
import { Proceso } from '../../models/proceso/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/procesos`;

  consultar(filtros: ConsultarProcesosParams): Observable<PageResponse<Proceso>> {
    let params = new HttpParams();

    if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }

    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }

    if (filtros.categoria) {
      params = params.set('categoria', filtros.categoria);
    }

    if (filtros.incluirInactivos !== undefined) {
      params = params.set('incluirInactivos', filtros.incluirInactivos);
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

    return this.http.get<PageResponse<Proceso>>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<Proceso> {
    return this.http.get<Proceso>(`${this.apiUrl}/${id}`);
  }

  consultarHistorial(id: number): Observable<Historial[]> {
    return this.http.get<Historial[]>(`${this.apiUrl}/${id}/historial`);
  }

  crear(request: CrearProcesoRequest): Observable<Proceso> {
    return this.http.post<Proceso>(this.apiUrl, request);
  }

  actualizar(
    id: number,
    request: ActualizarProcesoRequest
  ): Observable<Proceso> {
    return this.http.put<Proceso>(`${this.apiUrl}/${id}`, request);
  }

  compartir(id: number, request: CompartirProcesoRequest): Observable<Proceso> {
    return this.http.put<Proceso>(`${this.apiUrl}/${id}/comparticion`, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obtenerDiagrama(procesoId: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/${procesoId}/diagrama`, {
      responseType: 'text',
    });
  }

  guardarDiagrama(procesoId: number, xml: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${procesoId}/diagrama`, xml, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
