import { CommonModule } from '@angular/common';
import { Component, Inject, Optional } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
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

import {
  Equipment,
  EquipmentCreate,
  EquipmentType,
  EquipmentUpdate,
} from '../../../../core/models/equipment.model';
import { EquipmentService } from '../../../../core/services/equipment.service';

export interface EquipmentFormData {
  mode: 'create' | 'edit';
  clientId?: number;
  equipment?: Equipment;
}

@Component({
  selector: 'app-equipment-form',
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
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Nuevo Equipo' : 'Editar Equipo' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="equipment-form">
        <mat-form-field appearance="outline">
          <mat-label>Tipo de Equipo</mat-label>
          <mat-select formControlName="type" required>
            @for (t of types; track t) {
              <mat-option [value]="t">
                {{ typeLabels[t] }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Marca</mat-label>
          <input matInput formControlName="brand" required />
          @if (form.get('brand')?.hasError('required')) {
            <mat-error>La marca es obligatoria</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Modelo</mat-label>
          <input matInput formControlName="model" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Número de Serie</mat-label>
          <input matInput formControlName="serial_number" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observaciones / Notas</mat-label>
          <textarea matInput formControlName="notes" rows="3"></textarea>
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
    .equipment-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
      min-width: min(20rem, 70vw);
      padding-top: 0.5rem;
    }
  `,
})
export class EquipmentFormComponent {
  form: FormGroup;
  submitting = false;
  readonly types: EquipmentType[] = ['notebook', 'desktop', 'printer'];
  readonly typeLabels: Record<EquipmentType, string> = {
    notebook: 'Notebook',
    desktop: 'PC de Escritorio',
    printer: 'Impresora',
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly equipmentService: EquipmentService,
    @Optional() public readonly dialogRef: MatDialogRef<EquipmentFormComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public readonly data: EquipmentFormData = { mode: 'create' },
  ) {
    const eq = this.data?.equipment;
    this.form = this.fb.group({
      type: [eq?.type ?? 'notebook', [Validators.required]],
      brand: [eq?.brand ?? '', [Validators.required]],
      model: [eq?.model ?? ''],
      serial_number: [eq?.serial_number ?? ''],
      notes: [eq?.notes ?? ''],
    });
  }

  toPayload(): EquipmentCreate | EquipmentUpdate {
    const val = this.form.value;
    if (this.data.mode === 'create') {
      const payload: EquipmentCreate = {
        client_id: this.data.clientId ?? 0,
        type: val.type,
        brand: val.brand ? val.brand.trim() : '',
        model: val.model && val.model.trim() ? val.model.trim() : null,
        serial_number:
          val.serial_number && val.serial_number.trim() ? val.serial_number.trim() : null,
        notes: val.notes && val.notes.trim() ? val.notes.trim() : null,
      };
      return payload;
    } else {
      const payload: EquipmentUpdate = {
        type: val.type,
        brand: val.brand ? val.brand.trim() : '',
        model: val.model && val.model.trim() ? val.model.trim() : null,
        serial_number:
          val.serial_number && val.serial_number.trim() ? val.serial_number.trim() : null,
        notes: val.notes && val.notes.trim() ? val.notes.trim() : null,
      };
      return payload;
    }
  }

  submit(): void {
    if (this.submitting || this.form.invalid) return;
    const payload = this.toPayload();

    if (this.data.mode === 'create') {
      this.submitting = true;
      this.equipmentService
        .create(payload as EquipmentCreate)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: (created) => this.dialogRef?.close(created),
        });
    } else if (this.data.equipment) {
      this.submitting = true;
      this.equipmentService
        .update(this.data.equipment.id, payload as EquipmentUpdate)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: (updated) => this.dialogRef?.close(updated),
        });
    }
  }
}

