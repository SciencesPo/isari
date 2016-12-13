import { Routes, RouterModule }   from '@angular/router';

import { IsariLayoutComponent } from './isari-layout/isari-layout.component';
import { IsariListComponent } from './isari-list/isari-list.component';
import { IsariEditorComponent } from './isari-editor/isari-editor.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { CVComponent } from './cv/cv.component';

import { LoggedInGuard } from './logged-in.guard';
import { OrganizationResolver } from './organization.resolver';

const isariRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent,
    canActivate: [ LoggedInGuard ]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'cv',
    component: CVComponent,
    canActivate: [ LoggedInGuard ]
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
    canActivate: [ LoggedInGuard ],
    resolve: {
      organization: OrganizationResolver
    }
  }
];

const appRoutes: Routes = [
  ...isariRoutes
];

export const appRoutingProviders: any[] = [];

export const routing = RouterModule.forRoot(appRoutes);
