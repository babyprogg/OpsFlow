import { InventoryRepository, StockItem } from '@ops-flow/inventory/domain';
import { ReserveInventoryPartsUseCase } from './reserve-inventory-parts.use-case';

describe('ReserveInventoryPartsUseCase', () => {
  it('should roll back reserved stock when a save fails mid-flight', async () => {
    const firstOriginal = StockItem.create('FILTER-100', 'HVAC Filter', 5);
    const secondOriginal = StockItem.create('BELT-200', 'Drive Belt', 5);
    const savedStates: StockItem[] = [];

    const repository: jest.Mocked<InventoryRepository> = {
      findById: jest.fn(async (id: string) => {
        if (id === firstOriginal.id) {
          return firstOriginal;
        }
        if (id === secondOriginal.id) {
          return secondOriginal;
        }
        return null;
      }),
      findAll: jest.fn(),
      save: jest.fn(async (stockItem: StockItem) => {
        savedStates.push(stockItem);
        if (savedStates.length === 1) {
          return;
        }
        throw new Error('Storage unavailable');
      })
    } as jest.Mocked<InventoryRepository>;

    const useCase = new ReserveInventoryPartsUseCase(repository);

    await expect(
      useCase.execute({
        workOrderId: 'work-order-1',
        parts: [
          { stockItemId: firstOriginal.id, quantity: 2 },
          { stockItemId: secondOriginal.id, quantity: 1 }
        ]
      })
    ).rejects.toThrow('Storage unavailable');

    expect(repository.save).toHaveBeenCalledTimes(3);
    expect(savedStates[0].reservedQty).toBe(2);
    expect(savedStates[1].reservedQty).toBe(1);
    expect(savedStates[2].reservedQty).toBe(0);
    expect(savedStates[2].consumedQty).toBe(0);
  });
});