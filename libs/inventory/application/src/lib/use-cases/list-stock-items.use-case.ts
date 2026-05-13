import { InventoryRepository, StockItem } from '@ops-flow/inventory/domain';

export class ListStockItemsUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(): Promise<StockItem[]> {
    return this.inventoryRepository.findAll();
  }
}