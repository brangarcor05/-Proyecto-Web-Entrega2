import { Routes } from '@angular/router';

import { NotFoundComponent } from './features/not-found/not-found.component';
import { ProcesoDetailComponent } from './features/procesos/pages/proceso-detail/proceso-detail.component';
import { ProcesoFormComponent } from './features/procesos/pages/proceso-form/proceso-form.component';
import { ProcesoHistoryComponent } from './features/procesos/pages/proceso-history/proceso-history.component';
import { ProcesoListComponent } from './features/procesos/pages/proceso-list/proceso-list.component';
import { ProcesoShareComponent } from './features/procesos/pages/proceso-share/proceso-share.component';

export const routes: Routes = [
  { path: '', redirectTo: 'procesos', pathMatch: 'full' },
  { path: 'procesos', component: ProcesoListComponent },
  { path: 'procesos/nuevo', component: ProcesoFormComponent },
  { path: 'procesos/:id/editar', component: ProcesoFormComponent },
  { path: 'procesos/:id/historial', component: ProcesoHistoryComponent },
  { path: 'procesos/:id/compartir', component: ProcesoShareComponent },
  { path: 'procesos/:id', component: ProcesoDetailComponent },
  { path: '**', component: NotFoundComponent },
];
