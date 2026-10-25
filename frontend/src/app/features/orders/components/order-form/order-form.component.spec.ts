import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { OrderFormComponent } from './order-form.component';

describe('OrderFormComponent', () => {
  let fb: FormBuilder;
  let orderService: any;
  let clientService: any;
  let equipmentService: any;
  let dialogRef: any;

  beforeEach(() => {
    fb = new FormBuilder();
    orderService = {
      create: () => of({} as any),
    };
    clientService = {
      list: () => of([]),
      get: () => of({ equipments: [] } as any),
    };
    equipmentService = {};
    dialogRef = {
      close: () => {},
    };
  });

  it('requires the reported failure', () => {
    const form = new OrderFormComponent(
      fb,
      orderService,
      clientService,
      equipmentService,
      dialogRef,
      { mode: 'create' },
    );
    form.form.patchValue({ clientId: 1, equipmentId: 1, reportedFailure: '' });
    expect(form.form.invalid).toBe(true);

    form.form.patchValue({ reportedFailure: 'No enciende' });
    expect(form.form.valid).toBe(true);
  });
});
