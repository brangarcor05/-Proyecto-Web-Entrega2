export interface Actividad {
    id: number;
    procesoId: number;
    poolId?: number;
    laneId: number;
    nombre: string;
    tipo?: string;
    posicionX?: number;
    posicionY?: number;
    activo: boolean;
    canvasId?: string | null;
    descripcion?: string;


}

export type CreateActividadRequest = Omit<Actividad, 'id' | 'activo'>;
export type UpdateActividadRequest = Partial<CreateActividadRequest>;