import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';

import { Item, ItemType } from '../../../../core/models/item.model';
import { ItemService } from '../../../../core/services/item.service';
import { formatCents } from '../../../../core/utils/money';
import { ItemFormComponent } from '../item-form/item-form.component';
import { StockMovementDialogComponent } from '../stock-movement-dialog/stock-movement-dialog.component';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
  ],
  template: `
    <div class="inventory-container">
      <div class="header page-toolbar">
        <div>
          <h2>Inventario de repuestos y productos</h2>
          <p class="page-subtitle">
            Controlá stock, precios y disponibilidad de venta de cada ítem.
          </p>
        </div>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          Nuevo Ítem
        </button>
      </div>

      <div class="filters-bar panel">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar por código o nombre</mat-label>
          <input
            matInput
            [(ngModel)]="searchQuery"
            (ngModelChange)="onFilterChange()"
            placeholder="ej. Memoria RAM, FUENTE-01"
          />
        </mat-form-field>

        <mat-checkbox
          [(ngModel)]="lowStockOnly"
          (ngModelChange)="onFilterChange()"
          color="warn"
          class="low-stock-check"
        >
          Solo stock bajo (≤ mínimo)
        </mat-checkbox>
      </div>

      <div class="panel table-panel">
        <div class="table-scroll">
          <table mat-table [dataSource]="items()" class="items-table" aria-label="Inventario de ítems">
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let item" class="code-cell"><strong>{{ item.code }}</strong></td>
            </ng-container>

            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre / Descripción</th>
              <td mat-cell *matCellDef="let item">{{ item.name }}</td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let item">{{ getTypeLabel(item.type) }}</td>
            </ng-container>

            <ng-container matColumnDef="stock">
              <th mat-header-cell *matHeaderCellDef>Stock Actual</th>
              <td mat-cell *matCellDef="let item" [class.low-stock-warning]="item.active && item.stock <= item.min_stock">
                {{ item.stock }}
                @if (item.active && item.stock <= item.min_stock) {
                  <span class="status-badge" data-stock="low">¡Bajo!</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="min_stock">
              <th mat-header-cell *matHeaderCellDef>Stock Mínimo</th>
              <td mat-cell *matCellDef="let item">{{ item.min_stock }}</td>
            </ng-container>

            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Precio Venta</th>
              <td mat-cell *matCellDef="let item">{{ formatPrice(item.price_cents) }}</td>
            </ng-container>

            <ng-container matColumnDef="is_sellable">
              <th mat-header-cell *matHeaderCellDef>Vendible</th>
              <td mat-cell *matCellDef="let item">{{ item.is_sellable ? 'Sí' : 'No' }}</td>
            </ng-container>

            <ng-container matColumnDef="active">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let item">
                @if (item.active) {
                  <span class="status-badge" data-stock="ok">Activo</span>
                } @else {
                  <span class="inactive-badge">Inactivo</span>
                }
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let item" class="actions-cell">
                @if (item.active) {
                  <button mat-button color="primary" (click)="openMovementDialog(item)">
                    Stock
                  </button>
                  <button mat-button (click)="openEditDialog(item)">
                    Editar
                  </button>
                  <button mat-button color="warn" (click)="deactivateItem(item)">
                    Baja
                  </button>
                } @else {
                  <span class="text-muted">-</span>
                }
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns" [class.inactive-row]="!row.active"></tr>

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell empty-cell" [attr.colspan]="displayedColumns.length">
                No se encontraron ítems en el inventario.
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: `
    .inventory-container {
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
      align-items: center;
      gap: 2rem;
      margin-bottom: 1rem;
      padding: 1rem 1.25rem 0;
      flex-wrap: wrap;
    }
    .search-field {
      width: min(25rem, 100%);
    }
    .low-stock-check {
      margin-bottom: 1rem;
    }
    .table-panel {
      overflow: hidden;
    }
    .items-table {
      width: 100%;
    }
    .code-cell,
    .actions-cell {
      white-space: nowrap;
    }
    .low-stock-warning {
      color: var(--app-danger);
      font-weight: 600;
    }
    .low-stock-warning .status-badge {
      margin-left: 0.4rem;
    }
    .inactive-row {
      opacity: 0.6;
    }
    .inactive-badge {
      color: var(--app-text-subtle);
      font-size: 0.75rem;
      font-style: italic;
    }
    .empty-cell {
      padding: 2.5rem;
      color: var(--app-text-muted);
      text-align: center;
    }
    .text-muted {
      color: var(--app-text-subtle);
    }
  `,
})
export class ItemListComponent implements OnInit {
  items = signal<Item[]>([]);
  searchQuery = '';
  lowStockOnly = false;
  displayedColumns = [
    'code',
    'name',
    'type',
    'stock',
    'min_stock',
    'price',
    'is_sellable',
    'active',
    'actions',
  ];

  readonly typeLabels: Record<ItemType, string> = {
    part: 'Repuesto',
    supply: 'Insumo',
    accessory: 'Accesorio',
  };

  constructor(
    private readonly itemService: ItemService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.itemService
      .list({
        q: this.searchQuery ? this.searchQuery.trim() : undefined,
        lowStock: this.lowStockOnly || undefined,
      })
      .subscribe({
        next: (data) => this.items.set(data),
      });
  }

  onFilterChange(): void {
    this.loadItems();
  }

  getTypeLabel(type: string): string {
    return this.typeLabels[type as ItemType] || type;
  }

  formatPrice(cents: number): string {
    return formatCents(cents);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ItemFormComponent, {
      data: { mode: 'create' },
      width: '32rem',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.loadItems();
    });
  }

  openEditDialog(item: Item): void {
    const ref = this.dialog.open(ItemFormComponent, {
      data: { mode: 'edit', item },
      width: '32rem',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.loadItems();
    });
  }

  openMovementDialog(item: Item): void {
    const ref = this.dialog.open(StockMovementDialogComponent, {
      data: { item },
      width: '30rem',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.loadItems();
    });
  }

  deactivateItem(item: Item): void {
    if (confirm(`¿Confirma dar de baja lógica el ítem "${item.name}" (${item.code})?`)) {
      this.itemService.deactivate(item.id).subscribe({
        next: () => this.loadItems(),
      });
    }
  }
}

