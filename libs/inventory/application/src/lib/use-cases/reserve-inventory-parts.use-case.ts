import { InventoryRepository, StockItem } from '@ops-flow/inventory/domain';

export interface InventoryPartCommand {
  stockItemId: string;
  quantity: number;
}

export interface ReserveInventoryPartsCommand {
  workOrderId: string;
  parts: InventoryPartCommand[];
}

export class ReserveInventoryPartsUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(command: ReserveInventoryPartsCommand): Promise<StockItem[]> {
    if (command.parts.length === 0) {
      return [];
    }

    const originals = new Map<string, StockItem>();
    const reservedItems: StockItem[] = [];

    for (const part of command.parts) {
      const stockItem = await this.inventoryRepository.findById(part.stockItemId);
      if (!stockItem) {
        throw new Error(`Stock item not found: ${part.stockItemId}`);
      }

      originals.set(stockItem.id, stockItem);
      reservedItems.push(stockItem.reserve(part.quantity, command.workOrderId));
    }

    try {
      for (const stockItem of reservedItems) {
        await this.inventoryRepository.save(stockItem);
      }
      return reservedItems;
    } catch (error) {
      await this.rollback(originals, reservedItems);
      throw error;
    }
  }

  private async rollback(originals: Map<string, StockItem>, affectedItems: StockItem[]): Promise<void> {
    for (const item of [...affectedItems].reverse()) {
      const original = originals.get(item.id);
      if (original) {
        await this.inventoryRepository.save(original);
      }
    }
  }
}