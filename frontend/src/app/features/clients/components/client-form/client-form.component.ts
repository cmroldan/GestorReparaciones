import { CommonModule } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { Client, ClientCreate, ClientUpdate } from '../../../../core/models/client.model';
import { ClientService } from '../../../../core/services/client.service';

export interface ClientFormData {
  mode: 'create' | 'edit';
  client?: Client;
}

export function atLeastOneContact(control: AbstractControl): ValidationErrors | null {
  const phone = control.get('phone')?.value;
  const email = control.get('email')?.value;
  const hasPhone = phone !== null && phone !== undefined && String(phone).trim().length > 0;
  const hasEmail = email !== null && email !== undefined && String(email).trim().length > 0;
  return hasPhone || hasEmail ? null : { contactRequired: true };
}

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Nuevo Cliente' : 'Editar Cliente' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="client-form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="firstName" required />
          @if (form.get('firstName')?.hasError('required')) {
            <mat-error>El nombre es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Apellido</mat-label>
          <input matInput formControlName="lastName" required />
          @if (form.get('lastName')?.hasError('required')) {
            <mat-error>El apellido es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Documento</mat-label>
          <input matInput formControlName="document" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="phone" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Correo Electrónico</mat-label>
          <input matInput formControlName="email" type="email" />
          @if (form.get('email')?.hasError('email')) {
            <mat-error>Formato de correo inválido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Dirección</mat-label>
          <input matInput formControlName="address" />
        </mat-form-field>

        @if (form.hasError('contactRequired') && (form.touched || form.dirty)) {
          <p class="error-text">Debe ingresar al menos un medio de contacto (teléfono o correo).</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .client-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 20rem;
      padding-top: 0.5rem;
    }
    .error-text {
      color: var(--mat-sys-error, #ba1a1a);
      font-size: 0.85rem;
      margin: 0;
    }
  `,
})
export class ClientFormComponent {
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly clientService: ClientService,
    @Optional() public readonly dialogRef: MatDialogRef<ClientFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public readonly data: ClientFormData = { mode: 'create' },
  ) {
    const c = this.data?.client;
    this.form = this.fb.group(
      {
        firstName: [c?.first_name ?? '', [Validators.required]],
        lastName: [c?.last_name ?? '', [Validators.required]],
        document: [c?.document ?? ''],
        phone: [c?.phone ?? ''],
        email: [c?.email ?? '', [Validators.email]],
        address: [c?.address ?? ''],
      },
      { validators: [atLeastOneContact] },
    );
  }

  toPayload(): ClientCreate | ClientUpdate {
    const val = this.form.value;
    return {
      first_name: val.firstName ? val.firstName.trim() : '',
      last_name: val.lastName ? val.lastName.trim() : '',
      document: val.document && val.document.trim() ? val.document.trim() : null,
      phone: val.phone && val.phone.trim() ? val.phone.trim() : null,
      email: val.email && val.email.trim() ? val.email.trim() : null,
      address: val.address && val.address.trim() ? val.address.trim() : null,
    };
  }

  submit(): void {
    if (this.form.invalid) return;
    const payload = this.toPayload();

    if (this.data.mode === 'create') {
      this.clientService.create(payload as ClientCreate).subscribe({
        next: (created) => this.dialogRef?.close(created),
      });
    } else if (this.data.client) {
      this.clientService.update(this.data.client.id, payload as ClientUpdate).subscribe({
        next: (updated) => this.dialogRef?.close(updated),
      });
    }
  }
}

