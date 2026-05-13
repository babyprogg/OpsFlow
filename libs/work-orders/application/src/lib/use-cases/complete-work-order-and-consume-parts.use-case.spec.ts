import { InventoryRepository, StockItem } from '../../../../../inventory/domain/src';
import { WorkOrder, WorkOrderRepository, WorkOrderStatus } from '../../../../domain/src';
import { CompleteWorkOrderAndConsumePartsUseCase } from './complete-work-order-and-consume-parts.use-case';

describe('CompleteWorkOrderAndConsumePartsUseCase', () => {
  it('should complete work order and consume parts when stock is sufficient', async () => {
    const workOrder = new WorkOrder(
      'work-order-1',
      'Fix HVAC',
      'Replace filter and verify airflow',
      'client-1',
      'tech-1',
      WorkOrderStatus.InProgress,
      new Date(),
      null,
      new Date(),
      new Date()
    );
    const stockItem = StockItem.create('FILTER-100', 'HVAC Filter', 4);

    const workOrderRepository: jest.Mocked<WorkOrderRepository> = {
      findById: jest.fn().mockResolvedValue(workOrder),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<WorkOrderRepository>;

    const inventoryRepository: jest.Mocked<InventoryRepository> = {
      findById: jest.fn().mockResolvedValue(stockItem),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<InventoryRepository>;

    const useCase = new CompleteWorkOrderAndConsumePartsUseCase(workOrderRepository, inventoryRepository);

    const result = await useCase.execute({
      workOrderId: 'work-order-1',
      parts: [{ stockItemId: stockItem.id, quantity: 2 }]
    });

    expect(result.workOrder.status).toBe(WorkOrderStatus.Completed);
    expect(result.stockItems[0].reservedQty).toBe(0);
    expect(result.stockItems[0].consumedQty).toBe(2);
    expect(workOrderRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: WorkOrderStatus.Completed }));
  });

  it('should fail when stock is insufficient', async () => {
    const workOrder = new WorkOrder(
      'work-order-1',
      'Fix HVAC',
      'Replace filter and verify airflow',
      'client-1',
      'tech-1',
      WorkOrderStatus.InProgress,
      new Date(),
      null,
      new Date(),
      new Date()
    );
    const stockItem = StockItem.create('FILTER-100', 'HVAC Filter', 1);

    const workOrderRepository: jest.Mocked<WorkOrderRepository> = {
      findById: jest.fn().mockResolvedValue(workOrder),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<WorkOrderRepository>;

    const inventoryRepository: jest.Mocked<InventoryRepository> = {
      findById: jest.fn().mockResolvedValue(stockItem),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<InventoryRepository>;

    const useCase = new CompleteWorkOrderAndConsumePartsUseCase(workOrderRepository, inventoryRepository);

    await expect(
      useCase.execute({
        workOrderId: 'work-order-1',
        parts: [{ stockItemId: stockItem.id, quantity: 2 }]
      })
    ).rejects.toThrow('Insufficient stock for FILTER-100');

    expect(workOrderRepository.save).not.toHaveBeenCalled();
    expect(inventoryRepository.save).not.toHaveBeenCalled();
  });

  it('should roll back inventory if work order persistence fails after consumption', async () => {
    const workOrder = new WorkOrder(
      'work-order-1',
      'Fix HVAC',
      'Replace filter and verify airflow',
      'client-1',
      'tech-1',
      WorkOrderStatus.InProgress,
      new Date(),
      null,
      new Date(),
      new Date()
    );
    const stockItem = StockItem.create('FILTER-100', 'HVAC Filter', 4);

    const workOrderRepository: jest.Mocked<WorkOrderRepository> = {
      findById: jest.fn().mockResolvedValue(workOrder),
      findAll: jest.fn(),
      save: jest.fn().mockRejectedValue(new Error('Work order storage unavailable')),
      delete: jest.fn()
    } as jest.Mocked<WorkOrderRepository>;

    const savedItems: StockItem[] = [];
    const inventoryRepository: jest.Mocked<InventoryRepository> = {
      findById: jest.fn().mockResolvedValue(stockItem),
      findAll: jest.fn(),
      save: jest.fn(async (item: StockItem) => {
        savedItems.push(item);
      }),
      delete: jest.fn()
    } as jest.Mocked<InventoryRepository>;

    const useCase = new CompleteWorkOrderAndConsumePartsUseCase(workOrderRepository, inventoryRepository);

    await expect(
      useCase.execute({
        workOrderId: 'work-order-1',
        parts: [{ stockItemId: stockItem.id, quantity: 2 }]
      })
    ).rejects.toThrow('Work order storage unavailable');

    expect(savedItems.at(-1)?.reservedQty).toBe(0);
    expect(savedItems.at(-1)?.consumedQty).toBe(0);
  });
});