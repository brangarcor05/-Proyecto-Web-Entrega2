export interface Actividad {
    id: number;
    procesoId: number;
    laneId: number;
    nombre: string;
    tipo: string;
    posicionX?: number;
    posicionY?: number;
    activo: boolean;
    canvasId?: string | null;
}

export type NewActividad = Omit<Actividad, 'id' | 'activo'>;