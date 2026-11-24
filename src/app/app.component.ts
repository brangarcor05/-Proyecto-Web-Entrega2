import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AutenticacionService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {
  private readonly autenticacionService = inject(AutenticacionService);
  private readonly router = inject(Router);

  readonly sesion = this.autenticacionService.sesion;

  cerrarSesion(): void {
    this.autenticacionService.logout();
    void this.router.navigate(['/login']);
  }
}
