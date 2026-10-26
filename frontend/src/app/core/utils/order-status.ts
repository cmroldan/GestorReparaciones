import { OrderStatus } from '../models/service-order.model';

export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  ingresado: ['en_diagnostico'],
  en_diagnostico: ['presupuestado'],
  presupuestado: ['en_reparacion'],
  en_reparacion: ['listo'],
  listo: ['entregado'],
  entregado: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  ingresado: 'Ingresado',
  en_diagnostico: 'En Diagnóstico',
  presupuestado: 'Presupuestado',
  en_reparacion: 'En Reparación',
  listo: 'Listo',
  entregado: 'Entregado',
};

export function nextStatuses(status: OrderStatus): OrderStatus[] {
  return NEXT_STATUS[status] ?? [];
}

