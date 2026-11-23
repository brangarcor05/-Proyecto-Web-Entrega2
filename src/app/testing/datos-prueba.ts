import { SesionResponse } from '../models/auth/auth.model';
import { Usuario } from '../models/usuario/usuario.model';

// Datos de prueba compartidos (fixtures): evitan repetir los mismos objetos en cada spec.
export const sesionAdmin: SesionResponse = {
  usuarioId: 1,
  nombre: 'Juan Pérez',
  email: 'admin@acme.com',
  rolUsuario: 'ADMIN',
  empresaId: 1,
  empresaNombre: 'Acme S.A.S.',
  tokenType: 'Bearer',
  accessToken: 'access-token-de-prueba',
  expiresIn: 3600,
  refreshToken: 'refresh-token-de-prueba',
  refreshExpiresIn: 86400,
};

export const usuarioEditor: Usuario = {
  id: 2,
  nombre: 'Ana Ruiz',
  email: 'ana@acme.com',
  rolUsuario: 'EDITOR',
  activo: true,
  empresaId: 1,
  empresaNombre: 'Acme S.A.S.'
};
