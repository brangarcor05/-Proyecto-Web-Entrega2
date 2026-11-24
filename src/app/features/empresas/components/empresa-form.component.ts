import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EmpresaService } from '../../../services/empresa/Empresa.service';
import { mensajeDeError } from '../../../shared/components/error-message/mensaje.error';

@Component({
  selector: 'app-empresa-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: '../pages/empresa-form/empresa-form.component.html',
  styleUrls: ['../pages/empresa-form/empresa-form.css']
})
export class EmpresaFormComponent {
  private fb = inject(FormBuilder);
  private service = inject(EmpresaService);
  private router = inject(Router);

  mensaje = signal('');
  cargando = signal(false);

  // Mismas reglas que CrearEmpresaRequest.java (@NotBlank, @Size, @Email)
  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    rut: ['', [Validators.required, Validators.maxLength(20)]],
    razonSocial: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', [Validators.maxLength(20)]],
    direccion: ['', [Validators.maxLength(255)]],
    sector: ['', [Validators.maxLength(50)]],
    adminNombre: ['', [Validators.required, Validators.maxLength(100)]],
    adminPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.mensaje.set('');
    this.cargando.set(true);

    this.service.crear(this.form.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false);
        // El administrador ya existe: entra con el correo de contacto y su contraseña
        this.router.navigate(['/login']);
      },
      error: err => {
        this.cargando.set(false);
        // 409: RUC o correo ya registrados
        this.mensaje.set(mensajeDeError(err));
      }
    });
  }
}