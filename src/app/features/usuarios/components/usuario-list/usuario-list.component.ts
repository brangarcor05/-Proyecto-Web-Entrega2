import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../../../services/usuario/Usuario.service';
import { Usuario } from '../../../../models/usuario/usuario.model';
import { mensajeDeError } from '../../../../shared/components/error-message/mensaje.error';
import { AutenticacionService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-usuario-list',
  imports: [RouterLink],
  templateUrl: '../../pages/usuario-list/usuario-list.component.html'
})
export class UsuarioListComponent implements OnInit {
  private service = inject(UsuarioService);
  private auth = inject(AutenticacionService);
  private router = inject(Router);

  sesion = this.auth.sesion;
  usuarios = signal<Usuario[]>([]);
  status = signal<'loading' | 'success' | 'error'>('loading');
  message = signal('');

  ngOnInit(): void {
    // Sin sesión no hay empresa: se vuelve al login
    if (!this.sesion()) {
      this.router.navigate(['/login']);
      return;
    }
    this.load();
  }

  load(): void {
    this.status.set('loading');
    this.service.list(this.sesion()!.empresaId).subscribe({
      next: data => {
        this.usuarios.set(data);
        this.status.set('success');
      },
      error: err => {
        this.message.set(mensajeDeError(err));
        this.status.set('error');
      }
    });
  }

  // El hijo avisa; el padre confirma y llama al servicio
  desactivar(usuario: Usuario): void {
    if (!confirm(`¿Desactivar a ${usuario.nombre}? Sus procesos se conservan.`)) return;
    this.service.desactivar(usuario.id).subscribe({
      next: () => this.load(),
      error: err => this.message.set(mensajeDeError(err))
    });
  }

  cerrarSesion(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}