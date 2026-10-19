import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empresa, CrearEmpresaRequest } from '../../models/empresa/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/empresas`;

  crear(request: CrearEmpresaRequest): Observable<Empresa> {
    return this.http.post<Empresa>(this.url, request);
  }

  obtener(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.url}/${id}`);
  }
}