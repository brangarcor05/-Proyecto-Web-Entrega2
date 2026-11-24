import { Component, input, output } from '@angular/core';
import { RolUsuario, Usuario } from '../../../models/usuario/usuario.model';

// Evento que sube al padre cuando se elige otro rol
export interface CambioRol {
  usuario: Usuario;
  rolUsuario: RolUsuario;
}

@Component({
  selector: 'app-tarjeta-usuario',
  standalone: true,
  templateUrl: './Tarjeta-Usuario.component.html'
})
export class TarjetaUsuarioComponent {
  // BAJA: el padre le pasa el dato
  usuario = input.required<Usuario>();

  // SUBEN: el hijo avisa, el padre decide qué hacer
  cambiarRol = output<CambioRol>();
  desactivar = output<Usuario>();

  roles: RolUsuario[] = ['ADMIN', 'EDITOR', 'LECTURA'];

  onRolChange(event: Event): void {
    const rol = (event.target as HTMLSelectElement).value as RolUsuario;
    this.cambiarRol.emit({ usuario: this.usuario(), rolUsuario: rol });
  }
}