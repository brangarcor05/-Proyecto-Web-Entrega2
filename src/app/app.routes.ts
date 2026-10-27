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
  },
  { path: 'procesos', component: ProcesoListComponent },
  { path: 'procesos/nuevo', component: ProcesoFormComponent },
  { path: 'procesos/:id/editar', component: ProcesoFormComponent },
  { path: 'procesos/:id/historial', component: ProcesoHistoryComponent },
  { path: 'procesos/:id/compartir', component: ProcesoShareComponent },
  { path: 'procesos/:id', component: ProcesoDetailComponent },
  { path: '**', component: NotFoundComponent },
  {
    path: 'procesos/:procesoId/gateways',
    loadComponent: () => import('./features/editor-bpmn/components/gateway/gatewayList.component').then(m => m.GatewayListComponent)
  },
  {
    path: 'procesos/:procesoId/actividades',
    loadComponent: () => import('./features/editor-bpmn/components/actividad/actividadList.component').then(m => m.ActividadListComponent)
  },
  {
    path: 'procesos/:procesoId/mensajes-envio',
    loadComponent: () => import('./features/editor-bpmn/components/mensajeEnvio/mensajeEnvioList.component').then(m => m.MensajeEnvioListComponent)
  },
  {
    path: 'procesos/:procesoId/mensajes-recepcion',
    loadComponent: () => import('./features/editor-bpmn/components/mensajeRecepcion/mensajeRecepcionList.component').then(m => m.MensajeRecepcionListComponent)
  }
];
