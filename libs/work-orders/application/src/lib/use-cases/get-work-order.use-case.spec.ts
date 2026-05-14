import { GetWorkOrderUseCase } from './get-work-order.use-case';
import { WorkOrder, WorkOrderRepository, WorkOrderStatus } from '@ops-flow/work-orders/domain';

describe('GetWorkOrderUseCase', () => {
  let useCase: GetWorkOrderUseCase;
  let mockRepository: jasmine.SpyObj<WorkOrderRepository>;

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('WorkOrderRepository', [
      'findById',
      'findAll',
      'save',
      'delete'
    ]);
    useCase = new GetWorkOrderUseCase();
    (useCase as any).repository = mockRepository;
  });

  it('should retrieve a work order by id', async () => {
    const mockWorkOrder = WorkOrder.create(
      'Install HVAC',
      'Replace air conditioning unit',
      'client-1'
    );

    mockRepository.findById.and.returnValue(Promise.resolve(mockWorkOrder));

    const result = await useCase.execute(mockWorkOrder.id);

    expect(result).toEqual(mockWorkOrder);
    expect(mockRepository.findById).toHaveBeenCalledWith(mockWorkOrder.id);
  });

  it('should return null when work order is not found', async () => {
    mockRepository.findById.and.returnValue(Promise.resolve(null));

    const result = await useCase.execute('non-existent-id');

    expect(result).toBeNull();
    expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
  });

  it('should propagate repository errors', async () => {
    mockRepository.findById.and.returnValue(Promise.reject(new Error('Database error')));

    await expectAsync(useCase.execute('wo-1')).toBeRejectedWithError('Database error');
  });
});
