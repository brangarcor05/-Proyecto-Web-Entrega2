import { TipoEvento } from './tipo-evento.model';

export interface CrearEventoRequest {
  procesoId: number;
  poolId: number;
  nombre: string;
  tipo: TipoEvento;
  posicionX?: number | null;
  posicionY?: number | null;
  canvasId?: string | null;
}
