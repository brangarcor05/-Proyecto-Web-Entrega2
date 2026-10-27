import { EstadoProceso } from './estado-proceso.model';

export interface Proceso {
  id: number;
  empresaId: number;
  empresaNombre: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: EstadoProceso;
  activo: boolean;
  compartido: boolean;
  soloLectura: boolean;
}
