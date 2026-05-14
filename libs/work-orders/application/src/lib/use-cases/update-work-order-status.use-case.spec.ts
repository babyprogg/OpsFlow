import { UpdateWorkOrderStatusUseCase } from './update-work-order-status.use-case';
import { WorkOrder, WorkOrderRepository } from '@ops-flow/work-orders/domain';

describe('UpdateWorkOrderStatusUseCase', () => {
  let useCase: UpdateWorkOrderStatusUseCase;
  let mockRepository: jasmine.SpyObj<WorkOrderRepository>;

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('WorkOrderRepository', [
      'findById',
      'save',
      'findAll',
      'delete'
    ]);
    mockRepository.save.and.returnValue(Promise.resolve());

    useCase = new UpdateWorkOrderStatusUseCase();
    (useCase as any).repository = mockRepository;
  });

  it('should schedule a work order', async () => {
    const workOrder = WorkOrder.create('Install HVAC', 'Replace AC unit', 'client-1');
    mockRepository.findById.and.returnValue(Promise.resolve(workOrder));

    const scheduledDate = new Date();
    const result = await useCase.execute({
      id: workOrder.id,
      action: 'schedule',
      scheduledDate,
      assignedTo: 'tech-1'
    });

    expect(result).toBeDefined();
    expect(mockRepository.findById).toHaveBeenCalledWith(workOrder.id);
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should start a work order', async () => {
    const workOrder = WorkOrder.create('Install HVAC', 'Replace AC unit', 'client-1');
    mockRepository.findById.and.returnValue(Promise.resolve(workOrder));

    const result = await useCase.execute({
      id: workOrder.id,
      action: 'start'
    });

    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should complete a work order', async () => {
    const workOrder = WorkOrder.create('Install HVAC', 'Replace AC unit', 'client-1');
    mockRepository.findById.and.returnValue(Promise.resolve(workOrder));

    const result = await useCase.execute({
      id: workOrder.id,
      action: 'complete'
    });

    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should cancel a work order', async () => {
    const workOrder = WorkOrder.create('Install HVAC', 'Replace AC unit', 'client-1');
    mockRepository.findById.and.returnValue(Promise.resolve(workOrder));

    const result = await useCase.execute({
      id: workOrder.id,
      action: 'cancel',
      cancelReason: 'Customer cancelled'
    });

    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should throw error when work order not found', async () => {
    mockRepository.findById.and.returnValue(Promise.resolve(null));

    await expectAsync(
      useCase.execute({
        id: 'non-existent-id',
        action: 'start'
      })
    ).toBeRejectedWithError(/Work order not found/);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw error when scheduling without required fields', async () => {
    const workOrder = WorkOrder.create('Install HVAC', 'Replace AC unit', 'client-1');
    mockRepository.findById.and.returnValue(Promise.resolve(workOrder));

    await expectAsync(
      useCase.execute({
        id: workOrder.id,
        action: 'schedule'
        // Missing scheduledDate and assignedTo
      })
    ).toBeRejectedWithError(/Scheduled date and assignee are required/);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw error on unknown action', async () => {
    const workOrder = WorkOrder.create('Install HVAC', 'Replace AC unit', 'client-1');
    mockRepository.findById.and.returnValue(Promise.resolve(workOrder));

    await expectAsync(
      useCase.execute({
        id: workOrder.id,
        action: 'invalid' as any
      })
    ).toBeRejectedWithError(/Unknown action/);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
