import { AccionHistorial } from './accion-historial.model';

export interface Historial {
  id: number;
  entidadTipo: string;
  entidadId: number;
  accion: AccionHistorial;
  detalle: string;
  fecha: string;
  usuarioId: number;
  usuarioNombre: string;
}
