import { RolUsuario } from "../usuario/usuario.model";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SesionResponse {
  usuarioId: number;
  nombre: string;
  email: string;
  rolUsuario: RolUsuario;
  empresaId: number;
  empresaNombre: string;
}