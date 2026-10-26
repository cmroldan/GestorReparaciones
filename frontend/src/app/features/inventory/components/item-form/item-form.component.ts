import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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

import { Item, ItemCreate, ItemType, ItemUpdate } from '../../../../core/models/item.model';
import { ItemService } from '../../../../core/services/item.service';
import { nextItemCode } from '../../../../core/utils/item-code';
import { formatCents, parseCents } from '../../../../core/utils/money';
import { moneyValidator } from '../../../../core/utils/money-validator';

export interface ItemFormData {
  mode: 'create' | 'edit';
  item?: Item;
}

@Component({
  selector: 'app-item-form',
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
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Nuevo Ítem' : 'Editar Ítem' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="item-form">
        <mat-form-field appearance="outline">
          <mat-label>Código</mat-label>
          <input matInput formControlName="code" required />
          @if (form.get('code')?.hasError('required')) {
            <mat-error>El código es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nombre / Descripción</mat-label>
          <input matInput formControlName="name" required />
          @if (form.get('name')?.hasError('required')) {
            <mat-error>El nombre es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="type" required>
            <mat-option value="part">Repuesto</mat-option>
            <mat-option value="supply">Insumo</mat-option>
            <mat-option value="accessory">Accesorio</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Precio de Venta ($)</mat-label>
          <input matInput formControlName="price" placeholder="ej. 1.250,00" required />
          @if (form.get('price')?.hasError('invalidMoney')) {
            <mat-error>Ingrese un importe válido (ej. 1250,50)</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Costo ($)</mat-label>
          <input matInput formControlName="cost" placeholder="ej. 800,00" required />
          @if (form.get('cost')?.hasError('invalidMoney')) {
            <mat-error>Ingrese un importe válido (ej. 800,00)</mat-error>
          }
        </mat-form-field>

        @if (data.mode === 'create') {
          <mat-form-field appearance="outline">
            <mat-label>Stock Inicial</mat-label>
            <input matInput formControlName="stock" type="number" min="0" required />
            @if (form.get('stock')?.hasError('min')) {
              <mat-error>El stock no puede ser negativo</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Stock Mínimo</mat-label>
          <input matInput formControlName="minStock" type="number" min="0" required />
          @if (form.get('minStock')?.hasError('min')) {
            <mat-error>El stock mínimo no puede ser negativo</mat-error>
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
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .item-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 22rem;
      padding-top: 0.5rem;
    }
  `,
})
export class ItemFormComponent implements OnInit {
  form: FormGroup;
  submitting = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly itemService: ItemService,
    @Optional() public readonly dialogRef: MatDialogRef<ItemFormComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public readonly data: ItemFormData = { mode: 'create' },
  ) {
    const item = this.data?.item;
    this.form = this.fb.group({
      code: [item?.code ?? '', [Validators.required]],
      name: [item?.name ?? '', [Validators.required]],
      type: [item?.type ?? 'part', [Validators.required]],
      price: [
        item ? formatCents(item.price_cents).replace('$ ', '') : '',
        [Validators.required, moneyValidator],
      ],
      cost: [
        item ? formatCents(item.cost_cents).replace('$ ', '') : '',
        [Validators.required, moneyValidator],
      ],
      stock: [item?.stock ?? 0, [Validators.required, Validators.min(0)]],
      minStock: [item?.min_stock ?? 0, [Validators.required, Validators.min(0)]],
    });

    if (this.data?.mode === 'edit') {
      this.form.get('code')?.disable();
      this.form.get('stock')?.disable();
    }
  }

  ngOnInit(): void {
    if (this.data?.mode !== 'create') return;

    this.itemService.list().subscribe((items) => {
      const codeControl = this.form.get('code');
      if (!codeControl) return;
      const current = String(codeControl.value ?? '').trim();
      if (current.length === 0) {
        codeControl.setValue(nextItemCode(items));
      }
    });
  }

  toPayload(): ItemCreate | ItemUpdate {
    const val = this.form.getRawValue();
    const price_cents = parseCents(val.price) ?? 0;
    const cost_cents = parseCents(val.cost) ?? 0;

    if (this.data.mode === 'create') {
      const payload: ItemCreate = {
        code: val.code ? val.code.trim() : '',
        name: val.name ? val.name.trim() : '',
        type: val.type as ItemType,
        price_cents,
        cost_cents,
        stock: Number(val.stock) || 0,
        min_stock: Number(val.minStock) || 0,
      };
      return payload;
    } else {
      const payload: ItemUpdate = {
        name: val.name ? val.name.trim() : '',
        type: val.type as ItemType,
        price_cents,
        cost_cents,
        min_stock: Number(val.minStock) || 0,
      };
      return payload;
    }
  }

  submit(): void {
    if (this.submitting || this.form.invalid) return;
    const payload = this.toPayload();

    if (this.data.mode === 'create') {
      this.submitting = true;
      this.itemService
        .create(payload as ItemCreate)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: (created) => this.dialogRef?.close(created),
        });
    } else if (this.data.item) {
      this.submitting = true;
      this.itemService
        .update(this.data.item.id, payload as ItemUpdate)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: (updated) => this.dialogRef?.close(updated),
        });
    }
  }
}

