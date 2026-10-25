import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { Item } from '../../../../core/models/item.model';
import {
  OrderStatus,
  ServiceOrderDetail,
} from '../../../../core/models/service-order.model';
import { ItemService } from '../../../../core/services/item.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ServiceOrderService } from '../../../../core/services/service-order.service';
import { formatCents, parseCents } from '../../../../core/utils/money';
import {
  ORDER_STATUS_LABELS,
  nextStatuses,
} from '../../../../core/utils/order-status';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatIconModule,
  ],
  template: `
    <div class="order-detail-container">
      <div class="top-nav">
        <button mat-button routerLink="/ordenes">← Volver al Listado</button>
      </div>

      @if (order(); as o) {
        <mat-card class="order-header-card">
          <div class="order-header">
            <div>
              <h1>Orden {{ o.number || ('#' + o.id) }}</h1>
              <span class="status-badge" [attr.data-status]="o.status">
                {{ getStatusLabel(o.status) }}
              </span>
            </div>
            <div class="status-actions">
              @for (next of getAvailableNextStatuses(o.status); track next) {
                <button
                  mat-raised-button
                  color="accent"
                  (click)="changeStatus(next)"
                >
                  Avanzar a {{ getStatusLabel(next) }} →
                </button>
              }
            </div>
          </div>

          <div class="info-grid">
            <p><strong>Fecha de Ingreso:</strong> {{ o.entry_date | date: 'dd/MM/yyyy HH:mm' }}</p>
            <p><strong>ID Cliente:</strong> {{ o.client_id }}</p>
            <p><strong>ID Equipo:</strong> {{ o.equipment_id }}</p>
            <p class="full-width"><strong>Falla Declarada:</strong> {{ o.reported_failure }}</p>
            @if (o.notes) {
              <p class="full-width"><strong>Notas de Recepción:</strong> {{ o.notes }}</p>
            }
          </div>
        </mat-card>

        <div class="details-layout">
          <!-- Diagnóstico y Presupuesto -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>Diagnóstico y Presupuesto</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="budgetForm" class="budget-form">
                <mat-form-field appearance="outline">
                  <mat-label>Diagnóstico Técnico</mat-label>
                  <textarea
                    matInput
                    formControlName="diagnosis"
                    rows="3"
                    placeholder="Resultado de la revisión técnica..."
                  ></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Monto del Presupuesto ($)</mat-label>
                  <input
                    matInput
                    formControlName="budgetAmount"
                    placeholder="ej. 15.000,00"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Detalle del Presupuesto</mat-label>
                  <textarea
                    matInput
                    formControlName="budgetDetail"
                    rows="2"
                    placeholder="Mano de obra, repuestos necesarios, etc."
                  ></textarea>
                </mat-form-field>

                <button
                  mat-flat-button
                  color="primary"
                  [disabled]="budgetForm.invalid || o.status === 'entregado'"
                  (click)="saveBudget()"
                >
                  Guardar Diagnóstico y Presupuesto
                </button>
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Repuestos Consumidos -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>Repuestos Consumidos</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (o.status === 'en_reparacion') {
                <div class="add-consumption-box">
                  <mat-form-field appearance="outline" class="part-select">
                    <mat-label>Repuesto</mat-label>
                    <mat-select [(ngModel)]="selectedPartId">
                      @for (p of availableParts(); track p.id) {
                        <mat-option [value]="p.id">
                          {{ p.code }} - {{ p.name }} (Stock: {{ p.stock }})
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="part-qty">
                    <mat-label>Cant.</mat-label>
                    <input matInput type="number" min="1" [(ngModel)]="consumptionQuantity" />
                  </mat-form-field>

                  <button
                    mat-flat-button
                    color="primary"
                    [disabled]="!selectedPartId || consumptionQuantity <= 0"
                    (click)="addConsumption()"
                  >
                    Consumir
                  </button>
                </div>
              } @else {
                <p class="hint-text">
                  El consumo de repuestos de stock solo se permite en estado <em>En Reparación</em>.
                </p>
              }

              <table mat-table [dataSource]="o.consumptions" class="mat-elevation-z1 mini-table">
                <ng-container matColumnDef="code">
                  <th mat-header-cell *matHeaderCellDef>Código</th>
                  <td mat-cell *matCellDef="let c">{{ c.item_code }}</td>
                </ng-container>

                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Descripción</th>
                  <td mat-cell *matCellDef="let c">{{ c.item_name }}</td>
                </ng-container>

                <ng-container matColumnDef="quantity">
                  <th mat-header-cell *matHeaderCellDef>Cant.</th>
                  <td mat-cell *matCellDef="let c">{{ c.quantity }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="consumptionColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: consumptionColumns"></tr>

                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell empty-cell" [attr.colspan]="consumptionColumns.length">
                    No se han consumido repuestos en esta orden.
                  </td>
                </tr>
              </table>
            </mat-card-content>
          </mat-card>

          <!-- Notas Técnicas / Work Logs -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>Notas Técnicas</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (o.status !== 'entregado') {
                <div class="add-log-box">
                  <mat-form-field appearance="outline" class="log-input">
                    <mat-label>Nueva nota técnica...</mat-label>
                    <input matInput [(ngModel)]="newLogText" (keyup.enter)="addWorkLog()" />
                  </mat-form-field>
                  <button
                    mat-flat-button
                    color="primary"
                    [disabled]="!newLogText.trim()"
                    (click)="addWorkLog()"
                  >
                    Agregar
                  </button>
                </div>
              }

              <ul class="logs-list">
                @for (log of o.work_logs; track log.id) {
                  <li>
                    <span class="log-date">{{ log.created_at | date: 'dd/MM/yyyy HH:mm' }}</span>
                    <p class="log-desc">{{ log.description }}</p>
                  </li>
                } @empty {
                  <p class="empty-cell">Sin notas técnicas registradas.</p>
                }
              </ul>
            </mat-card-content>
          </mat-card>

          <!-- Historial de Estados -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>Historial de Estados</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="o.status_history" class="mat-elevation-z1 mini-table">
                <ng-container matColumnDef="from">
                  <th mat-header-cell *matHeaderCellDef>Estado Origen</th>
                  <td mat-cell *matCellDef="let h">
                    {{ h.from_status ? getStatusLabel(h.from_status) : '(Inicio)' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="to">
                  <th mat-header-cell *matHeaderCellDef>Estado Destino</th>
                  <td mat-cell *matCellDef="let h">{{ getStatusLabel(h.to_status) }}</td>
                </ng-container>

                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Fecha y Hora</th>
                  <td mat-cell *matCellDef="let h">{{ h.changed_at | date: 'dd/MM/yyyy HH:mm' }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="historyColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: historyColumns"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: `
    .order-detail-container {
      padding: 1.5rem;
      max-width: 80rem;
      margin: 0 auto;
    }
    .top-nav {
      margin-bottom: 1rem;
    }
    .order-header-card {
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .order-header h1 {
      margin: 0 0 0.5rem 0;
    }
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-weight: 500;
      font-size: 0.85rem;
      background: #e0e0e0;
    }
    .status-badge[data-status="ingresado"] { background: #e3f2fd; color: #0d47a1; }
    .status-badge[data-status="en_diagnostico"] { background: #fff8e1; color: #f57f17; }
    .status-badge[data-status="presupuestado"] { background: #f3e5f5; color: #4a148c; }
    .status-badge[data-status="en_reparacion"] { background: #e8f5e9; color: #1b5e20; }
    .status-badge[data-status="listo"] { background: #e0f2f1; color: #004d40; }
    .status-badge[data-status="entregado"] { background: #eeeeee; color: #424242; }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
      gap: 0.5rem;
    }
    .full-width {
      grid-column: 1 / -1;
    }
    .details-layout {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(28rem, 1fr));
      gap: 1.5rem;
    }
    .section-card {
      margin-bottom: 1rem;
    }
    .budget-form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 0.5rem;
    }
    .add-consumption-box, .add-log-box {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 1rem;
    }
    .part-select { flex: 1; }
    .part-qty { width: 6rem; }
    .log-input { flex: 1; }
    .mini-table {
      width: 100%;
    }
    .hint-text {
      color: #777;
      font-size: 0.9rem;
    }
    .logs-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .logs-list li {
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }
    .log-date {
      font-size: 0.8rem;
      color: #888;
    }
    .log-desc {
      margin: 0.25rem 0 0 0;
    }
    .empty-cell {
      padding: 1.5rem;
      text-align: center;
      color: #777;
    }
  `,
})
export class OrderDetailComponent implements OnInit {
  order = signal<ServiceOrderDetail | null>(null);
  orderId = 0;
  budgetForm: FormGroup;
  availableParts = signal<Item[]>([]);
  selectedPartId: number | null = null;
  consumptionQuantity = 1;
  newLogText = '';

  consumptionColumns = ['code', 'name', 'quantity'];
  historyColumns = ['from', 'to', 'date'];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly orderService: ServiceOrderService,
    private readonly itemService: ItemService,
    private readonly notificationService: NotificationService,
    private readonly fb: FormBuilder,
  ) {
    this.budgetForm = this.fb.group({
      diagnosis: [''],
      budgetAmount: [''],
      budgetDetail: [''],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.orderId = Number(idParam);
      this.loadOrder();
      this.loadParts();
    }
  }

  loadOrder(): void {
    this.orderService.get(this.orderId).subscribe({
      next: (data) => {
        this.order.set(data);
        this.budgetForm.patchValue({
          diagnosis: data.diagnosis ?? '',
          budgetAmount:
            data.budget_amount_cents !== null && data.budget_amount_cents !== undefined
              ? formatCents(data.budget_amount_cents).replace('$ ', '')
              : '',
          budgetDetail: data.budget_detail ?? '',
        });
      },
    });
  }

  loadParts(): void {
    this.itemService.list().subscribe({
      next: (items) => {
        this.availableParts.set(items.filter((i) => i.active && i.type === 'part'));
      },
    });
  }

  getStatusLabel(status: OrderStatus): string {
    return ORDER_STATUS_LABELS[status] || status;
  }

  getAvailableNextStatuses(status: OrderStatus): OrderStatus[] {
    return nextStatuses(status);
  }

  changeStatus(nextStatus: OrderStatus): void {
    this.orderService.changeStatus(this.orderId, nextStatus).subscribe({
      next: () => {
        this.notificationService.success(`Estado actualizado a ${this.getStatusLabel(nextStatus)}`);
        this.loadOrder();
      },
    });
  }

  saveBudget(): void {
    const val = this.budgetForm.value;
    const cents = val.budgetAmount ? parseCents(val.budgetAmount) : null;
    this.orderService
      .update(this.orderId, {
        diagnosis: val.diagnosis && val.diagnosis.trim() ? val.diagnosis.trim() : null,
        budget_amount_cents: cents,
        budget_detail: val.budgetDetail && val.budgetDetail.trim() ? val.budgetDetail.trim() : null,
      })
      .subscribe({
        next: () => {
          this.notificationService.success('Diagnóstico y presupuesto guardados');
          this.loadOrder();
        },
      });
  }

  addConsumption(): void {
    if (!this.selectedPartId || this.consumptionQuantity <= 0) return;
    this.orderService
      .addConsumption(this.orderId, this.selectedPartId, this.consumptionQuantity)
      .subscribe({
        next: () => {
          this.notificationService.success('Repuesto consumido correctamente');
          this.selectedPartId = null;
          this.consumptionQuantity = 1;
          this.loadOrder();
          this.loadParts();
        },
      });
  }

  addWorkLog(): void {
    if (!this.newLogText.trim()) return;
    this.orderService.addWorkLog(this.orderId, this.newLogText.trim()).subscribe({
      next: () => {
        this.newLogText = '';
        this.loadOrder();
      },
    });
  }
}
