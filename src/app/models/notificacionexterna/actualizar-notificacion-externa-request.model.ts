import { CampoDato } from '../common/campo-dato.model';
import { AccionFalloNotificacion, TipoDestinoExterno } from './opciones-notificacion.model';

export interface ActualizarNotificacionExternaRequest {
  nombre: string;
  poolDestinoId: number;
  tipoDestino: TipoDestinoExterno;
  momentoProceso?: string | null;
  accionSiFalla: AccionFalloNotificacion;
  actividadManejoErrorId?: number | null;
  campos?: CampoDato[] | null;
  posicionX?: number | null;
  posicionY?: number | null;
  canvasId?: string | null;
}
