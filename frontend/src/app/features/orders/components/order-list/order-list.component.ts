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

import { Client } from '../../../../core/models/client.model';
import { Equipment } from '../../../../core/models/equipment.model';
import {
  OrderStatus,
  ServiceOrder,
} from '../../../../core/models/service-order.model';
import { ClientService } from '../../../../core/services/client.service';
import { EquipmentService } from '../../../../core/services/equipment.service';
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
      <div class="header page-toolbar">
        <div>
          <h2>Órdenes de servicio</h2>
          <p class="page-subtitle">Seguimiento de los equipos recibidos en el taller.</p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          Nueva Orden
        </button>
      </div>

      <div class="filters-bar panel">
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
          <mat-label>Cliente</mat-label>
          <mat-select [(ngModel)]="clientId" (selectionChange)="onFilterChange()">
            <mat-option value="">Todos los clientes</mat-option>
            @for (c of clients(); track c.id) {
              <mat-option [value]="c.id">{{ c.first_name }} {{ c.last_name }}</mat-option>
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

      <div class="panel table-panel">
        <div class="table-scroll">
          <table mat-table [dataSource]="orders()" class="orders-table" aria-label="Órdenes de servicio">
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

            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef>Cliente</th>
              <td mat-cell *matCellDef="let o">{{ clientName(o.client_id) }}</td>
            </ng-container>

            <ng-container matColumnDef="equipment">
              <th mat-header-cell *matHeaderCellDef>Equipo</th>
              <td mat-cell *matCellDef="let o">{{ equipmentLabel(o.equipment_id) }}</td>
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
      </div>
    </div>
  `,
  styles: `
    .orders-container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .page-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1.25rem;
    }
    .page-toolbar h2 {
      margin: 0;
      color: var(--app-text);
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }
    .page-subtitle {
      margin: 0.35rem 0 0;
      color: var(--app-text-muted);
      font-size: 0.82rem;
    }
    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 1rem 1.25rem 0;
      flex-wrap: wrap;
    }
    .filter-field {
      width: 14rem;
    }
    .table-panel {
      overflow: hidden;
    }
    .orders-table {
      width: 100%;
    }
    .empty-cell {
      padding: 2.5rem;
      text-align: center;
      color: var(--app-text-muted);
    }
  `,
})
export class OrderListComponent implements OnInit {
  orders = signal<ServiceOrder[]>([]);
  clients = signal<Client[]>([]);
  statusFilter = '';
  clientId: number | '' = '';
  fromDate = '';
  toDate = '';

  private readonly equipmentLabels = signal<Record<number, string>>({});
  private readonly requestedEquipmentIds = new Set<number>();

  displayedColumns = [
    'number',
    'entry_date',
    'client',
    'equipment',
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
    private readonly clientService: ClientService,
    private readonly equipmentService: EquipmentService,
    private readonly dialog: MatDialog,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.clientService.list().subscribe({
      next: (list) => this.clients.set(list),
    });
    this.loadOrders();
  }

  loadOrders(): void {
    this.orderService
      .list({
        status: (this.statusFilter as OrderStatus) || undefined,
        clientId: this.clientId === '' ? undefined : Number(this.clientId),
        from: this.fromDate || undefined,
        to: this.toDate || undefined,
      })
      .subscribe({
        next: (data) => {
          this.orders.set(data);
          this.loadEquipmentLabels(data);
        },
      });
  }

  clientName(clientId: number): string {
    const client = this.clients().find((c) => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : `Cliente #${clientId}`;
  }

  equipmentLabel(equipmentId: number): string {
    return this.equipmentLabels()[equipmentId] ?? `Equipo #${equipmentId}`;
  }

  private loadEquipmentLabels(orders: ServiceOrder[]): void {
    const ids = [...new Set(orders.map((o) => o.equipment_id))];
    for (const id of ids) {
      if (this.requestedEquipmentIds.has(id)) continue;
      this.requestedEquipmentIds.add(id);
      this.equipmentService.get(id).subscribe({
        next: (equipment) => this.setEquipmentLabel(id, this.describeEquipment(equipment)),
        error: () => this.setEquipmentLabel(id, `Equipo #${id}`),
      });
    }
  }

  private describeEquipment(equipment: Equipment): string {
    const base = `${equipment.brand}${equipment.model ? ' ' + equipment.model : ''}`.trim();
    return equipment.serial_number ? `${base} (Serie: ${equipment.serial_number})` : base;
  }

  private setEquipmentLabel(id: number, label: string): void {
    this.equipmentLabels.update((labels) => ({ ...labels, [id]: label }));
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

