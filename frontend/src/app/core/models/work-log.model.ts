export interface WorkLog {
  id: number;
  service_order_id: number;
  description: string;
  created_at: string;
}

export interface WorkLogCreate {
  description: string;
}
