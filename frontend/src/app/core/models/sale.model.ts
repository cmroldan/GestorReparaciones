export interface SaleItem {
  id: number;
  item_id: number;
  item_code: string;
  item_name: string;
  quantity: number;
  unit_price_cents: number;
  subtotal_cents: number;
}

export interface Sale {
  id: number;
  total_cents: number;
  created_at: string;
  items: SaleItem[];
}

export interface SaleListResponse {
  sales: Sale[];
  total_cents: number;
}

export interface SaleItemCreate {
  item_id: number;
  quantity: number;
}

export interface SaleCreate {
  items: SaleItemCreate[];
  /** El backend lo ignora y calcula el total real. */
  total_cents?: number | null;
}
