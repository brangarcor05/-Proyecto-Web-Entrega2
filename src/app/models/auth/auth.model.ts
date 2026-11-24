import { RolUsuario } from "../usuario/usuario.model";

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Datos del usuario que inició sesión. Es lo que usan los componentes
 * (AutenticacionService.sesion()): no incluye los tokens.
 */
export interface UsuarioSesion {
  usuarioId: number;
  nombre: string;
  email: string;
  rolUsuario: RolUsuario;
  empresaId: number;
  empresaNombre: string;
}

/**
 * Respuesta de POST /api/auth/login y POST /api/auth/refresh (HU-03).
 *
 * - accessToken: token de corta duración (JWT, ~15 min). Viaja en la cabecera
 *   Authorization de cada petición a la API.
 * - refreshToken: token de larga duración (~7 días). Solo se envía a /auth/refresh
 *   para obtener un par nuevo, y a /auth/logout para revocarlo. Cada renovación
 *   entrega un refresh token nuevo y el anterior deja de servir.
 */
export interface SesionResponse extends UsuarioSesion {
  tokenType: 'Bearer';
  accessToken: string;
  /** Segundos de vida del access token. */
  expiresIn: number;
  refreshToken: string;
  /** Segundos de vida del refresh token. */
  refreshExpiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
