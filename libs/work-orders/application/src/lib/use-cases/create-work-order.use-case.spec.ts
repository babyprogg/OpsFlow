import { CreateWorkOrderUseCase } from './create-work-order.use-case';
import { WorkOrder, WorkOrderRepository, WorkOrderStatus } from '@ops-flow/work-orders/domain';

describe('CreateWorkOrderUseCase', () => {
  let useCase: CreateWorkOrderUseCase;
  let mockRepository: jest.Mocked<WorkOrderRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<WorkOrderRepository>;

    mockRepository.save.mockResolvedValue(undefined);

    useCase = new CreateWorkOrderUseCase();
    (useCase as any).repository = mockRepository;
  });

  it('should create and persist a new work order', async () => {
    const result = await useCase.execute({
      title: 'Install HVAC',
      description: 'Replace air conditioning unit',
      clientId: 'client-1'
    });

    expect(result).toBeInstanceOf(WorkOrder);
    expect(result.title).toBe('Install HVAC');
    expect(result.description).toBe('Replace air conditioning unit');
    expect(result.clientId).toBe('client-1');
    expect(result.status).toBe(WorkOrderStatus.Open);
    expect(mockRepository.save).toHaveBeenCalledWith(result);
  });

  it('should throw error when repository save fails', async () => {
    mockRepository.save.mockRejectedValue(new Error('Database error'));

    await expect(
      useCase.execute({
        title: 'Install HVAC',
        description: 'Replace air conditioning unit',
        clientId: 'client-1'
      })
    ).rejects.toThrow('Database error');
  });

  it('should generate unique IDs for each created work order', async () => {
    const result1 = await useCase.execute({
      title: 'Install HVAC',
      description: 'Replace air conditioning unit',
      clientId: 'client-1'
    });

    const result2 = await useCase.execute({
      title: 'Repair Plumbing',
      description: 'Fix leaky faucet',
      clientId: 'client-1'
    });

    expect(result1.id).not.toBe(result2.id);
  });

  it('should propagate domain validation errors', async () => {
    await expect(
      useCase.execute({
        title: '',
        description: 'Replace air conditioning unit',
        clientId: 'client-1'
      })
    ).rejects.toThrow();

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
