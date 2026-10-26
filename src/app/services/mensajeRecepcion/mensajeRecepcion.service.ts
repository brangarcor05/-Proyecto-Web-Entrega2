import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MensajeRecepcion, NewMensajeRecepcion } from '../../models/bpmn/mensajeRecepcion/mensajeRecepcion.model';

@Injectable({
    providedIn: 'root'
})
export class MensajeRecepcionService {
    private http = inject(HttpClient);
    private apiUrl = '/api/eventos-mensaje-recepcion';

    listarPorProceso(procesoId: number): Observable<MensajeRecepcion[]> {
        return this.http.get<MensajeRecepcion[]>(`${this.apiUrl}/proceso/${procesoId}`);
    }

    obtenerPorId(id: number): Observable<MensajeRecepcion> {
        return this.http.get<MensajeRecepcion>(`${this.apiUrl}/${id}`);
    }

    crear(mensajeRecepcion: NewMensajeRecepcion): Observable<MensajeRecepcion> {
        return this.http.post<MensajeRecepcion>(this.apiUrl, mensajeRecepcion);
    }

    actualizar(id: number, mensajeRecepcion: NewMensajeRecepcion): Observable<MensajeRecepcion> {
        return this.http.put<MensajeRecepcion>(`${this.apiUrl}/${id}`, mensajeRecepcion);
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}