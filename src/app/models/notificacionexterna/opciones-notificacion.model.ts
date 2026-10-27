export type TipoDestinoExterno = 'CORREO' | 'SERVICIO_WEB' | 'COLA';
export type AccionFalloNotificacion = 'CONTINUAR' | 'DERIVAR_ERROR' | 'FINALIZAR';
export const TIPOS_DESTINO: TipoDestinoExterno[] = ['CORREO', 'SERVICIO_WEB', 'COLA'];
export const ACCIONES_FALLO: AccionFalloNotificacion[] = [
  'CONTINUAR',
  'DERIVAR_ERROR',
  'FINALIZAR',
];
