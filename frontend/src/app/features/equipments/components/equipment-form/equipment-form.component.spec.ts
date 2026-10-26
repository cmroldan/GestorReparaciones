import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { EquipmentService } from '../../../../core/services/equipment.service';
import { EquipmentFormComponent } from './equipment-form.component';

describe('EquipmentFormComponent', () => {
  let fb: FormBuilder;
  let equipmentService: any;
  let dialogRef: any;

  beforeEach(() => {
    fb = new FormBuilder();
    equipmentService = {
      create: () => of({} as any),
      update: () => of({} as any),
    };
    dialogRef = {
      close: () => {},
    };
  });

  it('offers only notebook, desktop and printer', () => {
    const component = new EquipmentFormComponent(fb, equipmentService, dialogRef, {
      mode: 'create',
      clientId: 1,
    });
    expect(component.types).toEqual(['notebook', 'desktop', 'printer']);
  });

  it('requires brand and type', () => {
    const component = new EquipmentFormComponent(fb, equipmentService, dialogRef, {
      mode: 'create',
      clientId: 1,
    });
    component.form.patchValue({ type: 'notebook', brand: '' });
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({ brand: 'Lenovo', model: 'ThinkPad' });
    expect(component.form.valid).toBe(true);
  });
});

