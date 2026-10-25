import { Routes } from '@angular/router';

import { ClientDetailComponent } from './components/client-detail/client-detail.component';
import { ClientListComponent } from './components/client-list/client-list.component';

export const CLIENT_ROUTES: Routes = [
  { path: '', component: ClientListComponent },
  { path: ':id', component: ClientDetailComponent },
];
