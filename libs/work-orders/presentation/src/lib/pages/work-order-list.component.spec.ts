import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkOrderListComponent } from './work-order-list.component';
import { WorkOrderStore } from '@ops-flow/work-orders/infrastructure';
import { signal } from '@angular/core';
import { WorkOrder, WorkOrderStatus } from '@ops-flow/work-orders/domain';

describe('WorkOrderListComponent', () => {
  let component: WorkOrderListComponent;
  let fixture: ComponentFixture<WorkOrderListComponent>;
  let mockStore: any;

  const mockWorkOrder1 = new WorkOrder(
    'wo-1',
    'Fix HVAC',
    'Replace air filter',
    'client-1',
    null,
    WorkOrderStatus.Draft,
    null,
    null,
    new Date(),
    new Date()
  );

  const mockWorkOrder2 = new WorkOrder(
    'wo-2',
    'Install Security System',
    'Install cameras and sensors',
    'client-2',
    'tech-1',
    WorkOrderStatus.Scheduled,
    new Date(),
    null,
    new Date(),
    new Date()
  );

  beforeEach(async () => {
    mockStore = {
      workOrders: signal([mockWorkOrder1, mockWorkOrder2]),
      selectedId: signal(null),
      loading: signal(false),
      error: signal(null),
      selectedWorkOrder: signal(null),
      draftWorkOrders: signal([mockWorkOrder1]),
      scheduledWorkOrders: signal([mockWorkOrder2]),
      inProgressWorkOrders: signal([]),
      completedWorkOrders: signal([]),
      loadWorkOrders: jest.fn(),
      selectWorkOrder: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [WorkOrderListComponent],
      providers: [
        { provide: WorkOrderStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkOrderListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load work orders on init', () => {
    fixture.detectChanges();
    expect(mockStore.loadWorkOrders).toHaveBeenCalled();
  });

  it('should display loading state', () => {
    mockStore.loading = signal(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.loading')?.textContent).toContain('Loading work orders');
  });

  it('should display work orders after loading', () => {
    mockStore.loading = signal(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.work-order-card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Fix HVAC');
    expect(cards[1].textContent).toContain('Install Security System');
  });

  it('should display error message on failure', () => {
    mockStore.loading = signal(false);
    mockStore.error = signal('Failed to load work orders');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error')?.textContent).toContain('Failed to load work orders');
  });
});
