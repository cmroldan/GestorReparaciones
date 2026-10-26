import { Item } from '../models/item.model';
import { Sale } from '../models/sale.model';
import { ServiceOrder } from '../models/service-order.model';
import { todayInArgentina } from './dates';

export interface DailySalesPoint {
  date: string;
  totalCents: number;
}

export interface TrendPoint {
  x: number;
  y: number;
}

/** Órdenes que todavía no fueron entregadas. */
export function activeOrders(orders: readonly ServiceOrder[]): ServiceOrder[] {
  return orders.filter((order) => order.status !== 'entregado');
}

/** Órdenes activas listas para entregar. */
export function readyOrders(orders: readonly ServiceOrder[]): ServiceOrder[] {
  return orders.filter((order) => order.status === 'listo');
}

/** Las órdenes más recientes por fecha de ingreso, con desempate por id. */
export function recentOrders(
  orders: readonly ServiceOrder[],
  limit = 5,
): ServiceOrder[] {
  return [...orders]
    .sort((a, b) => {
      const byDate =
        new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime();
      return byDate !== 0 ? byDate : b.id - a.id;
    })
    .slice(0, limit);
}

/** Ítems activos cuyo stock actual alcanzó o bajó del mínimo. */
export function lowStockItems(items: readonly Item[]): Item[] {
  return items
    .filter((item) => item.active && item.stock <= item.min_stock)
    .sort((a, b) => a.stock - b.stock || a.id - b.id);
}

/** Agrupa los totales enteros de venta por día en Argentina. */
export function dailySales(sales: readonly Sale[]): DailySalesPoint[] {
  const totals = new Map<string, number>();

  for (const sale of sales) {
    const date = todayInArgentina(new Date(sale.created_at));
    totals.set(date, (totals.get(date) ?? 0) + sale.total_cents);
  }

  return [...totals.entries()]
    .map(([date, totalCents]) => ({ date, totalCents }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Coordenadas para dibujar la tendencia diaria en un SVG. */
export function trendPoints(
  points: readonly DailySalesPoint[],
  width: number,
  height: number,
  padding = 8,
): TrendPoint[] {
  if (points.length === 0) {
    return [];
  }

  const baseline = height - padding;
  const top = padding;
  const innerWidth = Math.max(0, width - padding * 2);
  const max = Math.max(...points.map((point) => point.totalCents), 0);

  return points.map((point, index) => {
    const x =
      points.length === 1
        ? width / 2
        : padding + (innerWidth * index) / (points.length - 1);

    if (points.length === 1) {
      return { x, y: max > 0 ? (top + baseline) / 2 : baseline };
    }

    const y =
      max > 0
        ? baseline - (point.totalCents / max) * (baseline - top)
        : baseline;

    return { x, y };
  });
}
