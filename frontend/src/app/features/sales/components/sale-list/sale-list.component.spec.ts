import { of } from 'rxjs';

import { SaleListComponent } from './sale-list.component';

describe('SaleListComponent', () => {
  let component: SaleListComponent;
  let saleService: any;

  beforeEach(() => {
    saleService = {
      list: () =>
        of({
          sales: [
            {
              id: 1,
              total_cents: 250000,
              created_at: '2026-10-24T12:00:00Z',
              items: [],
            },
          ],
          total_cents: 250000,
        }),
    };
    component = new SaleListComponent(saleService);
  });

  it('loads sales and displays accumulated total', () => {
    component.ngOnInit();
    expect(component.sales().length).toBe(1);
    expect(component.totalAccumulatedCents()).toBe(250000);
  });
});
