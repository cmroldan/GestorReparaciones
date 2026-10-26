import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import { Client } from '../models/client.model';
import { Item } from '../models/item.model';
import { SaleListResponse } from '../models/sale.model';
import { ServiceOrder } from '../models/service-order.model';
import { monthRangeInArgentina } from '../utils/dates';
import { ClientService } from './client.service';
import { ItemService } from './item.service';
import { SaleService } from './sale.service';
import { ServiceOrderService } from './service-order.service';

export type DashboardSectionKey = 'orders' | 'sales' | 'stock' | 'clients';

export interface DashboardSection<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function initialSection<T>(): DashboardSection<T> {
  return { data: null, loading: false, error: null };
}

/**
 * Orquesta las consultas del panel principal. Cada sección mantiene su propio
 * estado para que una falla no oculte los datos que sí respondieron.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly ordersService = inject(ServiceOrderService);
  private readonly salesService = inject(SaleService);
  private readonly itemsService = inject(ItemService);
  private readonly clientsService = inject(ClientService);

  readonly orders = signal<DashboardSection<ServiceOrder[]>>(
    initialSection<ServiceOrder[]>(),
  );
  readonly sales = signal<DashboardSection<SaleListResponse>>(
    initialSection<SaleListResponse>(),
  );
  readonly stock = signal<DashboardSection<Item[]>>(initialSection<Item[]>());
  readonly clients = signal<DashboardSection<Client[]>>(
    initialSection<Client[]>(),
  );

  loadAll(now: Date = new Date()): void {
    this.loadOrders();
    this.loadSales(now);
    this.loadStock();
    this.loadClients();
  }

  reloadSection(section: DashboardSectionKey, now: Date = new Date()): void {
    switch (section) {
      case 'orders':
        this.loadOrders();
        break;
      case 'sales':
        this.loadSales(now);
        break;
      case 'stock':
        this.loadStock();
        break;
      case 'clients':
        this.loadClients();
        break;
    }
  }

  private loadOrders(): void {
    this.orders.update((state) => ({ ...state, loading: true, error: null }));
    this.resolve(
      this.ordersService.list(),
      this.orders,
      'No se pudieron cargar las órdenes.',
    );
  }

  private loadSales(now: Date): void {
    const { from, to } = monthRangeInArgentina(now);
    this.sales.update((state) => ({ ...state, loading: true, error: null }));
    this.resolve(
      this.salesService.list(from, to),
      this.sales,
      'No se pudieron cargar las ventas del mes.',
    );
  }

  private loadStock(): void {
    this.stock.update((state) => ({ ...state, loading: true, error: null }));
    this.resolve(
      this.itemsService.list({ lowStock: true }),
      this.stock,
      'No se pudo cargar el stock bajo.',
    );
  }

  private loadClients(): void {
    this.clients.update((state) => ({ ...state, loading: true, error: null }));
    this.resolve(
      this.clientsService.list(),
      this.clients,
      'No se pudieron cargar los clientes.',
    );
  }

  private resolve<T>(
    request: Observable<T>,
    target: {
      update: (
        updater: (state: DashboardSection<T>) => DashboardSection<T>,
      ) => void;
    },
    errorMessage: string,
  ): void {
    request
      .pipe(catchError(() => of(null)))
      .subscribe((data) => {
        target.update((state) => ({
          data,
          loading: false,
          error: data === null ? errorMessage : null,
        }));
      });
  }
}
