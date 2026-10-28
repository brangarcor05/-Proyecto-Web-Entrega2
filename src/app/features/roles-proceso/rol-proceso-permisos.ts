import { RolUsuario } from '../../models/usuario/usuario.model';

/**
 * HU-17/18/19: "Solo el administrador de la empresa puede crear/editar/eliminar
 * roles de proceso" (ver RolProcesoService#crear/actualizar/eliminar en el backend,
 * que siempre llama a PermisoService#validarEsAdministrador). A diferencia de
 * Proceso y Lane, aquí EDITOR no tiene permiso.
 */
export function puedeAdministrarRolesProceso(rol: RolUsuario): boolean {
  return rol === 'ADMIN';
}
