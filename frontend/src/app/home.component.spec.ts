import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Client } from './core/models/client.model';
import { Equipment } from './core/models/equipment.model';
import { Item } from './core/models/item.model';
import { Sale, SaleListResponse } from './core/models/sale.model';
import { ServiceOrder } from './core/models/service-order.model';
import {
  DashboardSection,
  DashboardService,
} from './core/services/dashboard.service';
import { EquipmentService } from './core/services/equipment.service';
import { HomeComponent } from './home.component';

@Component({ template: '' })
class BlankComponent {}

function section<T>(
  data: T | null = null,
  loading = false,
  error: string | null = null,
): DashboardSection<T> {
  return { data, loading, error };
}

function order(
  partial: Partial<ServiceOrder> & Pick<ServiceOrder, 'id' | 'entry_date'>,
): ServiceOrder {
  return {
    number: `OS-${partial.id}`,
    client_id: 1,
    equipment_id: 1,
    reported_failure: 'No enciende',
    notes: null,
    diagnosis: null,
    budget_amount_cents: null,
    budget_detail: null,
    status: 'ingresado',
    created_at: partial.entry_date,
    updated_at: partial.entry_date,
    ...partial,
  };
}

function item(
  partial: Partial<Item> & Pick<Item, 'id' | 'stock' | 'min_stock'>,
): Item {
  return {
    code: `I-${partial.id}`,
    name: `Item ${partial.id}`,
    type: 'part',
    price_cents: 1000,
    cost_cents: 500,
    active: true,
    is_sellable: true,
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    ...partial,
  };
}

function sale(id: number, createdAt: string, totalCents: number): Sale {
  return { id, total_cents: totalCents, created_at: createdAt, items: [] };
}

function equipment(id: number): Equipment {
  return {
    id,
    client_id: 1,
    type: 'notebook',
    brand: 'Lenovo',
    model: 'ThinkPad',
    serial_number: null,
    notes: null,
    created_at: '2026-10-01T12:00:00Z',
  };
}

