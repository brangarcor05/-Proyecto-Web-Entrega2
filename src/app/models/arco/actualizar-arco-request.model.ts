export interface ActualizarArcoRequest {
  origenId: number;
  destinoId: number;
  etiqueta?: string | null;
  condicion?: string | null;
}
