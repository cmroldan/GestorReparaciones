import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ClientDetail } from '../../../../core/models/client.model';
import {
  Equipment,
  EquipmentType,
  EquipmentWithOrderCount,
} from '../../../../core/models/equipment.model';
import { ClientService } from '../../../../core/services/client.service';
import { EquipmentFormComponent } from '../../../equipments/components/equipment-form/equipment-form.component';
import { ClientFormComponent } from '../client-form/client-form.component';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  template: `
    <div class="client-detail-container">
      <div class="top-nav">
        <button mat-button routerLink="/clientes">
          <span aria-hidden="true">←</span> Volver a Clientes
        </button>
      </div>

      @if (client(); as c) {
        <mat-card class="client-card panel">
          <mat-card-header>
            <mat-card-title class="client-title">{{ c.first_name }} {{ c.last_name }}</mat-card-title>
            <mat-card-subtitle>Cliente #{{ c.id }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="client-info">
            <p><strong>Documento:</strong> {{ c.document || '-' }}</p>
            <p><strong>Teléfono:</strong> {{ c.phone || '-' }}</p>
            <p><strong>Correo Electrónico:</strong> {{ c.email || '-' }}</p>
            <p><strong>Dirección:</strong> {{ c.address || '-' }}</p>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button color="primary" (click)="editClient(c)">
              Editar Datos
            </button>
          </mat-card-actions>
        </mat-card>

        <div class="equipments-section">
          <div class="equipments-header">
            <div>
              <h2>Equipos Asociados</h2>
              <p class="page-subtitle">
                Equipos recibidos y cantidad de órdenes registradas.
              </p>
            </div>
            <button mat-flat-button color="primary" (click)="openCreateEquipmentDialog(c.id)">
              Nuevo Equipo
            </button>
          </div>

          <div class="panel table-panel">
            <div class="table-scroll">
              <table mat-table [dataSource]="c.equipments" class="equipment-table" aria-label="Equipos del cliente">
                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>Tipo</th>
                  <td mat-cell *matCellDef="let eq">{{ getTypeLabel(eq.type) }}</td>
                </ng-container>

                <ng-container matColumnDef="brand">
                  <th mat-header-cell *matHeaderCellDef>Marca</th>
                  <td mat-cell *matCellDef="let eq">{{ eq.brand }}</td>
                </ng-container>

                <ng-container matColumnDef="model">
                  <th mat-header-cell *matHeaderCellDef>Modelo</th>
                  <td mat-cell *matCellDef="let eq">{{ eq.model || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="serial_number">
                  <th mat-header-cell *matHeaderCellDef>Nº Serie</th>
                  <td mat-cell *matCellDef="let eq">{{ eq.serial_number || '-' }}</td>
                </ng-container>

                <ng-container matColumnDef="order_count">
                  <th mat-header-cell *matHeaderCellDef>Órdenes</th>
                  <td mat-cell *matCellDef="let eq">{{ eq.order_count }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let eq">
                    <button mat-button (click)="openEditEquipmentDialog(eq)">
                      Editar
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="equipmentColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: equipmentColumns"></tr>

                <tr class="mat-row" *matNoDataRow>
                  <td class="mat-cell empty-cell" [attr.colspan]="equipmentColumns.length">
                    No hay equipos registrados para este cliente.
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .client-detail-container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .top-nav {
      margin-bottom: 0.5rem;
    }
    .client-card {
      margin-bottom: 1.5rem;
      padding: 1.25rem 1.5rem;
    }
    .client-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
      gap: 0.5rem;
      padding-top: 1rem;
    }
    .client-info p {
      margin: 0;
      color: var(--app-text-muted);
      font-size: 0.85rem;
    }
    .client-info strong {
      color: var(--app-text);
      font-weight: 600;
    }
    .equipments-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .equipments-header h2 {
      margin: 0;
      color: var(--app-text);
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .page-subtitle {
      margin: 0.3rem 0 0;
      color: var(--app-text-muted);
      font-size: 0.8rem;
    }
    .table-panel {
      overflow: hidden;
    }
    .equipment-table {
      width: 100%;
    }
    .empty-cell {
      padding: 2.5rem;
      color: var(--app-text-muted);
      text-align: center;
    }
  `,
})
export class ClientDetailComponent implements OnInit {
  client = signal<ClientDetail | null>(null);
  clientId = 0;
  equipmentColumns = ['type', 'brand', 'model', 'serial_number', 'order_count', 'actions'];

  readonly typeLabels: Record<EquipmentType, string> = {
    notebook: 'Notebook',
    desktop: 'PC de Escritorio',
    printer: 'Impresora',
  };

  getTypeLabel(type: string): string {
    return this.typeLabels[type as EquipmentType] || type;
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly clientService: ClientService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.clientId = Number(idParam);
      this.loadClient();
    }
  }

  loadClient(): void {
    this.clientService.get(this.clientId).subscribe({
      next: (detail) => this.client.set(detail),
    });
  }

  editClient(client: ClientDetail): void {
    const ref = this.dialog.open(ClientFormComponent, {
      data: { mode: 'edit', client },
      width: '30rem',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.loadClient();
    });
  }

  openCreateEquipmentDialog(clientId: number): void {
    const ref = this.dialog.open(EquipmentFormComponent, {
      data: { mode: 'create', clientId },
      width: '30rem',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.loadClient();
    });
  }

  openEditEquipmentDialog(equipment: EquipmentWithOrderCount): void {
    const ref = this.dialog.open(EquipmentFormComponent, {
      data: { mode: 'edit', equipment },
      width: '30rem',
    });
    ref.afterClosed().subscribe((res) => {
      if (res) this.loadClient();
    });
  }
}
