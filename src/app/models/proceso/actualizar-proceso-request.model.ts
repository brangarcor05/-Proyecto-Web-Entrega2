import { EstadoProceso } from './estado-proceso.model';

export interface ActualizarProcesoRequest {
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: EstadoProceso;
}
