import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';

import {
  OrderStatus,
  ServiceOrder,
} from '../../../../core/models/service-order.model';
import { ServiceOrderService } from '../../../../core/services/service-order.service';
import { ORDER_STATUS_LABELS } from '../../../../core/utils/order-status';
import { OrderFormComponent } from '../order-form/order-form.component';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDialogModule,
  ],
  template: `
    <div class="orders-container">
      <div class="header">
        <h1>Órdenes de Reparación</h1>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          Nueva Orden
        </button>
      </div>

      <div class="filters-bar">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="statusFilter" (selectionChange)="onFilterChange()">
            <mat-option value="">Todos los estados</mat-option>
            @for (s of statusOptions; track s.value) {
              <mat-option [value]="s.value">{{ s.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Fecha Desde</mat-label>
          <input matInput type="date" [(ngModel)]="fromDate" (change)="onFilterChange()" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Fecha Hasta</mat-label>
          <input matInput type="date" [(ngModel)]="toDate" (change)="onFilterChange()" />
        </mat-form-field>
      </div>

      <table mat-table [dataSource]="orders()" class="mat-elevation-z1 orders-table">
        <ng-container matColumnDef="number">
          <th mat-header-cell *matHeaderCellDef>Nº de Orden</th>
          <td mat-cell *matCellDef="let o">
            <strong>{{ o.number || '#' + o.id }}</strong>
          </td>
        </ng-container>

        <ng-container matColumnDef="entry_date">
          <th mat-header-cell *matHeaderCellDef>Ingreso</th>
          <td mat-cell *matCellDef="let o">{{ o.entry_date | date: 'dd/MM/yyyy HH:mm' }}</td>
        </ng-container>

        <ng-container matColumnDef="client_id">
          <th mat-header-cell *matHeaderCellDef>ID Cliente</th>
          <td mat-cell *matCellDef="let o">{{ o.client_id }}</td>
        </ng-container>

        <ng-container matColumnDef="equipment_id">
          <th mat-header-cell *matHeaderCellDef>ID Equipo</th>
          <td mat-cell *matCellDef="let o">{{ o.equipment_id }}</td>
        </ng-container>

        <ng-container matColumnDef="failure">
          <th mat-header-cell *matHeaderCellDef>Falla Declarada</th>
          <td mat-cell *matCellDef="let o">{{ o.reported_failure }}</td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let o">
            <span class="status-badge" [attr.data-status]="o.status">
              {{ getStatusLabel(o.status) }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Acciones</th>
          <td mat-cell *matCellDef="let o">
            <button mat-button color="primary" (click)="viewDetail(o.id)">
              Ver Detalle
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

        <tr class="mat-row" *matNoDataRow>
          <td class="mat-cell empty-cell" [attr.colspan]="displayedColumns.length">
            No se encontraron órdenes de reparación.
          </td>
        </tr>
      </table>
    </div>
  `,
  styles: `
    .orders-container {
      padding: 1.5rem;
      max-width: 80rem;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .filter-field {
      width: 14rem;
    }
    .orders-table {
      width: 100%;
    }
    .status-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 10px;
      font-weight: 500;
      font-size: 0.8rem;
      background: #e0e0e0;
    }
    .status-badge[data-status="ingresado"] { background: #e3f2fd; color: #0d47a1; }
    .status-badge[data-status="en_diagnostico"] { background: #fff8e1; color: #f57f17; }
    .status-badge[data-status="presupuestado"] { background: #f3e5f5; color: #4a148c; }
    .status-badge[data-status="en_reparacion"] { background: #e8f5e9; color: #1b5e20; }
    .status-badge[data-status="listo"] { background: #e0f2f1; color: #004d40; }
    .status-badge[data-status="entregado"] { background: #eeeeee; color: #424242; }

    .empty-cell {
      padding: 2rem;
      text-align: center;
      color: #666;
    }
  `,
})
export class OrderListComponent implements OnInit {
  orders = signal<ServiceOrder[]>([]);
  statusFilter = '';
  fromDate = '';
  toDate = '';

  displayedColumns = [
    'number',
    'entry_date',
    'client_id',
    'equipment_id',
    'failure',
    'status',
    'actions',
  ];

  readonly statusOptions = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  constructor(
    private readonly orderService: ServiceOrderService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService
      .list({
        status: (this.statusFilter as OrderStatus) || undefined,
        from: this.fromDate || undefined,
        to: this.toDate || undefined,
      })
      .subscribe({
        next: (data) => this.orders.set(data),
      });
  }

  onFilterChange(): void {
    this.loadOrders();
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] || status;
  }

  viewDetail(id: number): void {
    this.router.navigate(['/ordenes', id]);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(OrderFormComponent, {
      data: { mode: 'create' },
      width: '32rem',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.loadOrders();
    });
  }
}

