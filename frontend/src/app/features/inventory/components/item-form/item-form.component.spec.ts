import { FormBuilder } from '@angular/forms';
import { of, Subject } from 'rxjs';

import { Item } from '../../../../core/models/item.model';

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

  it('suggests the next code when creating an item', () => {
    const items$ = new Subject<Item[]>();
    itemService = {
      list: () => items$,
      create: () => of({} as any),
      update: () => of({} as any),
    };
    const form = new ItemFormComponent(fb, itemService, dialogRef, { mode: 'create' });

    form.ngOnInit();
    items$.next([{ code: 'SKU-0004' } as Item]);

    expect(form.form.get('code')?.value).toBe('SKU-0005');
  });

  it('does not overwrite a code typed before the suggestion loads', () => {
    const items$ = new Subject<Item[]>();
    itemService = {
      list: () => items$,
      create: () => of({} as any),
      update: () => of({} as any),
    };
    const form = new ItemFormComponent(fb, itemService, dialogRef, { mode: 'create' });

    form.ngOnInit();
    form.form.get('code')?.setValue('MANUAL-01');
    items$.next([{ code: 'SKU-0004' } as Item]);

    expect(form.form.get('code')?.value).toBe('MANUAL-01');
  });

  it('sends one request for a double submit and resets the flag when it finishes', () => {
    const request$ = new Subject<any>();
    let createCalls = 0;
    itemService = {
      create: () => {
        createCalls += 1;
        return request$;
      },
      update: () => of({} as any),
    };
    const form = new ItemFormComponent(fb, itemService, dialogRef, { mode: 'create' });
    form.form.patchValue({
      code: 'SKU-0001',
      name: 'Cable',
      type: 'part',
      price: '10,00',
      cost: '5,00',
      stock: 1,
      minStock: 1,
    });

    form.submit();
    form.submit();

    expect(createCalls).toBe(1);
    expect(form.submitting).toBe(true);

    request$.next({ id: 1 } as any);
    request$.complete();

    expect(form.submitting).toBe(false);
  });

  it('does not request item codes when editing', () => {
    let listCalls = 0;
    itemService = {
      list: () => {
        listCalls += 1;
        return of([]);
      },
      create: () => of({} as any),
      update: () => of({} as any),
    };
    const form = new ItemFormComponent(fb, itemService, dialogRef, {
      mode: 'edit',
      item: { code: 'SKU-0009' } as Item,
    });

    form.ngOnInit();

    expect(listCalls).toBe(0);
    expect(form.form.get('code')?.value).toBe('SKU-0009');
  });
});
