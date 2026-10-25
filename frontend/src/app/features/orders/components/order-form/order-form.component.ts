import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, Optional, signal } from '@angular/core';
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

import { Client } from '../../../../core/models/client.model';
import { EquipmentWithOrderCount } from '../../../../core/models/equipment.model';
import { ServiceOrderCreate } from '../../../../core/models/service-order.model';
import { ClientService } from '../../../../core/services/client.service';
import { EquipmentService } from '../../../../core/services/equipment.service';
import { ServiceOrderService } from '../../../../core/services/service-order.service';

export interface OrderFormData {
  mode: 'create';
  clientId?: number;
}

@Component({
  selector: 'app-order-form',
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
    <h2 mat-dialog-title>Nueva Orden de Reparación</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="order-form">
        <mat-form-field appearance="outline">
          <mat-label>Cliente</mat-label>
          <mat-select formControlName="clientId" (selectionChange)="onClientChange($event.value)" required>
            @for (c of clients(); track c.id) {
              <mat-option [value]="c.id">
                {{ c.first_name }} {{ c.last_name }} ({{ c.document || c.phone || 'ID: ' + c.id }})
              </mat-option>
            }
          </mat-select>
          @if (form.get('clientId')?.hasError('required')) {
            <mat-error>El cliente es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Equipo</mat-label>
          <mat-select formControlName="equipmentId" required [disabled]="equipments().length === 0">
            @for (eq of equipments(); track eq.id) {
              <mat-option [value]="eq.id">
                {{ eq.brand }} {{ eq.model || '' }} - {{ eq.type }} (Serie: {{ eq.serial_number || '-' }})
              </mat-option>
            }
          </mat-select>
          @if (form.get('equipmentId')?.hasError('required')) {
            <mat-error>Debe seleccionar un equipo del cliente</mat-error>
          }
          @if (form.get('clientId')?.value && equipments().length === 0) {
            <mat-hint class="warn-hint">El cliente no tiene equipos registrados.</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Falla Declarada</mat-label>
          <textarea
            matInput
            formControlName="reportedFailure"
            rows="3"
            placeholder="Describa la falla reportada por el cliente..."
            required
          ></textarea>
          @if (form.get('reportedFailure')?.hasError('required')) {
            <mat-error>La falla declarada es obligatoria</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observaciones / Notas de Recepción</mat-label>
          <textarea matInput formControlName="notes" rows="2" placeholder="Accesorios que entrega, cargador, etc."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">
        Crear Orden
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .order-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      min-width: 25rem;
      padding-top: 0.5rem;
    }
    .warn-hint {
      color: var(--mat-sys-error, #ba1a1a);
    }
  `,
})
export class OrderFormComponent implements OnInit {
  form: FormGroup;
  clients = signal<Client[]>([]);
  equipments = signal<EquipmentWithOrderCount[]>([]);

  constructor(
    private readonly fb: FormBuilder,
    private readonly orderService: ServiceOrderService,
    private readonly clientService: ClientService,
    private readonly equipmentService: EquipmentService,
    @Optional() public readonly dialogRef: MatDialogRef<OrderFormComponent>,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    public readonly data: OrderFormData = { mode: 'create' },
  ) {
    this.form = this.fb.group({
      clientId: [this.data?.clientId ?? '', [Validators.required]],
      equipmentId: ['', [Validators.required]],
      reportedFailure: ['', [Validators.required]],
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.clientService.list().subscribe({
      next: (list) => {
        this.clients.set(list);
        if (this.data?.clientId) {
          this.onClientChange(this.data.clientId);
        }
      },
    });
  }

  onClientChange(clientId: number): void {
    if (!clientId) {
      this.equipments.set([]);
      this.form.patchValue({ equipmentId: '' });
      return;
    }
    this.clientService.get(clientId).subscribe({
      next: (detail) => {
        this.equipments.set(detail.equipments || []);
        if (detail.equipments && detail.equipments.length === 1) {
          this.form.patchValue({ equipmentId: detail.equipments[0].id });
        }
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    const val = this.form.value;
    const payload: ServiceOrderCreate = {
      client_id: Number(val.clientId),
      equipment_id: Number(val.equipmentId),
      reported_failure: val.reportedFailure ? val.reportedFailure.trim() : '',
      notes: val.notes && val.notes.trim() ? val.notes.trim() : null,
    };

    this.orderService.create(payload).subscribe({
      next: (created) => this.dialogRef?.close(created),
    });
  }
}

