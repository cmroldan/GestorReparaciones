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
      <div class="header">
        <h1>Inventario de Repuestos y Productos</h1>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          Nuevo Ítem
        </button>
      </div>

      <div class="filters-bar">
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

      <table mat-table [dataSource]="items()" class="mat-elevation-z1 items-table">
        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef>Código</th>
          <td mat-cell *matCellDef="let item">{{ item.code }}</td>
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
              <span class="badge-low">¡Bajo!</span>
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
            <span [class.inactive-badge]="!item.active">
              {{ item.active ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Acciones</th>
          <td mat-cell *matCellDef="let item">
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
  `,
  styles: `
    .inventory-container {
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
      align-items: center;
      gap: 2rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .search-field {
      width: 25rem;
    }
    .low-stock-check {
      margin-bottom: 1rem;
    }
    .items-table {
      width: 100%;
    }
    .low-stock-warning {
      color: #b3261e;
      font-weight: bold;
    }
    .badge-low {
      background: #f9dedc;
      color: #8c1d18;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      margin-left: 0.25rem;
    }
    .inactive-row {
      opacity: 0.6;
      background: #fbfbfb;
    }
    .inactive-badge {
      color: #777;
      font-style: italic;
    }
    .empty-cell {
      padding: 2rem;
      text-align: center;
      color: #666;
    }
    .text-muted {
      color: #999;
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
