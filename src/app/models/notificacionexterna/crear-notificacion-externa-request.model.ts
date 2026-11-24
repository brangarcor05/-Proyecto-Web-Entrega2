import { CampoDato } from '../common/campo-dato.model';
import { AccionFalloNotificacion, TipoDestinoExterno } from './opciones-notificacion.model';

export interface CrearNotificacionExternaRequest {
  procesoId: number;
  poolId: number;
  poolDestinoId: number;
  nombre: string;
  tipoDestino: TipoDestinoExterno;
  momentoProceso?: string | null;
  accionSiFalla: AccionFalloNotificacion;
  actividadManejoErrorId?: number | null;
  campos?: CampoDato[] | null;
  posicionX?: number | null;
  posicionY?: number | null;
  canvasId?: string | null;
}
