import { CampoDato } from '../common/campo-dato.model';
import { AccionFalloNotificacion, TipoDestinoExterno } from './opciones-notificacion.model';

export interface NotificacionExterna {
  id: number;
  procesoId: number;
  poolId: number;
  poolDestinoId: number;
  nombre: string;
  tipoDestino: TipoDestinoExterno;
  momentoProceso: string | null;
  accionSiFalla: AccionFalloNotificacion;
  actividadManejoErrorId: number | null;
  campos: CampoDato[];
  posicionX: number | null;
  posicionY: number | null;
  activo: boolean;
  canvasId?: string | null;
}
