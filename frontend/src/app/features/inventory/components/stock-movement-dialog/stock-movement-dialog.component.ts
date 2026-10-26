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
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';

import { Item } from '../../../../core/models/item.model';
import { StockMovementCreate } from '../../../../core/models/stock-movement.model';
import { ItemService } from '../../../../core/services/item.service';

export interface StockMovementDialogData {
  item: Item;
}

export function stockMovementValidator(control: AbstractControl): ValidationErrors | null {
  const type = control.get('movementType')?.value;
  const reason = control.get('reason')?.value;
  const delta = control.get('delta')?.value;

  if (delta === 0 || delta === null || delta === undefined) {
    return { deltaRequired: true };
  }
  if (type === 'entry' && delta < 0) {
    return { positiveEntryRequired: true };
  }
  if (type === 'adjustment' && (!reason || String(reason).trim().length === 0)) {
    return { reasonRequired: true };
  }
  return null;
}

@Component({
  selector: 'app-stock-movement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Movimiento de Stock: {{ data.item.name }}</h2>
    <mat-dialog-content>
      <p class="current-stock">Stock actual: <strong>{{ data.item.stock }}</strong></p>
      <form [formGroup]="form" class="movement-form">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de Movimiento</mat-label>
          <mat-select formControlName="movementType">
            <mat-option value="entry">Entrada (Sumar stock)</mat-option>
            <mat-option value="adjustment">Ajuste manual (+ o -)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cantidad / Variación</mat-label>
          <input
            matInput
            formControlName="delta"
            type="number"
            placeholder="ej. 5 o -2"
            required
          />
          <mat-hint>Para entradas use números positivos. Para ajustes use + o -.</mat-hint>
          @if (form.hasError('deltaRequired')) {
            <mat-error>La variación debe ser distinta de cero</mat-error>
          }
          @if (form.hasError('positiveEntryRequired')) {
            <mat-error>La entrada debe ser un número positivo</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Motivo</mat-label>
          <input
            matInput
            formControlName="reason"
            placeholder="ej. Compra a proveedor, rotura, inventario"
          />
          @if (form.hasError('reasonRequired')) {
            <mat-error>El motivo es obligatorio para ajustes manuales</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || submitting"
        (click)="submit()"
      >
        Registrar Movimiento
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .movement-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 22rem;
      padding-top: 0.5rem;
    }
    .current-stock {
      margin-top: 0;
      color: #555;
    }
  `,
})
export class StockMovementDialogComponent {
  form: FormGroup;
  submitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly itemService: ItemService,
    @Optional() public readonly dialogRef: MatDialogRef<StockMovementDialogComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public readonly data: StockMovementDialogData = { item: {} as any },
  ) {
    this.form = this.fb.group(
      {
        movementType: ['entry', [Validators.required]],
        delta: [1, [Validators.required]],
        reason: [''],
      },
      { validators: [stockMovementValidator] },
    );
  }

  submit(): void {
    if (this.submitting || this.form.invalid) return;
    const val = this.form.value;
    const payload: StockMovementCreate = {
      item_id: this.data.item.id,
      movement_type: val.movementType,
      delta: Number(val.delta),
      reason: val.reason && val.reason.trim() ? val.reason.trim() : null,
    };

    this.submitting = true;
    this.itemService
      .createMovement(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (res) => this.dialogRef?.close(res),
      });
  }
}

