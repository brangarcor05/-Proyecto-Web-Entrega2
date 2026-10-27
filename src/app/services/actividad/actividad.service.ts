import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Actividad, NewActividad } from '../../models/bpmn/actividad/actividad.model';

@Injectable({
    providedIn: 'root'
})
export class ActividadService {
    private http = inject(HttpClient);
    private apiUrl = '/api/actividades';

    listarPorProceso(procesoId: number): Observable<Actividad[]> {
        return this.http.get<Actividad[]>(`${this.apiUrl}/proceso/${procesoId}`);
    }

    obtenerPorId(id: number): Observable<Actividad> {
        return this.http.get<Actividad>(`${this.apiUrl}/${id}`);
    }

    crear(actividad: NewActividad): Observable<Actividad> {
        return this.http.post<Actividad>(this.apiUrl, actividad);
    }

    actualizar(id: number, actividad: NewActividad): Observable<Actividad> {
        return this.http.put<Actividad>(`${this.apiUrl}/${id}`, actividad);
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}