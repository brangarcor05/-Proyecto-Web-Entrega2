/**
 * Filtros de búsqueda para GET /api/roles-proceso (HU-20).
 * empresaId es obligatorio; el resto son opcionales, igual que en Proceso.
 */
export interface ConsultarRolesProcesoParams {
  empresaId: number;
  nombre?: string;
  page?: number;
  size?: number;
  sort?: string;
}
