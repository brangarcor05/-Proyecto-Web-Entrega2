import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionService } from '../../../services/auth/auth.service';
import { mensajeDeError } from '../../../shared/components/error-message/mensaje.error';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: '../pages/login-form/login-form.component.html',
  styleUrls: ['../pages/login-form/login-form.css']
})
export class LoginFormComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AutenticacionService);
  private router = inject(Router);

  mensaje = signal('');
  cargando = signal(false);

  // Pasos 1 y 2: controles + validadores (mismos que @NotBlank/@Email de LoginRequest)
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ingresar(): void {
    // Paso 5: si es inválido, marcar y detener
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.mensaje.set('');
    this.cargando.set(true);

    // Paso 6: getRawValue() ya es un LoginRequest tipado
    this.auth.login(this.form.getRawValue()).subscribe({
      next: sesion => {
        this.cargando.set(false);
        const destino = sesion.rolUsuario === 'ADMIN' ? '/usuarios' : '/procesos';
        void this.router.navigate([destino]);
      },
      error: err => {
        this.cargando.set(false);
        this.mensaje.set(mensajeDeError(err));
      }
    });
  }
}
