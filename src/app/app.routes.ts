import { Routes } from '@angular/router';

import { NotFoundComponent } from './features/not-found/not-found.component';
import { ProcesoDetailComponent } from './features/procesos/pages/proceso-detail/proceso-detail.component';
import { ProcesoFormComponent } from './features/procesos/pages/proceso-form/proceso-form.component';
import { ProcesoHistoryComponent } from './features/procesos/pages/proceso-history/proceso-history.component';
import { ProcesoListComponent } from './features/procesos/pages/proceso-list/proceso-list.component';
import { ProcesoShareComponent } from './features/procesos/pages/proceso-share/proceso-share.component';
import { PoolFormComponent } from './features/editor-bpmn/components/pool/pool-form/pool-form.component';
import { PoolListComponent } from './features/editor-bpmn/components/pool/pool-list/pool-list.component';
import { PermisoPoolComponent } from './features/configuracion/permisos-pool/permiso-pool.component';

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
  { path: 'configuracion/permisos-pool', component: PermisoPoolComponent },
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
    path: 'procesos/:procesoId/editor',
    loadComponent: () =>
      import('./features/editor-bpmn/pages/editor/bpmn-editor.component').then(
        (m) => m.BpmnEditorComponent,
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
  loadComponent: () => import('./features/eventos/pages/evento-list/evento-list.component').then(m => m.EventoListComponent),
},
{
  path: 'procesos/:procesoId/eventos/nuevo',
  loadComponent: () => import('./features/eventos/components/evento-form/evento-form.component').then(m => m.EventoFormComponent),
},
{
  path: 'procesos/:procesoId/eventos/:id/editar',
  loadComponent: () => import('./features/eventos/components/evento-form/evento-form.component').then(m => m.EventoFormComponent),
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
  { path: 'procesos/:procesoId/pools/nuevo', component: PoolFormComponent },
  { path: 'procesos/:procesoId/pools/:poolId/editar', component: PoolFormComponent },
  { path: 'procesos/:procesoId/pools', component: PoolListComponent },
  { path: 'procesos/:id', component: ProcesoDetailComponent },
  {
    path: 'roles-proceso',
    loadComponent: () => import('./features/roles-proceso/pages/rol-proceso-list/rol-proceso-list.component')
      .then(m => m.RolProcesoListComponent)
  },
  {
    path: 'roles-proceso/nuevo',
    loadComponent: () => import('./features/roles-proceso/pages/rol-proceso-form/rol-proceso-form.component')
      .then(m => m.RolProcesoFormComponent)
  },
  {
    path: 'roles-proceso/:id/editar',
    loadComponent: () => import('./features/roles-proceso/pages/rol-proceso-form/rol-proceso-form.component')
      .then(m => m.RolProcesoFormComponent)
  },
  {
    path: 'procesos/:procesoId/gateways/nuevo',
    loadComponent: () => import('./features/editor-bpmn/components/gateway/gatewayForm.component').then(m => m.GatewayFormComponent)
  },
  {
    path: 'procesos/:procesoId/gateways/:id/editar',
    loadComponent: () => import('./features/editor-bpmn/components/gateway/gatewayForm.component').then(m => m.GatewayFormComponent)
  },
  {
    path: 'procesos/:procesoId/gateways',
    loadComponent: () => import('./features/editor-bpmn/components/gateway/gatewayList.component').then(m => m.GatewayListComponent)
  },
  {
    path: 'procesos/:procesoId/actividades',
    loadComponent: () => import('./features/editor-bpmn/components/actividad/actividadList.component').then(m => m.ActividadListComponent)
  },
  {
    path: 'procesos/:procesoId/actividades/nuevo',
    loadComponent: () => import('./features/editor-bpmn/components/actividad/actividadForm.component').then(m => m.ActividadFormComponent)
  },
  {
    path: 'procesos/:procesoId/actividades/:id/editar',
    loadComponent: () => import('./features/editor-bpmn/components/actividad/actividadForm.component').then(m => m.ActividadFormComponent)
  },
  {
    path: 'procesos/:procesoId/mensajes-envio/nuevo',
    loadComponent: () => import('./features/editor-bpmn/components/mensajeEnvio/mensajeEnvioForm.component').then(m => m.MensajeEnvioFormComponent)
  },
  {
    path: 'procesos/:procesoId/mensajes-envio/:id/editar',
    loadComponent: () => import('./features/editor-bpmn/components/mensajeEnvio/mensajeEnvioForm.component').then(m => m.MensajeEnvioFormComponent)
  },
  {
    path: 'procesos/:procesoId/mensajes-envio',
    loadComponent: () => import('./features/editor-bpmn/components/mensajeEnvio/mensajeEnvioList.component').then(m => m.MensajeEnvioListComponent)
  },
  {
    path: 'procesos/:procesoId/mensajes-recepcion/nuevo',
    loadComponent: () => import('./features/editor-bpmn/components/mensajeRecepcion/mensajeRecepcionForm.component').then(m => m.MensajeRecepcionFormComponent)
  },
  {
    path: 'procesos/:procesoId/mensajes-recepcion/:id/editar',
    loadComponent: () => import('./features/editor-bpmn/components/mensajeRecepcion/mensajeRecepcionForm.component').then(m => m.MensajeRecepcionFormComponent)
  },
  {
    path: 'procesos/:procesoId/mensajes-recepcion',
    loadComponent: () => import('./features/editor-bpmn/components/mensajeRecepcion/mensajeRecepcionList.component').then(m => m.MensajeRecepcionListComponent)
  },
  { path: '**', component: NotFoundComponent }
];
