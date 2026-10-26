import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import {
  OrderStatus,
  ServiceOrderDetail,
  ServiceOrderUpdate,
} from '../../../../core/models/service-order.model';
import { ItemService } from '../../../../core/services/item.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ServiceOrderService } from '../../../../core/services/service-order.service';
import { OrderDetailComponent } from './order-detail.component';

function buildOrder(overrides: Partial<ServiceOrderDetail> = {}): ServiceOrderDetail {
  return {
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
    status_history: [],
    work_logs: [],
    consumptions: [],
    ...overrides,
  };
}

describe('OrderDetailComponent', () => {
  let component: OrderDetailComponent;
  let fixture: any;
  let currentOrder: ServiceOrderDetail;
  let updateCalls: ServiceOrderUpdate[];
  let changeStatusCalls: Array<{ id: number; status: OrderStatus }>;

  const createComponent = async (): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '1' }) } },
        },
        {
          provide: ServiceOrderService,
          useValue: {
            get: () => of(currentOrder),
            update: (_id: number, payload: ServiceOrderUpdate) => {
              updateCalls.push(payload);
              return of(currentOrder);
            },
            changeStatus: (id: number, status: OrderStatus) => {
              changeStatusCalls.push({ id, status });
              return of(currentOrder);
            },
            addConsumption: () => of({}),
            addWorkLog: () => of({}),
          },
        },
        { provide: ItemService, useValue: { list: () => of([]) } },
        {
          provide: NotificationService,
          useValue: { success: () => {}, error: () => {} },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(() => {
    currentOrder = buildOrder();
    updateCalls = [];
    changeStatusCalls = [];
  });

  it('renders only the next statuses allowed by the state machine, and none when delivered', async () => {
    await createComponent();

    let buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.status-actions button'),
    ) as HTMLButtonElement[];
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent).toContain('En Diagnóstico');

    component.order.set(buildOrder({ status: 'entregado' }));
    fixture.detectChanges();

    buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.status-actions button'),
    ) as HTMLButtonElement[];
    expect(buttons.length).toBe(0);
  });

  it('calls changeStatus with the requested status', async () => {
    await createComponent();

    component.changeStatus('en_diagnostico');

    expect(changeStatusCalls).toEqual([{ id: 1, status: 'en_diagnostico' }]);
  });

  it('shows the consumption form only while the order is in repair', async () => {
    await createComponent();

    expect(fixture.nativeElement.querySelector('.add-consumption-box')).toBeNull();

    component.order.set(buildOrder({ status: 'en_reparacion' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.add-consumption-box')).not.toBeNull();
  });

  it('saves the budget as integer cents from the text input', async () => {
    await createComponent();
    component.budgetForm.patchValue({
      diagnosis: 'Fuente dañada',
      budgetAmount: '1.250,50',
      budgetDetail: 'Cambio de fuente',
    });

    component.saveBudget();

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toEqual({
      diagnosis: 'Fuente dañada',
      budget_amount_cents: 125050,
      budget_detail: 'Cambio de fuente',
    });
  });

  it('does not call update when the budget text is invalid', async () => {
    await createComponent();
    component.budgetForm.patchValue({ diagnosis: 'Revisión', budgetAmount: 'abc' });

    expect(component.budgetForm.invalid).toBe(true);
    component.saveBudget();

    expect(updateCalls).toHaveLength(0);
  });

  it('does not discard unsaved diagnosis text on a reload', async () => {
    await createComponent();
    component.budgetForm.patchValue({ diagnosis: 'Diagnóstico sin guardar' });
    component.budgetForm.markAsDirty();

    component.loadOrder();
    fixture.detectChanges();

    expect(component.budgetForm.get('diagnosis')?.value).toBe('Diagnóstico sin guardar');
  });
});
