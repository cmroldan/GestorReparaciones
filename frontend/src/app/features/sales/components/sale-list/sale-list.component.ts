import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { Sale } from '../../../../core/models/sale.model';
import { SaleService } from '../../../../core/services/sale.service';
import { formatCents } from '../../../../core/utils/money';

@Component({
  selector: 'app-sale-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="sale-list-container">
      <div class="header-nav page-toolbar">
        <div>
          <h2>Historial de ventas</h2>
          <p class="page-subtitle">
            Consultá las ventas registradas y el total acumulado del período.
          </p>
        </div>
        <button mat-button routerLink="/ventas">
          <span aria-hidden="true">←</span> Volver a Punto de Venta
        </button>
      </div>

      <div class="filters-bar panel">
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
          <table mat-table [dataSource]="sales()" class="sales-table" aria-label="Historial de ventas">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef>Nº Venta</th>
              <td mat-cell *matCellDef="let s"><strong>#{{ s.id }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Fecha y Hora</th>
              <td mat-cell *matCellDef="let s">{{ s.created_at | date: 'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>

            <ng-container matColumnDef="items">
              <th mat-header-cell *matHeaderCellDef>Productos</th>
              <td mat-cell *matCellDef="let s">
                <ul class="items-summary">
                  @for (item of s.items; track item.id) {
                    <li>
                      {{ item.quantity }}x {{ item.item_name }} ({{ formatPrice(item.unit_price_cents) }})
                    </li>
                  }
                </ul>
              </td>
            </ng-container>

            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let s">
                <strong>{{ formatPrice(s.total_cents) }}</strong>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-cell" [attr.colspan]="displayedColumns.length">
                No se registraron ventas en el período consultado.
              </td>
            </tr>
          </table>
        </div>
      </div>

      <mat-card class="total-accumulated-card panel">
        <mat-card-content class="accumulated-content">
          <span>Total Acumulado del Período:</span>
          <strong class="accumulated-number">{{ formatPrice(totalAccumulatedCents()) }}</strong>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .sale-list-container {
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
    .sales-table {
      width: 100%;
    }
    .items-summary {
      list-style: none;
      padding: 0;
      margin: 0.25rem 0;
      color: var(--app-text-muted);
      font-size: 0.82rem;
    }
    .total-accumulated-card {
      margin-top: 1rem;
      padding: 1.25rem 1.5rem;
      border-color: rgb(52 211 153 / 30%);
      background: var(--app-success-soft);
    }
    .accumulated-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      color: var(--app-text-muted);
      font-size: 0.95rem;
    }
    .accumulated-number {
      color: var(--app-success);
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .empty-cell {
      padding: 2.5rem;
      color: var(--app-text-muted);
      text-align: center;
    }
  `,
})
export class SaleListComponent implements OnInit {
  sales = signal<Sale[]>([]);
  totalAccumulatedCents = signal<number>(0);
  fromDate = '';
  toDate = '';

  displayedColumns = ['id', 'date', 'items', 'total'];

  constructor(private readonly saleService: SaleService) {}

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.saleService.list(this.fromDate || undefined, this.toDate || undefined).subscribe({
      next: (response) => {
        this.sales.set(response.sales || []);
        this.totalAccumulatedCents.set(response.total_cents || 0);
      },
    });
  }

  onFilterChange(): void {
    this.loadSales();
  }

  formatPrice(cents: number): string {
    return formatCents(cents);
  }
}
