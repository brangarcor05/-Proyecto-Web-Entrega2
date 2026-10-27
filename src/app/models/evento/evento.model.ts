import { TipoEvento } from './tipo-evento.model';

export interface Evento {
  id: number;
  procesoId: number;
  poolId: number;
  nombre: string;
  tipo: TipoEvento;
  posicionX: number | null;
  posicionY: number | null;
  activo: boolean;
}
