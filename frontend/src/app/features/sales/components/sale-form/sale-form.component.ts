import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { Item } from '../../../../core/models/item.model';
import { SaleCreate } from '../../../../core/models/sale.model';
import { ItemService } from '../../../../core/services/item.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SaleService } from '../../../../core/services/sale.service';
import { formatCents } from '../../../../core/utils/money';

export interface CartLine {
  item_id: number;
  item_name: string;
  price_cents: number;
  quantity: number;
}

@Component({
  selector: 'app-sale-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
    RouterModule,
  ],
  template: `
    <div class="sale-form-container">
      <div class="header-nav page-toolbar">
        <div>
          <h2>Punto de venta</h2>
          <p class="page-subtitle">
            Registrá la venta de insumos y accesorios con stock disponible.
          </p>
        </div>
        <a mat-button color="primary" routerLink="/ventas/historial">
          Ver Historial de Ventas →
        </a>
      </div>

      <mat-card class="add-item-card panel">
        <mat-card-content>
          <div class="selection-row">
            <mat-form-field appearance="outline" class="item-select">
              <mat-label>Seleccionar Insumo o Accesorio</mat-label>
              <mat-select [(ngModel)]="selectedItemId">
                @for (item of sellableItems(); track item.id) {
                  <mat-option [value]="item.id">
                    {{ item.code }} - {{ item.name }} (Stock: {{ item.stock }} | {{ formatPrice(item.price_cents) }})
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="qty-field">
              <mat-label>Cantidad</mat-label>
              <input matInput type="number" min="1" [(ngModel)]="selectedQuantity" />
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              [disabled]="!selectedItemId || selectedQuantity <= 0"
              (click)="addToCart()"
            >
              Agregar al Carrito
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="cart-card panel">
        <mat-card-header>
          <mat-card-title>Detalle de la Venta</mat-card-title>
          <mat-card-subtitle>
            El total se calcula sobre los precios unitarios del catálogo.
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="table-scroll">
            <table mat-table [dataSource]="cart" class="cart-table" aria-label="Detalle de la venta">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Producto</th>
                <td mat-cell *matCellDef="let line">{{ line.item_name }}</td>
              </ng-container>

              <ng-container matColumnDef="unit_price">
                <th mat-header-cell *matHeaderCellDef>Precio Unitario</th>
                <td mat-cell *matCellDef="let line">{{ formatPrice(line.price_cents) }}</td>
              </ng-container>

              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Cantidad</th>
                <td mat-cell *matCellDef="let line">{{ line.quantity }}</td>
              </ng-container>

              <ng-container matColumnDef="subtotal">
                <th mat-header-cell *matHeaderCellDef>Subtotal</th>
                <td mat-cell *matCellDef="let line">
                  {{ formatPrice(line.price_cents * line.quantity) }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>
                  <span class="visually-hidden">Acciones</span>
                </th>
                <td mat-cell *matCellDef="let line; let i = index">
                  <button
                    mat-icon-button
                    color="warn"
                    aria-label="Quitar producto del carrito"
                    (click)="removeFromCart(i)"
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="cartColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: cartColumns"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell empty-cell" [attr.colspan]="cartColumns.length">
                  El carrito de venta está vacío.
                </td>
              </tr>
            </table>
          </div>

          <div class="cart-summary">
            <div class="total-box">
              <span>Total Estimado:</span>
              <strong class="total-amount">{{ formatPrice(estimatedTotalCents()) }}</strong>
            </div>

            <button
              mat-flat-button
              color="primary"
              class="confirm-button"
              [disabled]="!canSubmit() || submitting"
              (click)="submit()"
            >
              Confirmar Venta
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .sale-form-container {
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
    .add-item-card {
      margin-bottom: 1rem;
      padding: 1.25rem 1.5rem 0.5rem;
    }
    .selection-row {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      padding-top: 0.5rem;
    }
    .item-select {
      flex: 1;
      min-width: min(20rem, 100%);
    }
    .qty-field {
      width: 7rem;
    }
    .cart-card {
      margin-bottom: 0;
      padding: 1.25rem 1.5rem 1.5rem;
    }
    .cart-table {
      width: 100%;
      margin-top: 1rem;
    }
    .cart-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--app-border);
    }
    .total-box {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      color: var(--app-text-muted);
      font-size: 0.95rem;
    }
    .total-amount {
      color: var(--app-success);
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .confirm-button {
      font-size: 0.95rem;
      padding: 0.75rem 2rem;
    }
    .empty-cell {
      padding: 2.5rem;
      color: var(--app-text-muted);
      text-align: center;
    }
  `,
})
export class SaleFormComponent implements OnInit {
  sellableItems = signal<Item[]>([]);
  cart: CartLine[] = [];
  selectedItemId: number | null = null;
  selectedQuantity = 1;
  submitting = false;

  cartColumns = ['name', 'unit_price', 'quantity', 'subtotal', 'actions'];

  constructor(
    private readonly saleService: SaleService,
    private readonly itemService: ItemService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.loadSellableItems();
  }

  loadSellableItems(): void {
    this.itemService.list().subscribe({
      next: (items) => {
        this.sellableItems.set(items.filter((i) => i.active && i.is_sellable));
      },
    });
  }

  formatPrice(cents: number): string {
    return formatCents(cents);
  }

  addToCart(): void {
    if (!this.selectedItemId || this.selectedQuantity <= 0) return;
    const item = this.sellableItems().find((i) => i.id === this.selectedItemId);
    if (!item) return;

    const existing = this.cart.find((l) => l.item_id === item.id);
    if (existing) {
      existing.quantity += this.selectedQuantity;
    } else {
      this.cart = [
        ...this.cart,
        {
          item_id: item.id,
          item_name: item.name,
          price_cents: item.price_cents,
          quantity: this.selectedQuantity,
        },
      ];
    }
    this.selectedItemId = null;
    this.selectedQuantity = 1;
  }

  removeFromCart(index: number): void {
    this.cart = this.cart.filter((_, i) => i !== index);
  }

  estimatedTotalCents(): number {
    return this.cart.reduce((sum, line) => sum + line.price_cents * line.quantity, 0);
  }

  canSubmit(): boolean {
    return this.cart.length > 0 && this.cart.every((line) => line.quantity > 0);
  }

  submit(): void {
    if (this.submitting || !this.canSubmit()) return;
    this.submitting = true;

    // Solo se envían item_id y quantity, el backend calcula el total.
    const payload: SaleCreate = {
      items: this.cart.map((line) => ({
        item_id: line.item_id,
        quantity: line.quantity,
      })),
    };

    this.saleService
      .create(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (sale) => {
          this.notificationService.success(
            `Venta #${sale.id} confirmada. Total: ${formatCents(sale.total_cents)}`,
          );
          this.cart = [];
          this.loadSellableItems();
        },
      });
  }
}
