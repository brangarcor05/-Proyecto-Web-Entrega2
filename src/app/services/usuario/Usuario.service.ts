import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CambiarRolRequest, CrearUsuarioRequest, Usuario } from '../../models/usuario/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/usuarios`;

  
  list(empresaId: number): Observable<Usuario[]> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.get<Usuario[]>(this.url, { params });
  }

  
  invitar(empresaId: number, request: CrearUsuarioRequest): Observable<Usuario> {
    const params = new HttpParams().set('empresaId', empresaId);
    return this.http.post<Usuario>(this.url, request, { params });
  }

  
  cambiarRol(id: number, request: CambiarRolRequest): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/rol`, request);
  }

  
  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}