import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PoolDiagrama {
  id: number;
  procesoId: number;
  nombre: string;
  cajaNegra: boolean;
  esPropietario: boolean;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class DiagramaCatalogoService {
  private readonly http = inject(HttpClient);

  listarPools(procesoId: number) {
    const params = new HttpParams().set('procesoId', procesoId);
    return this.http.get<PoolDiagrama[]>(`${environment.apiUrl}/pools`, { params });
  }
}
