import { TipoEvento } from './tipo-evento.model';

export interface ActualizarEventoRequest {
  nombre: string;
  tipo: TipoEvento;
  posicionX?: number | null;
  posicionY?: number | null;
  canvasId?: string | null;
}
