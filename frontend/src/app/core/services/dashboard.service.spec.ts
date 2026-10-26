import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  const now = new Date('2026-10-26T15:00:00Z');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('requests every section with the month range in Argentina', () => {
    service.loadAll(now);

    http.expectOne('/api/v1/service-orders').flush([]);
    const sales = http.expectOne(
      (request) => request.url === '/api/v1/sales',
    );
    expect(sales.request.params.get('from')).toBe('2026-10-01');
    expect(sales.request.params.get('to')).toBe('2026-10-26');
    sales.flush({ sales: [], total_cents: 0 });

    const items = http.expectOne(
      (request) => request.url === '/api/v1/items',
    );
    expect(items.request.params.get('low_stock')).toBe('true');
    items.flush([]);

    http.expectOne('/api/v1/clients').flush([]);
  });

  it('keeps the other sections when one request fails', () => {
    service.loadAll(now);

    http
      .expectOne('/api/v1/service-orders')
      .flush({ detail: 'boom' }, { status: 500, statusText: 'Server Error' });
    http.expectOne((request) => request.url === '/api/v1/sales').flush({ sales: [], total_cents: 0 });
    http.expectOne((request) => request.url === '/api/v1/items').flush([]);
    http.expectOne('/api/v1/clients').flush([]);

    expect(service.orders().loading).toBe(false);
    expect(service.orders().error).toBeTruthy();
    expect(service.orders().data).toBeNull();
    expect(service.sales().data?.total_cents).toBe(0);
    expect(service.stock().data).toEqual([]);
    expect(service.clients().data).toEqual([]);
  });

  it('reloads only the failed section', () => {
    service.loadAll(now);
    http
      .expectOne((request) => request.url === '/api/v1/items')
      .flush({ detail: 'boom' }, { status: 500, statusText: 'Server Error' });
    http.expectOne('/api/v1/service-orders').flush([]);
    http.expectOne((request) => request.url === '/api/v1/sales').flush({ sales: [], total_cents: 0 });
    http.expectOne('/api/v1/clients').flush([]);

    expect(service.stock().error).toBeTruthy();

    service.reloadSection('stock', now);

    http.expectNone('/api/v1/service-orders');
    http.expectNone('/api/v1/clients');
    http
      .expectOne((request) => request.url === '/api/v1/items')
      .flush([
        {
          id: 1,
          code: 'R-1',
          name: 'Repuesto',
          type: 'part',
          price_cents: 1000,
          cost_cents: 500,
          stock: 1,
          min_stock: 2,
          active: true,
          is_sellable: true,
          created_at: '2026-10-01T12:00:00Z',
          updated_at: '2026-10-01T12:00:00Z',
        },
      ]);

    expect(service.stock().error).toBeNull();
    expect(service.stock().data?.length).toBe(1);
  });

  it('uses the backend total instead of recalculating it from the items', () => {
    service.loadAll(now);
    http.expectOne('/api/v1/service-orders').flush([]);
    http.expectOne((request) => request.url === '/api/v1/sales').flush({
      sales: [
        {
          id: 1,
          total_cents: 999,
          created_at: '2026-10-02T15:00:00Z',
          items: [
            {
              id: 1,
              item_id: 1,
              item_code: 'R-1',
              item_name: 'Repuesto',
              quantity: 1,
              unit_price_cents: 100,
              subtotal_cents: 100,
            },
          ],
        },
      ],
      total_cents: 12345,
    });
    http.expectOne((request) => request.url === '/api/v1/items').flush([]);
    http.expectOne('/api/v1/clients').flush([]);

    expect(service.sales().data?.total_cents).toBe(12345);
  });

  it('keeps an empty month as a successful zero total', () => {
    service.loadAll(now);
    http.expectOne('/api/v1/service-orders').flush([]);
    http.expectOne((request) => request.url === '/api/v1/sales').flush({ sales: [], total_cents: 0 });
    http.expectOne((request) => request.url === '/api/v1/items').flush([]);
    http.expectOne('/api/v1/clients').flush([]);

    expect(service.sales().error).toBeNull();
    expect(service.sales().data).toEqual({ sales: [], total_cents: 0 });
  });
});
