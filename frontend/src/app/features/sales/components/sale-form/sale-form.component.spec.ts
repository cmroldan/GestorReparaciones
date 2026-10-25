import { of } from 'rxjs';

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
});

