import { Routes } from '@angular/router';

import { NotFoundComponent } from './features/not-found/not-found.component';
import { ProcesoDetailComponent } from './features/procesos/pages/proceso-detail/proceso-detail.component';
import { ProcesoFormComponent } from './features/procesos/pages/proceso-form/proceso-form.component';
import { ProcesoHistoryComponent } from './features/procesos/pages/proceso-history/proceso-history.component';
import { ProcesoListComponent } from './features/procesos/pages/proceso-list/proceso-list.component';
import { ProcesoShareComponent } from './features/procesos/pages/proceso-share/proceso-share.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/components/login-form.component').then((m) => m.LoginFormComponent),
  },
  {
    path: 'empresas/nueva',
    loadComponent: () =>
      import('./features/empresas/components/empresa-form.component').then(
        (m) => m.EmpresaFormComponent,
      ),
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./features/usuarios/components/usuario-list/usuario-list.component').then(
        (m) => m.UsuarioListComponent,
      ),
  },
  {
    path: 'usuarios/nuevo',
    loadComponent: () =>
      import('./features/usuarios/components/usuario-form/usuario-form.component').then(
        (m) => m.UsuarioFormComponent,
      ),
  },
  { path: 'procesos', component: ProcesoListComponent },
  { path: 'procesos/nuevo', component: ProcesoFormComponent },
  {
    path: 'procesos/:procesoId/eventos/nuevo',
    loadComponent: () =>
      import('./features/eventos/components/evento-form/evento-form.component').then(
        (m) => m.EventoFormComponent,
      ),
  },
  {
    path: 'procesos/:procesoId/eventos/:id/editar',
    loadComponent: () =>
      import('./features/eventos/components/evento-form/evento-form.component').then(
        (m) => m.EventoFormComponent,
      ),
  },
  {
    path: 'procesos/:procesoId/eventos/:id',
    loadComponent: () =>
      import('./features/eventos/pages/evento-detail/evento-detail.component').then(
        (m) => m.EventoDetailComponent,
      ),
  },
  {
    path: 'procesos/:procesoId/eventos',
    loadComponent: () =>
      import('./features/eventos/pages/evento-list/evento-list.component').then(
        (m) => m.EventoListComponent,
      ),
  },
  {
    path: 'procesos/:procesoId/notificaciones/nuevo',
    loadComponent: () =>
      import('./features/notificaciones-externas/components/notificacion-form/notificacion-form.component').then(
        (m) => m.NotificacionExternaFormComponent,
      ),
  },
  {
    path: 'procesos/:procesoId/notificaciones/:id/editar',
    loadComponent: () =>
      import('./features/notificaciones-externas/components/notificacion-form/notificacion-form.component').then(
        (m) => m.NotificacionExternaFormComponent,
      ),
  },
  {
    path: 'procesos/:procesoId/notificaciones/:id',
    loadComponent: () =>
      import('./features/notificaciones-externas/pages/notificacion-detail/notificacion-detail.component').then(
        (m) => m.NotificacionExternaDetailComponent,
      ),
  },
  {
    path: 'procesos/:procesoId/notificaciones',
    loadComponent: () =>
      import('./features/notificaciones-externas/pages/notificacion-list/notificacion-list.component').then(
        (m) => m.NotificacionExternaListComponent,
      ),
  },
  { path: 'procesos/:id/editar', component: ProcesoFormComponent },
  { path: 'procesos/:id/historial', component: ProcesoHistoryComponent },
  { path: 'procesos/:id/compartir', component: ProcesoShareComponent },
  { path: 'procesos/:id', component: ProcesoDetailComponent },
  { path: '**', component: NotFoundComponent },
];
