import { WorkLog } from './work-log.model';

export type OrderStatus =
  'ingresado' | 'en_diagnostico' | 'presupuestado' | 'en_reparacion' | 'listo' | 'entregado';

export interface ServiceOrder {
  id: number;
  number: string | null;
  client_id: number;
  equipment_id: number;
  reported_failure: string;
  notes: string | null;
  entry_date: string;
  diagnosis: string | null;
  budget_amount_cents: number | null;
  budget_detail: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderSummary {
  id: number;
  number: string | null;
  client_id: number;
  equipment_id: number;
  entry_date: string;
  status: OrderStatus;
  diagnosis: string | null;
}

export interface OrderStatusHistory {
  id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_at: string;
}

export interface Consumption {
  item_id: number;
  item_code: string;
  item_name: string;
  quantity: number;
  created_at: string;
}

export interface ServiceOrderDetail extends ServiceOrder {
  status_history: OrderStatusHistory[];
  work_logs: WorkLog[];
  consumptions: Consumption[];
}

export interface ServiceOrderCreate {
  client_id: number;
  equipment_id: number;
  reported_failure: string;
  notes?: string | null;
}

export interface ServiceOrderUpdate {
  diagnosis?: string | null;
  budget_amount_cents?: number | null;
  budget_detail?: string | null;
  notes?: string | null;
}

export interface StatusChange {
  to_status: OrderStatus;
}
