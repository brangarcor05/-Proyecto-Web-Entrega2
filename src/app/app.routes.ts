import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/components/login-form.component')
      .then(m => m.LoginFormComponent)
  },
  {
    path: 'empresas/nueva',
    loadComponent: () => import('./features/empresas/components/empresa-form.component')
      .then(m => m.EmpresaFormComponent)
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./features/usuarios/components/usuario-list/usuario-list.component')
      .then(m => m.UsuarioListComponent)
  },
  {
    path: 'usuarios/nuevo',
    loadComponent: () => import('./features/usuarios/components/usuario-form/usuario-form.component')
      .then(m => m.UsuarioFormComponent)
  }
];