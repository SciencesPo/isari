import { Routes, RouterModule }   from '@angular/router';

import { IsariLayoutComponent } from './isari-layout/isari-layout.component';
import { IsariListComponent } from './isari-list/isari-list.component';
import { IsariEditorComponent } from './isari-editor/isari-editor.component';

const isariRoutes: Routes = [
  {
    path: '',
    redirectTo: '/people',
    pathMatch: 'full'
  },
  {
    path: ':feature',
    component: IsariLayoutComponent,
    children: [
      { path: '', component: IsariListComponent },
      { path: ':id', component: IsariEditorComponent, outlet: 'editor' },
      { path: ':id', component: IsariEditorComponent }
    ]
  }
];

const appRoutes: Routes = [
  ...isariRoutes
];

export const appRoutingProviders: any[] = [];

export const routing = RouterModule.forRoot(appRoutes);
