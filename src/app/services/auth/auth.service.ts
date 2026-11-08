import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, SesionResponse } from '../../models/auth/auth.model';

const CLAVE_SESION = 'sesion';

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/auth`;

  // Se inicializa desde sessionStorage: así la sesión sobrevive a recargar la página
  sesion = signal<SesionResponse | null>(this.cargar());

  // Valores derivados: se recalculan solos cuando cambia la sesión
  token = computed(() => this.sesion()?.token ?? null);
  esAdmin = computed(() => this.sesion()?.rolUsuario === 'ADMIN');
  puedeEditar = computed(() => ['ADMIN', 'EDITOR'].includes(this.sesion()?.rolUsuario ?? ''));

  login(request: LoginRequest): Observable<SesionResponse> {
    return this.http.post<SesionResponse>(`${this.url}/login`, request).pipe(
      tap(sesion => {
        sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
        this.sesion.set(sesion);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(CLAVE_SESION);
    this.sesion.set(null);
  }

  private cargar(): SesionResponse | null {
    try {
      const raw = sessionStorage.getItem(CLAVE_SESION);
      return raw ? (JSON.parse(raw) as SesionResponse) : null;
    } catch {
      return null;
    }
  }
}
