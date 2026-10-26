export interface Actividad {
    id: number;
    procesoId: number;
    laneId: number;
    nombre: string;
    tipo: string;
    posicionX?: number;
    posicionY?: number;
    activo: boolean;
}

export type NewActividad = Omit<Actividad, 'id' | 'activo'>;