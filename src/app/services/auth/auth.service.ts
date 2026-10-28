import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, SesionResponse } from '../../models/auth/auth.model';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/auth`;
  
  
  sesion = signal<SesionResponse | null>(this.obtenerSesionDeStorage());

  login(request: LoginRequest): Observable<SesionResponse> {
    return this.http.post<SesionResponse>(`${this.url}/login`, request)
      .pipe(
        tap(sesion => {
          this.sesion.set(sesion);
          
          localStorage.setItem('sesion', JSON.stringify(sesion));
        })
      );
  }

  logout(): void {
    this.sesion.set(null);
    
    localStorage.removeItem('sesion');
  }

  
  private obtenerSesionDeStorage(): SesionResponse | null {
    const sesionGuardada = localStorage.getItem('sesion');
    if (!sesionGuardada) return null;
    
    try {
      return JSON.parse(sesionGuardada) as SesionResponse;
    } catch (e) {
      
      localStorage.removeItem('sesion');
      return null; 
    }
  }
}