import { Routes } from '@angular/router';

import { SaleFormComponent } from './components/sale-form/sale-form.component';
import { SaleListComponent } from './components/sale-list/sale-list.component';

export const SALE_ROUTES: Routes = [
  { path: '', component: SaleFormComponent },
  { path: 'historial', component: SaleListComponent },
];
