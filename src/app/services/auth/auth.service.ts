import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  RefreshTokenRequest,
  SesionResponse,
  UsuarioSesion,
} from '../../models/auth/auth.model';

export const CLAVE_SESION = 'sesion';

/**
 * Sesión del usuario (HU-03) con dos tokens:
 *
 * - Access token (corta duración): se adjunta a cada petición (ver auth.interceptor).
 * - Refresh token (larga duración): cuando el backend responde 401 porque el access
 *   token venció, el interceptor llama a renovar() y repite la petición con el token
 *   nuevo. El usuario no se entera y no tiene que volver a iniciar sesión.
 *
 * La sesión se guarda en localStorage para que sobreviva a cerrar el navegador (para eso
 * existe el refresh token). Si otra pestaña renueva o cierra la sesión, el evento
 * "storage" mantiene esta pestaña sincronizada.
 */
@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly datos = signal<SesionResponse | null>(this.cargar());
  private renovacionEnCurso: Observable<SesionResponse> | null = null;

  /** Datos del usuario autenticado (sin tokens), o null si no hay sesión. */
  readonly sesion: Signal<UsuarioSesion | null> = computed(() => this.datos());

  // Valores derivados: se recalculan solos cuando cambia la sesión
  readonly accessToken = computed(() => this.datos()?.accessToken ?? null);
  readonly refreshToken = computed(() => this.datos()?.refreshToken ?? null);
  readonly esAdmin = computed(() => this.datos()?.rolUsuario === 'ADMIN');
  readonly puedeEditar = computed(() => ['ADMIN', 'EDITOR'].includes(this.datos()?.rolUsuario ?? ''));

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (evento) => {
        if (evento.key === CLAVE_SESION) {
          this.datos.set(this.cargar());
        }
      });
    }
  }

  login(request: LoginRequest): Observable<SesionResponse> {
    return this.http.post<SesionResponse>(`${this.url}/login`, request).pipe(
      tap((sesion) => this.guardar(sesion)),
    );
  }

  /**
   * Cambia el refresh token por un par nuevo. Si varias peticiones reciben 401 al mismo
   * tiempo, todas esperan la misma renovación en vez de lanzar una cada una (el backend
   * rota el refresh token, así que una segunda renovación con el mismo token fallaría).
   */
  renovar(): Observable<SesionResponse> {
    if (this.renovacionEnCurso) {
      return this.renovacionEnCurso;
    }
    // Se lee del almacenamiento por si otra pestaña ya lo rotó
    const refreshToken = this.cargar()?.refreshToken ?? this.refreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No hay refresh token'));
    }

    const cuerpo: RefreshTokenRequest = { refreshToken };
    this.renovacionEnCurso = this.http.post<SesionResponse>(`${this.url}/refresh`, cuerpo).pipe(
      tap((sesion) => this.guardar(sesion)),
      finalize(() => (this.renovacionEnCurso = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.renovacionEnCurso;
  }

  /** Cierra la sesión: revoca el refresh token en el backend y borra los datos locales. */
  logout(): void {
    const refreshToken = this.refreshToken();
    this.cerrarSesionLocal();
    if (refreshToken) {
      const cuerpo: RefreshTokenRequest = { refreshToken };
      // Si falla (sin red, ya revocado) no importa: localmente la sesión ya se cerró
      this.http.post<void>(`${this.url}/logout`, cuerpo).subscribe({ error: () => undefined });
    }
  }

  /** Borra la sesión sin llamar al backend (por ejemplo, cuando el refresh token ya no sirve). */
  cerrarSesionLocal(): void {
    this.quitarDelAlmacenamiento();
    this.datos.set(null);
  }

  private guardar(sesion: SesionResponse): void {
    try {
      localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    } catch {
      // Navegación privada o almacenamiento lleno: la sesión dura lo que dure la pestaña
    }
    this.datos.set(sesion);
  }

  private quitarDelAlmacenamiento(): void {
    try {
      localStorage.removeItem(CLAVE_SESION);
    } catch {
      // Sin almacenamiento disponible: no hay nada que borrar
    }
  }

  private cargar(): SesionResponse | null {
    try {
      const raw = localStorage.getItem(CLAVE_SESION);
      if (!raw) {
        return null;
      }
      const sesion = JSON.parse(raw) as Partial<SesionResponse>;
      // Sesiones guardadas por la versión anterior (un solo "token") no sirven
      return sesion.accessToken && sesion.refreshToken ? (sesion as SesionResponse) : null;
    } catch {
      return null;
    }
  }
}
