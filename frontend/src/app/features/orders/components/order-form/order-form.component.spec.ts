import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';

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

  it('clears the equipment when switching to a client with multiple equipments', () => {
    clientService = {
      list: () => of([]),
      get: (id: number) =>
        of({
          equipments:
            id === 1
              ? [{ id: 11, brand: 'Lenovo' }]
              : [
                  { id: 21, brand: 'HP' },
                  { id: 22, brand: 'Dell' },
                ],
        } as any),
    };
    const form = new OrderFormComponent(
      fb,
      orderService,
      clientService,
      equipmentService,
      dialogRef,
      { mode: 'create' },
    );
    form.form.patchValue({ clientId: 1, reportedFailure: 'No enciende' });
    form.onClientChange(1);
    expect(form.form.get('equipmentId')?.value).toBe(11);

    form.form.patchValue({ clientId: 2 });
    form.onClientChange(2);

    expect(form.form.get('equipmentId')?.value).toBe('');
    expect(form.form.invalid).toBe(true);
  });

  it('ignores a stale client response that arrives after the latest one', () => {
    const clientA$ = new Subject<any>();
    const clientB$ = new Subject<any>();
    clientService = {
      list: () => of([]),
      get: (id: number) => (id === 1 ? clientA$ : clientB$),
    };
    const form = new OrderFormComponent(
      fb,
      orderService,
      clientService,
      equipmentService,
      dialogRef,
      { mode: 'create' },
    );

    form.onClientChange(1);
    form.onClientChange(2);
    clientB$.next({ equipments: [{ id: 21 }, { id: 22 }] });
    clientA$.next({ equipments: [{ id: 11 }] });

    expect(form.equipments().map((equipment) => equipment.id)).toEqual([21, 22]);
    expect(form.form.get('equipmentId')?.value).toBe('');
  });

  it('preselects the equipment when the client has exactly one', () => {
    clientService = {
      list: () => of([]),
      get: () => of({ equipments: [{ id: 9, brand: 'Lenovo' }] } as any),
    };
    const form = new OrderFormComponent(
      fb,
      orderService,
      clientService,
      equipmentService,
      dialogRef,
      { mode: 'create' },
    );

    form.onClientChange(3);

    expect(form.form.get('equipmentId')?.value).toBe(9);
  });
});

