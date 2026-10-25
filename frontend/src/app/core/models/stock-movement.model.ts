export type MovementType = 'entry' | 'adjustment' | 'order_consumption' | 'sale';

export interface StockMovement {
  id: number;
  item_id: number;
  movement_type: MovementType;
  delta: number;
  resulting_stock: number;
  reference_type: string | null;
  reference_id: number | null;
  reason: string | null;
  created_at: string;
}

export interface StockMovementCreate {
  item_id: number;
  /** Solo se admiten movimientos manuales: entrada o ajuste. */
  movement_type: 'entry' | 'adjustment';
  delta: number;
  reason?: string | null;
}
