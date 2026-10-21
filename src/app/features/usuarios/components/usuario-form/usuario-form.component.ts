import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../../../../services/usuario/Usuario.service';
import { RolUsuario } from '../../../../models/usuario/usuario.model';
import { mensajeDeError } from '../../../../shared/components/error-message/mensaje.error';
import { AutenticacionService } from '../../../../services/auth/auth.service';

@Component({
  selector: 'app-usuario-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: '../../pages/usuario-form/usuario-form.component.html'
})
export class UsuarioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(UsuarioService);
  private auth = inject(AutenticacionService);
  private router = inject(Router);

  mensaje = signal('');
  cargando = signal(false);
  roles: RolUsuario[] = ['ADMIN', 'EDITOR', 'LECTURA'];

  // Mismas reglas que CrearUsuarioRequest.java
  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]], 
    rolUsuario: ['EDITOR' as RolUsuario, [Validators.required]]
  });

  ngOnInit(): void {
    if (!this.auth.sesion()) this.router.navigate(['/login']);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.mensaje.set('');
    this.cargando.set(true);

    const empresaId = this.auth.sesion()!.empresaId;
    this.service.invitar(empresaId, this.form.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/usuarios']);
      },
      error: err => {
        this.cargando.set(false);
        // 409: el correo ya está registrado
        this.mensaje.set(mensajeDeError(err));
      }
    });
  }
}