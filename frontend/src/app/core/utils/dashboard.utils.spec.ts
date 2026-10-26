import { Item } from '../models/item.model';
import { Sale } from '../models/sale.model';
import { ServiceOrder } from '../models/service-order.model';
import {
  activeOrders,
  dailySales,
  lowStockItems,
  readyOrders,
  recentOrders,
  trendPoints,
} from './dashboard.utils';

function order(partial: Partial<ServiceOrder> & Pick<ServiceOrder, 'id'>): ServiceOrder {
  return {
    number: null,
    client_id: 1,
    equipment_id: 1,
    reported_failure: 'Falla',
    notes: null,
    entry_date: '2026-10-01T12:00:00Z',
    diagnosis: null,
    budget_amount_cents: null,
    budget_detail: null,
    status: 'ingresado',
    created_at: '2026-10-01T12:00:00Z',
    updated_at: '2026-10-01T12:00:00Z',
    ...partial,
  };
}

function item(partial: Partial<Item> & Pick<Item, 'id'>): Item {
  return {
    code: `I-${partial.id}`,
    name: `Item ${partial.id}`,
    type: 'part',
    price_cents: 1000,
    cost_cents: 500,
    stock: 2,
    min_stock: 2,
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

describe('dashboard utils', () => {
  it('keeps only orders that are not delivered', () => {
    const orders = [
      order({ id: 1, status: 'ingresado' }),
      order({ id: 2, status: 'entregado' }),
      order({ id: 3, status: 'listo' }),
    ];

    expect(activeOrders(orders).map((o) => o.id)).toEqual([1, 3]);
    expect(readyOrders(orders).map((o) => o.id)).toEqual([3]);
  });

  it('selects the five most recent orders by entry date', () => {
    const orders = Array.from({ length: 7 }, (_, index) =>
      order({
        id: index + 1,
        entry_date: `2026-10-${String(index + 1).padStart(2, '0')}T12:00:00Z`,
      }),
    );

    expect(recentOrders(orders).map((o) => o.id)).toEqual([7, 6, 5, 4, 3]);
  });

  it('breaks entry date ties by descending id', () => {
    const orders = [
      order({ id: 1, entry_date: '2026-10-10T12:00:00Z' }),
      order({ id: 3, entry_date: '2026-10-10T12:00:00Z' }),
      order({ id: 2, entry_date: '2026-10-10T12:00:00Z' }),
    ];

    expect(recentOrders(orders).map((o) => o.id)).toEqual([3, 2, 1]);
  });

  it('does not mutate the original order list', () => {
    const orders = [
      order({ id: 1, entry_date: '2026-10-01T12:00:00Z' }),
      order({ id: 2, entry_date: '2026-10-05T12:00:00Z' }),
    ];

    recentOrders(orders);

    expect(orders.map((o) => o.id)).toEqual([1, 2]);
  });

  it('returns an empty list when there are no orders', () => {
    expect(recentOrders([])).toEqual([]);
    expect(activeOrders([])).toEqual([]);
  });

  it('filters active items at or below their minimum stock', () => {
    const items = [
      item({ id: 1, stock: 2, min_stock: 2, active: true }),
      item({ id: 2, stock: 5, min_stock: 1, active: true }),
      item({ id: 3, stock: 0, min_stock: 3, active: false }),
      item({ id: 4, stock: 1, min_stock: 3, active: true }),
    ];

    expect(lowStockItems(items).map((i) => i.id)).toEqual([4, 1]);
  });

  it('groups sales by Argentine day and sums integer cents', () => {
    const sales = [
      sale(1, '2026-10-02T15:00:00Z', 1500),
      sale(2, '2026-10-02T16:00:00Z', 2500),
      sale(3, '2026-10-01T18:00:00Z', 1000),
    ];

    expect(dailySales(sales)).toEqual([
      { date: '2026-10-01', totalCents: 1000 },
      { date: '2026-10-02', totalCents: 4000 },
    ]);
  });

  it('returns no daily series when there are no sales', () => {
    expect(dailySales([])).toEqual([]);
  });

  it('builds evenly spaced trend points', () => {
    const points = trendPoints(
      [
        { date: '2026-10-01', totalCents: 1000 },
        { date: '2026-10-02', totalCents: 2000 },
      ],
      100,
      50,
      5,
    );

    expect(points).toEqual([
      { x: 5, y: 25 },
      { x: 95, y: 5 },
    ]);
  });

  it('centers a single trend point and returns none without data', () => {
    expect(
      trendPoints([{ date: '2026-10-01', totalCents: 1000 }], 100, 50, 5),
    ).toEqual([{ x: 50, y: 25 }]);
    expect(trendPoints([], 100, 50, 5)).toEqual([]);
  });
});
