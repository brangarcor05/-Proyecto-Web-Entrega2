/**
 * Rol de proceso (HU-17 a HU-20): catálogo de funciones de la empresa
 * (Analista, Supervisor, Auditor...) que se usa para nombrar lanes.
 */
export interface RolProceso {
  id: number;
  empresaId: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  //ndica si el rol está siendo usado en alguna lane (HU-20).
  enUso: boolean;
  // Nombres de los procesos donde se usa el rol (HU-20).
  procesosDondeSeUsa: string[];
}

/**
 * Request para crear un rol de proceso (HU-17).
 * Mientras no exista HU-03 (inicio de sesión), la empresa llega en la petición.
 */
export interface CrearRolProcesoRequest {
  empresaId: number;
  nombre: string;
  descripcion?: string;
}

/**
 * Request para actualizar un rol de proceso (HU-18).
 * Solo nombre y descripción son editables.
 */
export interface ActualizarRolProcesoRequest {
  nombre: string;
  descripcion?: string;
}