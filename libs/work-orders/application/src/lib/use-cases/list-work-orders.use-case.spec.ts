import { ListWorkOrdersUseCase } from './list-work-orders.use-case';
import { WorkOrder, WorkOrderRepository, WorkOrderFilters } from '@ops-flow/work-orders/domain';

describe('ListWorkOrdersUseCase', () => {
  let useCase: ListWorkOrdersUseCase;
  let mockRepository: jasmine.SpyObj<WorkOrderRepository>;

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('WorkOrderRepository', [
      'findAll',
      'findById',
      'save',
      'delete'
    ]);
    useCase = new ListWorkOrdersUseCase();
    (useCase as any).repository = mockRepository;
  });

  it('should list all work orders without filters', async () => {
    const mockWorkOrders = [
      WorkOrder.create('Install HVAC', 'Replace air conditioning unit', 'client-1'),
      WorkOrder.create('Repair Plumbing', 'Fix leaky faucet', 'client-2')
    ];

    mockRepository.findAll.and.returnValue(Promise.resolve(mockWorkOrders));

    const result = await useCase.execute();

    expect(result).toEqual(mockWorkOrders);
    expect(result.length).toBe(2);
    expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
  });

  it('should list work orders with filters', async () => {
    const mockWorkOrders = [
      WorkOrder.create('Install HVAC', 'Replace air conditioning unit', 'client-1')
    ];

    mockRepository.findAll.and.returnValue(Promise.resolve(mockWorkOrders));

    const filters: WorkOrderFilters = { clientId: 'client-1' };
    const result = await useCase.execute(filters);

    expect(result).toEqual(mockWorkOrders);
    expect(mockRepository.findAll).toHaveBeenCalledWith(filters);
  });

  it('should return empty list when no work orders match', async () => {
    mockRepository.findAll.and.returnValue(Promise.resolve([]));

    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('should propagate repository errors', async () => {
    mockRepository.findAll.and.returnValue(Promise.reject(new Error('Database error')));

    await expectAsync(useCase.execute()).toBeRejectedWithError('Database error');
  });
});
