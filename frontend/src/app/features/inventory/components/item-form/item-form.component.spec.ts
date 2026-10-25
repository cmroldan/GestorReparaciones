import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { ItemFormComponent } from './item-form.component';

describe('ItemFormComponent', () => {
  let fb: FormBuilder;
  let itemService: any;
  let dialogRef: any;

  beforeEach(() => {
    fb = new FormBuilder();
    itemService = {
      create: () => of({} as any),
      update: () => of({} as any),
    };
    dialogRef = {
      close: () => {},
    };
  });

  it('parses prices to cents and blocks direct stock edit on update', () => {
    const form = new ItemFormComponent(fb, itemService, dialogRef, { mode: 'edit' });
    form.form.patchValue({
      name: 'Fuente',
      type: 'part',
      price: '1.234,50',
      cost: '500,00',
      minStock: 2,
    });
    expect(form.toPayload().price_cents).toBe(123450);
    expect(form.form.get('stock')?.disabled).toBe(true);
  });
});

