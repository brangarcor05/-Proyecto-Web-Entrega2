export interface MensajeEnvio {
    id: number;
    procesoId: number;
    poolId?: number;
    laneId?: number;
    nombreMensaje: string;
    claveCorrelacion?: string;
    poolDestinoId: number;
    nombrePoolDestino?: string;
    posicionX?: number;
    posicionY?: number;
    activo: boolean;
}

export type NewMensajeEnvio = Omit<MensajeEnvio, 'id' | 'activo' | 'nombrePoolDestino'>;