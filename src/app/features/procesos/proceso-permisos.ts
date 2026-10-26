import { RolUsuario } from '../../models/usuario/usuario.model';

export function puedeCrearOEditarProceso(rol: RolUsuario): boolean {
  return rol === 'ADMIN' || rol === 'EDITOR';
}

export function puedeAdministrarProceso(rol: RolUsuario): boolean {
  return rol === 'ADMIN';
}
