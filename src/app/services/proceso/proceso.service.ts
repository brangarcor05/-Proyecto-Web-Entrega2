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
    let params = new HttpParams().set('empresaId', filtros.empresaId);

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

  buscarPorId(id: number, empresaId: number): Observable<Proceso> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<Proceso>(`${this.apiUrl}/${id}`, { params });
  }

  consultarHistorial(id: number, empresaId: number): Observable<Historial[]> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<Historial[]>(`${this.apiUrl}/${id}/historial`, {
      params,
    });
  }

  crear(request: CrearProcesoRequest, usuarioId: number): Observable<Proceso> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.post<Proceso>(this.apiUrl, request, { params });
  }

  actualizar(
    id: number,
    request: ActualizarProcesoRequest,
    usuarioId: number,
  ): Observable<Proceso> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.put<Proceso>(`${this.apiUrl}/${id}`, request, { params });
  }

  compartir(id: number, request: CompartirProcesoRequest, usuarioId: number): Observable<Proceso> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.put<Proceso>(`${this.apiUrl}/${id}/comparticion`, request, {
      params,
    });
  }

  eliminar(id: number, usuarioId: number): Observable<void> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { params });
  }

  obtenerDiagrama(procesoId: number, empresaId: number): Observable<string> {
  const params = new HttpParams().set('empresaId', empresaId.toString());
  return this.http.get(`/api/procesos/${procesoId}/diagrama`, {
    params,
    responseType: 'text', // Importante porque el backend devuelve texto plano
  });
}

guardarDiagrama(procesoId: number, xml: string, usuarioId: number): Observable<void> {
  const params = new HttpParams().set('usuarioId', usuarioId.toString());
  return this.http.put<void>(`/api/procesos/${procesoId}/diagrama`, xml, {
    params,
    headers: { 'Content-Type': 'text/plain' } // Enviamos texto plano
  });
}
}
