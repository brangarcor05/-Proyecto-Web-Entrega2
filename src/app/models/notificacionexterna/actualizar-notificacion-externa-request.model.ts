import { CampoDato } from '../common/campo-dato.model';

export interface ActualizarNotificacionExternaRequest {
  nombre: string;
  poolDestinoId: number;
  tipoDestino: string;
  momentoProceso?: string | null;
  accionSiFalla: string;
  actividadManejoErrorId?: number | null;
  campos?: CampoDato[] | null;
  posicionX?: number | null;
  posicionY?: number | null;
}
