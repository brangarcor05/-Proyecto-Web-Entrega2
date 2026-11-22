import { EstadoProceso } from './estado-proceso.model';

export interface ConsultarProcesosParams {
  nombre?: string;
  estado?: EstadoProceso;
  categoria?: string;
  incluirInactivos?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
