import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Gateway, NewGateway } from '../../models/bpmn/gateway/gateway.model';

@Injectable({
    providedIn: 'root'
})
export class GatewayService {
    private http = inject(HttpClient);
    private apiUrl = '/api/gateways';

    listarPorProceso(procesoId: number): Observable<Gateway[]> {
        return this.http.get<Gateway[]>(`${this.apiUrl}/proceso/${procesoId}`);
    }

    obtenerPorId(id: number): Observable<Gateway> {
        return this.http.get<Gateway>(`${this.apiUrl}/${id}`);
    }

    crear(gateway: NewGateway): Observable<Gateway> {
        return this.http.post<Gateway>(this.apiUrl, gateway);
    }

    actualizar(id: number, gateway: NewGateway): Observable<Gateway> {
        return this.http.put<Gateway>(`${this.apiUrl}/${id}`, gateway);
    }

    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}