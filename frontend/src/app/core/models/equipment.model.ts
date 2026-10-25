import { ServiceOrderSummary } from './service-order.model';

export type EquipmentType = 'notebook' | 'desktop' | 'printer';

export interface Equipment {
  id: number;
  client_id: number;
  type: EquipmentType;
  brand: string;
  model: string | null;
  serial_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface EquipmentWithOrderCount extends Equipment {
  order_count: number;
}

export interface EquipmentDetail extends Equipment {
  service_orders: ServiceOrderSummary[];
}

export interface EquipmentCreate {
  client_id: number;
  type: EquipmentType;
  brand: string;
  model?: string | null;
  serial_number?: string | null;
  notes?: string | null;
}

export interface EquipmentUpdate {
  type?: EquipmentType | null;
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  notes?: string | null;
}
