import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { Client } from '../../../../core/models/client.model';
import { Equipment } from '../../../../core/models/equipment.model';
import { ServiceOrder } from '../../../../core/models/service-order.model';
import { ClientService } from '../../../../core/services/client.service';
import { EquipmentService } from '../../../../core/services/equipment.service';
import {
  ServiceOrderFilters,
  ServiceOrderService,
} from '../../../../core/services/service-order.service';
import { OrderListComponent } from './order-list.component';

const client: Client = {
  id: 7,
  first_name: 'Ana',
  last_name: 'Pérez',
  document: null,
  phone: '3415551234',
  email: null,
  address: null,
  created_at: '2026-10-24T12:00:00Z',
  updated_at: '2026-10-24T12:00:00Z',
};

const equipment: Equipment = {
  id: 3,
  client_id: 7,
  type: 'notebook',
  brand: 'Lenovo',
  model: 'ThinkPad',
  serial_number: 'SN-1',
  notes: null,
  created_at: '2026-10-24T12:00:00Z',
};

const order: ServiceOrder = {
  id: 1,
  number: 'ORD-000001',
  client_id: 7,
  equipment_id: 3,
  reported_failure: 'No enciende',
  notes: null,
  entry_date: '2026-10-24T12:00:00Z',
  diagnosis: null,
  budget_amount_cents: null,
  budget_detail: null,
  status: 'ingresado',
  created_at: '2026-10-24T12:00:00Z',
  updated_at: '2026-10-24T12:00:00Z',
};

describe('OrderListComponent', () => {
  let listFilters: ServiceOrderFilters[];
  let equipmentRequests: number[];

  beforeEach(async () => {
    listFilters = [];
    equipmentRequests = [];

    await TestBed.configureTestingModule({
      imports: [OrderListComponent],
      providers: [
        {
          provide: ServiceOrderService,
          useValue: {
            list: (filters: ServiceOrderFilters) => {
              listFilters.push(filters);
              return of([order]);
            },
          },
        },
        { provide: ClientService, useValue: { list: () => of([client]) } },
        {
          provide: EquipmentService,
          useValue: {
            get: (id: number) => {
              equipmentRequests.push(id);
              return of({ ...equipment, id });
            },
          },
        },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(null) }) } },
        { provide: Router, useValue: { navigate: () => {} } },
      ],
    }).compileComponents();
  });

  it('filters by client id', async () => {
    const fixture = TestBed.createComponent(OrderListComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.clientId = 7;
    fixture.componentInstance.onFilterChange();

    expect(listFilters[listFilters.length - 1]).toEqual(
      expect.objectContaining({ clientId: 7 }),
    );
  });

  it('renders the client name and a readable equipment label instead of raw ids', async () => {
    const fixture = TestBed.createComponent(OrderListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('td[mat-cell]'),
    ) as HTMLElement[];

    expect(cells[2].textContent?.trim()).toBe('Ana Pérez');
    expect(cells[3].textContent).toContain('Lenovo');

    fixture.componentInstance.onFilterChange();
    expect(equipmentRequests.filter((id) => id === 3)).toHaveLength(1);
  });
});
