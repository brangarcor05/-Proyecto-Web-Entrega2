export interface CrearArcoRequest {
  procesoId: number;
  origenId: number;
  destinoId: number;
  etiqueta?: string | null;
  condicion?: string | null;
}
