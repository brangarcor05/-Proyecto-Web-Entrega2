export type TipoGateway = 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO';

export interface Gateway {
    id: number;
    procesoId: number;
    poolId?: number;
    laneId?: number;
    nombre: string;
    tipo: TipoGateway;
    posicionX?: number;
    posicionY?: number;
    activo: boolean;
}

export type NewGateway = Omit<Gateway, 'id' | 'activo'>;