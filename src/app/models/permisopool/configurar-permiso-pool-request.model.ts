import { RolUsuario } from '../usuario/usuario.model';

export interface ConfigurarPermisoPoolRequest {
  rolUsuario: RolUsuario;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
}
