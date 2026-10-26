import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Sale, SaleCreate, SaleListResponse } from '../models/sale.model';
import { buildQueryParams } from '../utils/http-params';

const BASE_URL = '/api/v1/sales';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private readonly http = inject(HttpClient);

  create(payload: SaleCreate): Observable<Sale> {
    return this.http.post<Sale>(BASE_URL, payload);
  }

  list(from?: string, to?: string): Observable<SaleListResponse> {
    return this.http.get<SaleListResponse>(BASE_URL, {
      params: buildQueryParams({ from, to }),
    });
  }

  get(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${BASE_URL}/${id}`);
  }
}
