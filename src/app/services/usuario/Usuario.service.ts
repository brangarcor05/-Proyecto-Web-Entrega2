import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CambiarRolRequest, CrearUsuarioRequest, Usuario } from '../../models/usuario/usuario.model';

// Ya no se envía empresaId: el backend lo toma del token.
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/usuarios`;

  list(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.url);
  }

  invitar(request: CrearUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.url, request);
  }

  cambiarRol(id: number, request: CambiarRolRequest): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.url}/${id}/rol`, request);
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
