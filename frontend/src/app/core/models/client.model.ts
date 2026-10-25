/** Esquemas del dominio clientes (espejo de backend/app/schemas/client.py). */

import { EquipmentWithOrderCount } from './equipment.model';

export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  first_name: string;
  last_name: string;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface ClientUpdate {
  first_name?: string | null;
  last_name?: string | null;
  document?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface ClientDetail extends Client {
  equipments: EquipmentWithOrderCount[];
}
