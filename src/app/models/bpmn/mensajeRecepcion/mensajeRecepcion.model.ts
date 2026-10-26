export type VarianteMensajeCatch = 'INICIO' | 'INTERMEDIO';

export interface MensajeRecepcion {
    id: number;
    procesoId: number;
    poolId?: number;
    laneId: number;
    nombreMensaje: string;
    variante: VarianteMensajeCatch;
    datosEsperados?: string;
    origenExterno: boolean;
    claveCorrelacion?: string;
    posicionX?: number;
    posicionY?: number;
    activo: boolean;
}

export type NewMensajeRecepcion = Omit<MensajeRecepcion, 'id' | 'activo' | 'poolId'>;