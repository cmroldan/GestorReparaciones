import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';

import { ItemService } from '../../../../core/services/item.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SaleService } from '../../../../core/services/sale.service';
import { SaleFormComponent } from './sale-form.component';

describe('SaleFormComponent', () => {
  let component: SaleFormComponent;
  let saleService: any;
  let itemService: any;
  let notificationService: any;

  beforeEach(() => {
    itemService = {
      list: () => of([]),
    };
    notificationService = {
      success: () => {},
    };
  });

  it('sends only item ids and quantities, never a total', () => {
    let capturedPayload: any = null;
    saleService = {
      create: (payload: any) => {
        capturedPayload = payload;
        return of({
          id: 1,
          total_cents: 2000,
          created_at: '2026-10-24T12:00:00Z',
          items: [],
        } as any);
      },
    };
    component = new SaleFormComponent(saleService, itemService, notificationService);
    component.cart = [{ item_id: 7, quantity: 2, item_name: 'Cable', price_cents: 1000 }];
    component.submit();
    expect(capturedPayload).toEqual({ items: [{ item_id: 7, quantity: 2 }] });
  });

  it('requires at least one cart line and a positive quantity', () => {
    saleService = {
      create: () => of({} as any),
    };
    component = new SaleFormComponent(saleService, itemService, notificationService);
    component.cart = [];
    expect(component.canSubmit()).toBe(false);

    component.cart = [{ item_id: 1, quantity: 0, item_name: 'Mouse', price_cents: 500 }];
    expect(component.canSubmit()).toBe(false);

    component.cart = [{ item_id: 1, quantity: 2, item_name: 'Mouse', price_cents: 500 }];
    expect(component.canSubmit()).toBe(true);
  });

  it('sends exactly one sale when submit is triggered twice while pending', () => {
    const request$ = new Subject<any>();
    let createCalls = 0;
    saleService = {
      create: () => {
        createCalls += 1;
        return request$;
      },
    };
    component = new SaleFormComponent(saleService, itemService, notificationService);
    component.cart = [{ item_id: 7, quantity: 2, item_name: 'Cable', price_cents: 1000 }];

    component.submit();
    component.submit();

    expect(createCalls).toBe(1);
    expect(component.submitting).toBe(true);

    request$.next({
      id: 1,
      total_cents: 2000,
      created_at: '2026-10-24T12:00:00Z',
      items: [],
    });
    request$.complete();

    expect(component.submitting).toBe(false);
  });

  it('links to the sales history route', async () => {
    await TestBed.configureTestingModule({
      imports: [SaleFormComponent],
      providers: [
        provideRouter([]),
        { provide: SaleService, useValue: {} },
        { provide: ItemService, useValue: { list: () => of([]) } },
        { provide: NotificationService, useValue: { success: () => {} } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SaleFormComponent);
    await fixture.whenStable();

    const link = (
      Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[]
    ).find((anchor) => anchor.textContent?.includes('Ver Historial de Ventas'));

    expect(link?.getAttribute('href')).toBe('/ventas/historial');
  });
});
