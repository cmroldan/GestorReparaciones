import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';

import { StockMovementDialogComponent } from './stock-movement-dialog.component';

describe('StockMovementDialogComponent', () => {
  let fb: FormBuilder;
  let itemService: any;
  let dialogRef: any;

  beforeEach(() => {
    fb = new FormBuilder();
    itemService = {
      createMovement: () => of({} as any),
    };
    dialogRef = {
      close: () => {},
    };
  });

  it('requires a reason for adjustments', () => {
    const dialog = new StockMovementDialogComponent(fb, itemService, dialogRef, {
      item: { id: 1 } as any,
    });
    dialog.form.patchValue({ movementType: 'adjustment', delta: -1, reason: '' });
    expect(dialog.form.invalid).toBe(true);

    dialog.form.patchValue({ reason: 'Rotura' });
    expect(dialog.form.valid).toBe(true);
  });
});
