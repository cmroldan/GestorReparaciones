import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Item, ItemCreate, ItemUpdate } from '../models/item.model';
import { StockMovement, StockMovementCreate } from '../models/stock-movement.model';
import { buildQueryParams } from '../utils/http-params';

const BASE_URL = '/api/v1/items';

export interface ItemFilters {
  q?: string;
  lowStock?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ItemService {
  private readonly http = inject(HttpClient);

  list(filters: ItemFilters = {}): Observable<Item[]> {
    return this.http.get<Item[]>(BASE_URL, {
      params: buildQueryParams({ q: filters.q, low_stock: filters.lowStock }),
    });
  }

  get(id: number): Observable<Item> {
    return this.http.get<Item>(`${BASE_URL}/${id}`);
  }

  create(payload: ItemCreate): Observable<Item> {
    return this.http.post<Item>(BASE_URL, payload);
  }

  update(id: number, payload: ItemUpdate): Observable<Item> {
    return this.http.patch<Item>(`${BASE_URL}/${id}`, payload);
  }

  /** El backend expone la baja como DELETE (no elimina datos). */
  deactivate(id: number): Observable<Item> {
    return this.http.delete<Item>(`${BASE_URL}/${id}`);
  }

  listMovements(id: number): Observable<StockMovement[]> {
    return this.http.get<StockMovement[]>(`${BASE_URL}/${id}/stock-movements`);
  }

  createMovement(payload: StockMovementCreate): Observable<StockMovement> {
    return this.http.post<StockMovement>('/api/v1/stock-movements', payload);
  }
}
