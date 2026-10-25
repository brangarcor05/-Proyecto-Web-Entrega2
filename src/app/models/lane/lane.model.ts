
/**
 * Representa una lane del diagrama (banda horizontal/vertical).
 * La lane no tiene nombre propio: su etiqueta es el nombre del rol de proceso.
 */
export interface Lane {
  id: number;
  poolId: number;
  rolProcesoId: number;
  rolProcesoNombre: string;
  orden: number;
  activo: boolean;
}

/**
 * Request para crear una lane dentro de un pool (HU-22).
 * El orden lo calcula el backend (se agrega al final).
 */
export interface CrearLaneRequest {
  poolId: number;
  rolProcesoId: number;
}

/**
 * Request para "renombrar" una lane (HU-22): en realidad es reasignarle
 * otro rol de proceso, ya que la lane no tiene nombre propio.
 */
export interface ActualizarLaneRequest {
  rolProcesoId: number;
}

/**
 * Request para reordenar las lanes de un pool (HU-22).
 * Debe incluir exactamente las lanes activas del pool, ni más ni menos.
 */
export interface ReordenarLanesRequest {
  laneIdsEnOrden: number[];
}