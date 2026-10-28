export interface Arco {
  id: number;
  procesoId: number;
  origenId: number;
  origenNombre: string;
  destinoId: number;
  destinoNombre: string;
  etiqueta: string | null;
  condicion: string | null;
  activo: boolean;
}
