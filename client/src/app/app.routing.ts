import { Routes, RouterModule }   from '@angular/router';

import { ListPageComponent } from './list-page/list-page.component';
import { DetailPageComponent } from './detail-page/detail-page.component';

import { IsariLayoutComponent } from './isari-layout/isari-layout.component';
import { ListComponent } from './list/list.component';
import { EditorComponent } from './editor/editor.component';

// http://localhost:4200/people
// http://localhost:4200/people/(editor:581069e37865963dde42cad6)
// http://localhost:4200/people/581069e37865963dde42cad6

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
      { path: '', component: ListPageComponent },
      { path: ':id', component: DetailPageComponent, outlet: 'editor' },
      { path: ':id', component: DetailPageComponent }
    ]
  }
];

const appRoutes: Routes = [
  ...isariRoutes
];

export const appRoutingProviders: any[] = [];

export const routing = RouterModule.forRoot(appRoutes);
