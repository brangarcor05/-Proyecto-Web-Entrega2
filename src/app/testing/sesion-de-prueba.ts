import { SesionResponse } from '../models/auth/auth.model';

/** Sesión completa (usuario + tokens) para usar en las pruebas. */
export function sesionDePrueba(cambios: Partial<SesionResponse> = {}): SesionResponse {
  return {
    usuarioId: 3,
    nombre: 'Ana',
    email: 'ana@acme.com',
    rolUsuario: 'ADMIN',
    empresaId: 1,
    empresaNombre: 'Acme',
    tokenType: 'Bearer',
    accessToken: 'access-1',
    expiresIn: 900,
    refreshToken: 'refresh-1',
    refreshExpiresIn: 604800,
    ...cambios,
  };
}