describe('HomeComponent', () => {
  let dashboard: {
    orders: ReturnType<typeof signal<DashboardSection<ServiceOrder[]>>>;
    sales: ReturnType<typeof signal<DashboardSection<SaleListResponse>>>;
    stock: ReturnType<typeof signal<DashboardSection<Item[]>>>;
    clients: ReturnType<typeof signal<DashboardSection<Client[]>>>;
    loadAll: ReturnType<typeof vi.fn>;
    reloadSection: ReturnType<typeof vi.fn>;
  };
  let equipmentService: { get: ReturnType<typeof vi.fn> };

  function create() {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    dashboard = {
      orders: signal(section<ServiceOrder[]>([])),
      sales: signal(section({ sales: [], total_cents: 0 })),
      stock: signal(section<Item[]>([])),
      clients: signal(section<Client[]>([])),
      loadAll: vi.fn(),
      reloadSection: vi.fn(),
    };
    equipmentService = {
      get: vi.fn((id: number) => of(equipment(id))),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([
          { path: '', component: BlankComponent },
          { path: 'ordenes', component: BlankComponent },
          { path: 'ordenes/:id', component: BlankComponent },
          { path: 'ventas', component: BlankComponent },
          { path: 'clientes', component: BlankComponent },
          { path: 'inventario', component: BlankComponent },
        ]),
        { provide: DashboardService, useValue: dashboard },
        { provide: EquipmentService, useValue: equipmentService },
      ],
    }).compileComponents();
  });

  it('loads the dashboard and offers the four quick links', () => {
    const fixture = create();
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('.quick-actions a'),
    ) as HTMLAnchorElement[];

    expect(dashboard.loadAll).toHaveBeenCalledTimes(1);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/ordenes',
      '/ventas',
      '/clientes',
      '/inventario',
    ]);
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Órdenes',
      'Ventas',
      'Clientes',
      'Inventario',
    ]);
  });

  it('summarizes active orders, month revenue and low stock', () => {
    dashboard.orders.set(
      section([
        order({ id: 1, entry_date: '2026-10-01T12:00:00Z', status: 'ingresado' }),
        order({ id: 2, entry_date: '2026-10-02T12:00:00Z', status: 'listo' }),
        order({ id: 3, entry_date: '2026-10-03T12:00:00Z', status: 'entregado' }),
      ]),
    );
    dashboard.sales.set(
      section({ sales: [sale(1, '2026-10-02T12:00:00Z', 123456)], total_cents: 123456 }),
    );
    dashboard.stock.set(
      section([
        item({ id: 1, stock: 1, min_stock: 2 }),
        item({ id: 2, stock: 2, min_stock: 2, active: false }),
        item({ id: 3, stock: 9, min_stock: 2 }),
      ]),
    );

    const fixture = create();
    const metricValue = (key: string) =>
      (
        fixture.nativeElement.querySelector(
          `.metric-card[data-section="${key}"] .metric-value`,
        ) as HTMLElement
      ).textContent?.trim();

    expect(metricValue('orders')).toBe('2');
    expect(
      fixture.nativeElement
        .querySelector('.metric-card[data-section="orders"] .metric-hint')
        .textContent,
    ).toContain('1 lista');
    expect(metricValue('sales')).toBe('$ 1.234,56');
    expect(metricValue('stock')).toBe('1');
  });

  it('shows zero revenue when the month has no sales', () => {
    const fixture = create();
    const salesMetric = fixture.nativeElement.querySelector(
      '.metric-card[data-section="sales"] .metric-value',
    ) as HTMLElement;

    expect(salesMetric.textContent?.trim()).toBe('$ 0,00');
    expect(
      fixture.nativeElement.querySelector('.finance .empty-state'),
    ).toBeTruthy();
  });

  it('lists the five most recent orders with client and equipment labels', async () => {
    const clients: Client[] = [
      {
        id: 1,
        first_name: 'Ana',
        last_name: 'Pérez',
        document: null,
        phone: null,
        email: null,
        address: null,
        created_at: '2026-10-01T12:00:00Z',
        updated_at: '2026-10-01T12:00:00Z',
      },
    ];
    const orders = Array.from({ length: 6 }, (_, index) =>
      order({
        id: index + 1,
        number: index === 5 ? null : `OS-${index + 1}`,
        entry_date: `2026-10-0${index + 1}T12:00:00Z`,
      }),
    );
    dashboard.clients.set(section(clients));
    dashboard.orders.set(section(orders));

    const fixture = create();
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('.recent-orders tbody tr'),
    ) as HTMLElement[];

    expect(rows.length).toBe(5);
    expect(rows[0].textContent).toContain('Sin número');
    expect(rows[0].textContent).toContain('Ana Pérez');
    expect(rows[0].textContent).toContain('Lenovo ThinkPad');
    expect(rows[4].textContent).toContain('OS-2');
    expect(
      rows[0].querySelector('a')?.getAttribute('href'),
    ).toBe('/ordenes/6');
  });

  it('falls back to ids when client and equipment labels are unavailable', async () => {
    equipmentService.get.mockReturnValue(
      throwError(() => new Error('not found')),
    );
    dashboard.orders.set(
      section([
        order({
          id: 9,
          entry_date: '2026-10-09T12:00:00Z',
          client_id: 99,
          equipment_id: 98,
        }),
      ]),
    );

    const fixture = create();
    await fixture.whenStable();
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector(
      '.recent-orders tbody tr',
    ) as HTMLElement;

    expect(row.textContent).toContain('Cliente #99');
    expect(row.textContent).toContain('Equipo #98');
  });

  it('shows an empty state with a link to create the first order', () => {
    const fixture = create();
    const empty = fixture.nativeElement.querySelector(
      '.recent-orders .empty-state',
    ) as HTMLElement;

    expect(empty.textContent).toContain('No hay órdenes registradas');
    expect(
      empty.querySelector('a')?.getAttribute('href'),
    ).toBe('/ordenes');
  });

  it('lists active low stock items and links to the inventory', () => {
    dashboard.stock.set(
      section([
        item({ id: 1, code: 'R-1', name: 'Fuente', stock: 1, min_stock: 2 }),
        item({ id: 2, code: 'R-2', name: 'Inactivo', stock: 0, min_stock: 5, active: false }),
      ]),
    );

    const fixture = create();
    const rows = Array.from(
      fixture.nativeElement.querySelectorAll('.low-stock tbody tr'),
    ) as HTMLElement[];
    const action = fixture.nativeElement.querySelector(
      '.low-stock .panel-action',
    ) as HTMLAnchorElement;

    expect(rows.length).toBe(1);
    expect(rows[0].textContent).toContain('R-1');
    expect(rows[0].textContent).toContain('Fuente');
    expect(rows[0].textContent).not.toContain('Inactivo');
    expect(action.getAttribute('href')).toBe('/inventario');
  });

  it('keeps loaded sections visible and retries only the failed one', () => {
    dashboard.orders.set(section<ServiceOrder[]>(null, false, 'No se pudieron cargar las órdenes.'));
    dashboard.sales.set(
      section({ sales: [sale(1, '2026-10-02T12:00:00Z', 5000)], total_cents: 5000 }),
    );
    dashboard.stock.set(section([item({ id: 1, stock: 1, min_stock: 2 })]));

    const fixture = create();
    const retry = fixture.nativeElement.querySelector(
      '.recent-orders .section-error button',
    ) as HTMLButtonElement;

    expect(
      fixture.nativeElement.querySelector('.recent-orders .section-error')
        .textContent,
    ).toContain('No se pudieron cargar las órdenes.');
    expect(
      fixture.nativeElement.querySelector(
        '.metric-card[data-section="sales"] .metric-value',
      ).textContent,
    ).toContain('$ 50,00');
    expect(
      fixture.nativeElement.querySelectorAll('.low-stock tbody tr').length,
    ).toBe(1);

    retry.click();

    expect(dashboard.reloadSection).toHaveBeenCalledWith('orders');
    expect(dashboard.reloadSection).toHaveBeenCalledTimes(1);
  });

  it('shows loading placeholders without provisional figures', () => {
    dashboard.orders.set(section<ServiceOrder[]>(null, true));

    const fixture = create();

    expect(
      fixture.nativeElement.querySelector(
        '.metric-card[data-section="orders"] .section-loading',
      ),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector(
        '.metric-card[data-section="orders"] .metric-value',
      ),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.recent-orders .section-loading'),
    ).toBeTruthy();
  });

  it('draws the daily trend from backend sales and labels the tables', () => {
    dashboard.sales.set(
      section({
        sales: [
          sale(1, '2026-10-01T12:00:00Z', 1000),
          sale(2, '2026-10-02T12:00:00Z', 2000),
        ],
        total_cents: 3000,
      }),
    );
    dashboard.stock.set(section([item({ id: 1, stock: 1, min_stock: 2 })]));
    dashboard.orders.set(
      section([order({ id: 1, entry_date: '2026-10-01T12:00:00Z' })]),
    );

    const fixture = create();

    const polyline = fixture.nativeElement.querySelector(
      '.finance svg polyline',
    ) as SVGElement;
    const dots = fixture.nativeElement.querySelectorAll('.finance svg circle');

    expect(polyline.getAttribute('points')?.split(' ').length).toBe(2);
    expect(dots.length).toBe(2);
    expect(
      fixture.nativeElement.querySelector('.recent-orders table')?.getAttribute('aria-label'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.low-stock table')?.getAttribute('aria-label'),
    ).toBeTruthy();
  });
});
