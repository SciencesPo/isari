import { Routes, RouterModule }   from '@angular/router';

import { ListPageComponent } from './list-page/list-page.component';
import { DetailPageComponent } from './detail-page/detail-page.component';

const isariRoutes: Routes = [
  {
    path: '',
    redirectTo: '/people/1',
    pathMatch: 'full'
  },
  {
    path: ':feature',
    children: [
      {
        path: '',
        component: ListPageComponent
      },
      {
        path: ':id',
        component: DetailPageComponent
      }
    ]
  }
];

const appRoutes: Routes = [
  ...isariRoutes
];

export const appRoutingProviders: any[] = [];

export const routing = RouterModule.forRoot(appRoutes);
