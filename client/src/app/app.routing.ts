import { Routes, RouterModule }   from '@angular/router';

import { IsariLayoutComponent } from './isari-layout/isari-layout.component';
import { IsariListComponent } from './isari-list/isari-list.component';
import { IsariEditorComponent } from './isari-editor/isari-editor.component';
import { LoginComponent } from './login/login.component';

import { LoggedInGuard } from './logged-in.guard';

const isariRoutes: Routes = [
  {
    path: '',
    redirectTo: '/people',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: ':feature',
    component: IsariLayoutComponent,
    children: [
      { path: '', component: IsariListComponent },
      { path: 'new', component: IsariEditorComponent },
      { path: ':id', component: IsariEditorComponent, outlet: 'editor' },
      { path: ':id', component: IsariEditorComponent }
    ],
    canActivate: [ LoggedInGuard ]
  }
];

const appRoutes: Routes = [
  ...isariRoutes
];

export const appRoutingProviders: any[] = [];

export const routing = RouterModule.forRoot(appRoutes);
