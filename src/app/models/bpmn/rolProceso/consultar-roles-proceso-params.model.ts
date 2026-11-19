/**
 * Filtros de búsqueda para GET /api/roles-proceso (HU-20). Todos son opcionales:
 * la empresa la decide el backend a partir del access token.
 */
export interface ConsultarRolesProcesoParams {
  nombre?: string;
  page?: number;
  size?: number;
  sort?: string;
}
