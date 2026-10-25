import { Routes } from '@angular/router';

import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'clientes',
    loadChildren: () =>
      import('./features/clients/clients.routes').then((m) => m.CLIENT_ROUTES),
  },
];
