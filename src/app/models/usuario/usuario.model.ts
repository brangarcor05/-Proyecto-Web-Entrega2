export type RolUsuario = 'ADMIN' | 'EDITOR' | 'LECTURA';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rolUsuario: RolUsuario;
  activo: boolean;
  empresaId: number;
  empresaNombre: string;
}

export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  rolUsuario: RolUsuario;
  password: string
}

export interface CambiarRolRequest {
  rolUsuario: RolUsuario;
}