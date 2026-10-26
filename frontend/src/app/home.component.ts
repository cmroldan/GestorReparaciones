import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';

import { Client } from './core/models/client.model';
import { ServiceOrder } from './core/models/service-order.model';
import {
  DashboardSectionKey,
  DashboardService,
} from './core/services/dashboard.service';
import { EquipmentService } from './core/services/equipment.service';
import { formatDateInArgentina } from './core/utils/dates';
import {
  activeOrders,
  dailySales,
  lowStockItems,
  readyOrders,
  recentOrders,
  trendPoints,
} from './core/utils/dashboard.utils';
import { formatCents } from './core/utils/money';
import { ORDER_STATUS_LABELS } from './core/utils/order-status';
import { IconComponent } from './shared/components/icon/icon.component';

interface RecentOrderRow {
  order: ServiceOrder;
  clientLabel: string;
  equipmentLabel: string;
  dateLabel: string;
}

const TREND_WIDTH = 320;
const TREND_HEIGHT = 120;
const TREND_PADDING = 14;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterModule, IconComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private readonly dashboard = inject(DashboardService);
  private readonly equipmentService = inject(EquipmentService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly equipmentLabels = signal<Record<number, string>>({});
  private readonly loadedEquipments = new Set<number>();

  readonly formatCents = formatCents;

  readonly ordersSection = this.dashboard.orders;
  readonly salesSection = this.dashboard.sales;
  readonly stockSection = this.dashboard.stock;

  readonly activeCount = computed(
    () => activeOrders(this.dashboard.orders().data ?? []).length,
  );
  readonly readyCount = computed(
    () => readyOrders(this.dashboard.orders().data ?? []).length,
  );
  readonly readyLabel = computed(() => {
    const count = this.readyCount();
    return count === 1
      ? '1 lista para entregar'
      : `${count} listas para entregar`;
  });

  readonly monthTotalCents = computed(
    () => this.dashboard.sales().data?.total_cents ?? 0,
  );
  readonly monthTotalLabel = computed(() =>
    formatCents(this.monthTotalCents()),
  );

  readonly lowStock = computed(() =>
    lowStockItems(this.dashboard.stock().data ?? []),
  );

  readonly recentRows = computed<RecentOrderRow[]>(() => {
    const clients = new Map<number, Client>(
      (this.dashboard.clients().data ?? []).map((client) => [client.id, client]),
    );
    const equipmentLabels = this.equipmentLabels();

    return recentOrders(this.dashboard.orders().data ?? []).map((order) => {
      const client = clients.get(order.client_id);
      const clientLabel = client
        ? `${client.first_name} ${client.last_name}`.trim()
        : `Cliente #${order.client_id}`;

      return {
        order,
        clientLabel,
        equipmentLabel:
          equipmentLabels[order.equipment_id] ?? `Equipo #${order.equipment_id}`,
        dateLabel: formatDateInArgentina(order.entry_date),
      };
    });
  });

  readonly dailySeries = computed(() =>
    dailySales(this.dashboard.sales().data?.sales ?? []),
  );
  readonly trendPoints = computed(() =>
    trendPoints(this.dailySeries(), TREND_WIDTH, TREND_HEIGHT, TREND_PADDING),
  );
  readonly trendPolyline = computed(() =>
    this.trendPoints()
      .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
      .join(' '),
  );

  constructor() {
    effect(() => {
      const orders = this.dashboard.orders().data;

      if (!orders?.length) {
        return;
      }

      for (const order of recentOrders(orders)) {
        const equipmentId = order.equipment_id;

        if (this.loadedEquipments.has(equipmentId)) {
          continue;
        }

        this.loadedEquipments.add(equipmentId);
        this.equipmentService
          .get(equipmentId)
          .pipe(
            catchError(() => of(null)),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe((equipment) => {
            if (!equipment) {
              return;
            }

            const label =
              [equipment.brand, equipment.model].filter(Boolean).join(' ') ||
              `Equipo #${equipmentId}`;

            this.equipmentLabels.update((labels) => ({
              ...labels,
              [equipmentId]: label,
            }));
          });
      }
    });
  }

  ngOnInit(): void {
    this.dashboard.loadAll();
  }

  statusLabel(order: ServiceOrder): string {
    return ORDER_STATUS_LABELS[order.status];
  }

  stockState(stock: number): 'out' | 'low' {
    return stock === 0 ? 'out' : 'low';
  }

  stockStateLabel(stock: number): string {
    return stock === 0 ? 'Sin stock' : 'Stock bajo';
  }

  retry(section: DashboardSectionKey): void {
    this.dashboard.reloadSection(section);
  }
}
