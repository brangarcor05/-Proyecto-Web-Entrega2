export interface ApiError {
  estado: number;
  error: string;
  mensaje: string;
  camposInvalidos: Record<string, string> | null;
  momento: string;
}
