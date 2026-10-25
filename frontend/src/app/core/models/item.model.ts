export type ItemType = 'part' | 'supply' | 'accessory';

export interface Item {
  id: number;
  code: string;
  name: string;
  type: ItemType;
  price_cents: number;
  cost_cents: number;
  stock: number;
  min_stock: number;
  active: boolean;
  is_sellable: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemCreate {
  code: string;
  name: string;
  type: ItemType;
  price_cents: number;
  cost_cents: number;
  stock: number;
  min_stock: number;
}

export interface ItemUpdate {
  name?: string | null;
  type?: ItemType | null;
  price_cents?: number | null;
  cost_cents?: number | null;
  min_stock?: number | null;
}
