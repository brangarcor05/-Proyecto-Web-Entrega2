import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, SesionResponse } from '../../models/auth/auth.model';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/auth`;
  
  sesion = signal<SesionResponse | null>(null);

  login(request: LoginRequest): Observable<SesionResponse> {
    return this.http.post<SesionResponse>(`${this.url}/login`, request)
      .pipe(tap(sesion => this.sesion.set(sesion)));
  }

  logout(): void {
    this.sesion.set(null);
  }
}