import { CampoDato } from '../common/campo-dato.model';

export interface CrearNotificacionExternaRequest {
  procesoId: number;
  poolId: number;
  poolDestinoId: number;
  nombre: string;
  tipoDestino: string;
  momentoProceso?: string | null;
  accionSiFalla: string;
  actividadManejoErrorId?: number | null;
  campos?: CampoDato[] | null;
  posicionX?: number | null;
  posicionY?: number | null;
}
