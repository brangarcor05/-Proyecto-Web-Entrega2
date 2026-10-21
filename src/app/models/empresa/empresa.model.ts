export interface Empresa {
  id: number;
  nombre: string;
  rut: string;
  razonSocial: string;
  email: string;
  telefono?: string;
  direccion?: string;
  sector?: string;
  estado: string;
  fechaRegistro: string;
  adminUsuarioId: number;
}

export interface CrearEmpresaRequest {
  nombre: string;
  rut: string;
  razonSocial: string;
  email: string;
  telefono?: string;
  direccion?: string;
  sector?: string;
  adminNombre: string;
  adminPassword: string;
}