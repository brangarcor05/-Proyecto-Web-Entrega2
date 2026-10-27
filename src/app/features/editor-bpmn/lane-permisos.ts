import { RolUsuario } from '../../models/usuario/usuario.model';

/**
 * HU-22: crear/editar/reordenar lanes requiere ADMIN o EDITOR; eliminar requiere
 * ADMIN (ver PermisoService#validarPuedeCrearPoolsYLanes / ...EditarPoolsYLanes /
 * ...EliminarPoolsYLanes en el backend — misma regla que PoolService).
 */
export function puedeCrearOEditarLane(rol: RolUsuario): boolean {
  return rol === 'ADMIN' || rol === 'EDITOR';
}

export function puedeEliminarLane(rol: RolUsuario): boolean {
  return rol === 'ADMIN';
}
