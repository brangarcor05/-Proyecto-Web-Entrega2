import { RolUsuario } from '../usuario/usuario.model';

export interface PermisoPool {
  id: number | null;
  empresaId: number;
  rolUsuario: RolUsuario;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  configurado: boolean;
}
