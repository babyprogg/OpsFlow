import { InventoryRepository, StockItem } from '../../../../../inventory/domain/src';
import { WorkOrder, WorkOrderRepository } from '../../../../domain/src';

export interface WorkOrderPartConsumption {
  stockItemId: string;
  quantity: number;
}

export interface CompleteWorkOrderAndConsumePartsCommand {
  workOrderId: string;
  parts: WorkOrderPartConsumption[];
}

export interface CompleteWorkOrderAndConsumePartsResult {
  workOrder: WorkOrder;
  stockItems: StockItem[];
}

export class CompleteWorkOrderAndConsumePartsUseCase {
  constructor(
    private readonly workOrderRepository: WorkOrderRepository,
    private readonly inventoryRepository: InventoryRepository
  ) {}

  async execute(command: CompleteWorkOrderAndConsumePartsCommand): Promise<CompleteWorkOrderAndConsumePartsResult> {
    const workOrder = await this.workOrderRepository.findById(command.workOrderId);
    if (!workOrder) {
      throw new Error(`Work order not found: ${command.workOrderId}`);
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
    } catch (error) {
      await this.rollbackInventory(originals, reservedItems);
      throw error;
    }

    const completedWorkOrder = workOrder.complete();
    const consumedItems = reservedItems.map((stockItem, index) =>
      stockItem.confirmConsumption(command.parts[index].quantity, command.workOrderId)
    );

    try {
      for (const stockItem of consumedItems) {
        await this.inventoryRepository.save(stockItem);
      }
    } catch (error) {
      await this.rollbackInventory(originals, consumedItems);
      throw error;
    }

    try {
      await this.workOrderRepository.save(completedWorkOrder);
    } catch (error) {
      await this.rollbackInventory(originals, consumedItems);
      throw error;
    }

    return {
      workOrder: completedWorkOrder,
      stockItems: consumedItems
    };
  }

  private async rollbackInventory(originals: Map<string, StockItem>, affectedItems: StockItem[]): Promise<void> {
    for (const item of [...affectedItems].reverse()) {
      const original = originals.get(item.id);
      if (original) {
        await this.inventoryRepository.save(original);
      }
    }
  }
}