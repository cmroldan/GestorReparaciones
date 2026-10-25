import { Routes } from '@angular/router';

import { ItemListComponent } from './components/item-list/item-list.component';

export const INVENTORY_ROUTES: Routes = [
  { path: '', component: ItemListComponent },
];
