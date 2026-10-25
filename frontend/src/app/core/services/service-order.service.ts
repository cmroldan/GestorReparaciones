import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Consumption,
  OrderStatus,
  ServiceOrder,
  ServiceOrderCreate,
  ServiceOrderDetail,
  ServiceOrderUpdate,
  StatusChange,
} from '../models/service-order.model';
import { WorkLog } from '../models/work-log.model';
import { buildQueryParams } from '../utils/http-params';

const BASE_URL = '/api/v1/service-orders';

export interface ServiceOrderFilters {
  from?: string;
  to?: string;
  clientId?: number;
  status?: OrderStatus;
}

@Injectable({ providedIn: 'root' })
export class ServiceOrderService {
  private readonly http = inject(HttpClient);

  list(filters: ServiceOrderFilters = {}): Observable<ServiceOrder[]> {
    return this.http.get<ServiceOrder[]>(BASE_URL, {
      params: buildQueryParams({
        from: filters.from,
        to: filters.to,
        client_id: filters.clientId,
        status: filters.status,
      }),
    });
  }

  get(id: number): Observable<ServiceOrderDetail> {
    return this.http.get<ServiceOrderDetail>(`${BASE_URL}/${id}`);
  }

  create(payload: ServiceOrderCreate): Observable<ServiceOrder> {
    return this.http.post<ServiceOrder>(BASE_URL, payload);
  }

  update(id: number, payload: ServiceOrderUpdate): Observable<ServiceOrder> {
    return this.http.patch<ServiceOrder>(`${BASE_URL}/${id}`, payload);
  }

  changeStatus(id: number, toStatus: OrderStatus): Observable<ServiceOrder> {
    const payload: StatusChange = { to_status: toStatus };
    return this.http.patch<ServiceOrder>(`${BASE_URL}/${id}/status`, payload);
  }

  addWorkLog(id: number, description: string): Observable<WorkLog> {
    return this.http.post<WorkLog>(`${BASE_URL}/${id}/work-logs`, { description });
  }

  addConsumption(id: number, itemId: number, quantity: number): Observable<Consumption> {
    return this.http.post<Consumption>(`${BASE_URL}/${id}/consumptions`, {
      item_id: itemId,
      quantity,
    });
  }
}
