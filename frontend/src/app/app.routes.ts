import { Routes } from '@angular/router';

import { HomeComponent } from './home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'clientes',
    loadChildren: () =>
      import('./features/clients/clients.routes').then((m) => m.CLIENT_ROUTES),
  },
  {
    path: 'inventario',
    loadChildren: () =>
      import('./features/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
  },
  {
    path: 'ordenes',
    loadChildren: () =>
      import('./features/orders/orders.routes').then((m) => m.ORDER_ROUTES),
  },
  {
    path: 'ventas',
    loadChildren: () =>
      import('./features/sales/sales.routes').then((m) => m.SALE_ROUTES),
  },
];
