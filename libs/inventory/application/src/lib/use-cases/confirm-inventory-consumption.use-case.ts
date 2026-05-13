import { InventoryRepository, StockItem } from '@ops-flow/inventory/domain';
import { InventoryPartCommand } from './reserve-inventory-parts.use-case';

export interface ConfirmInventoryConsumptionCommand {
  workOrderId: string;
  parts: InventoryPartCommand[];
}

export class ConfirmInventoryConsumptionUseCase {
  constructor(private readonly inventoryRepository: InventoryRepository) {}

  async execute(command: ConfirmInventoryConsumptionCommand): Promise<StockItem[]> {
    if (command.parts.length === 0) {
      return [];
    }

    const originals = new Map<string, StockItem>();
    const consumedItems: StockItem[] = [];

    for (const part of command.parts) {
      const stockItem = await this.inventoryRepository.findById(part.stockItemId);
      if (!stockItem) {
        throw new Error(`Stock item not found: ${part.stockItemId}`);
      }

      originals.set(stockItem.id, stockItem);
      consumedItems.push(stockItem.confirmConsumption(part.quantity, command.workOrderId));
    }

    try {
      for (const stockItem of consumedItems) {
        await this.inventoryRepository.save(stockItem);
      }
      return consumedItems;
    } catch (error) {
      await this.rollback(originals, consumedItems);
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