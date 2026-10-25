import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { ClientService } from '../../../../core/services/client.service';
import { ClientFormComponent } from './client-form.component';

describe('ClientFormComponent', () => {
  let fb: FormBuilder;
  let clientService: any;
  let dialogRef: any;

  beforeEach(() => {
    fb = new FormBuilder();
    clientService = {
      create: () => of({} as any),
      update: () => of({} as any),
    };
    dialogRef = {
      close: () => {},
    };
  });

  it('requires names and at least one contact', () => {
    const component = new ClientFormComponent(fb, clientService, dialogRef, { mode: 'create' });
    component.form.patchValue({ firstName: '', lastName: '', phone: '', email: '' });
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({ firstName: 'Ana', lastName: 'Pérez', phone: '3415551234' });
    expect(component.form.valid).toBe(true);
  });

  it('validates email format', () => {
    const component = new ClientFormComponent(fb, clientService, dialogRef, { mode: 'create' });
    component.form.patchValue({ firstName: 'Ana', lastName: 'Pérez', email: 'correo-invalido' });
    expect(component.form.invalid).toBe(true);

    component.form.patchValue({ email: 'ana@example.com' });
    expect(component.form.valid).toBe(true);
  });
});

