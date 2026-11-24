import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MensajeEnvio, NewMensajeEnvio } from '../../models/bpmn/mensajeEnvio/mensajeEnvio.model';

@Injectable({
    providedIn: 'root'
})
export class MensajeEnvioService {
    private http = inject(HttpClient);
    private apiUrl = '/api/eventos-mensaje-envio';

    listarPorProceso(procesoId: number): Observable<MensajeEnvio[]> {
        return this.http.get<MensajeEnvio[]>(`${this.apiUrl}/proceso/${procesoId}`);
    }

    obtenerPorId(id: number): Observable<MensajeEnvio> {
        return this.http.get<MensajeEnvio>(`${this.apiUrl}/${id}`);
    }

    crear(mensajeEnvio: NewMensajeEnvio): Observable<MensajeEnvio> {
        return this.http.post<MensajeEnvio>(this.apiUrl, mensajeEnvio);
    }

    actualizar(id: number, mensajeEnvio: NewMensajeEnvio): Observable<MensajeEnvio> {
        return this.http.put<MensajeEnvio>(`${this.apiUrl}/${id}`, mensajeEnvio);
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}