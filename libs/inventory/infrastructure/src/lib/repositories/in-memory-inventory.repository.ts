import { Injectable } from '@angular/core';
import { InventoryRepository, StockItem } from '@ops-flow/inventory/domain';

@Injectable()
export class InMemoryInventoryRepository implements InventoryRepository {
  private stockItems: StockItem[] = [
    new StockItem('stock-1', 'FILTER-100', 'HVAC Filter', 12, 0, 0, [], new Date(), new Date()),
    new StockItem('stock-2', 'BELT-200', 'Drive Belt', 6, 0, 0, [], new Date(), new Date()),
    new StockItem('stock-3', 'COOLANT-300', 'Coolant', 10, 0, 0, [], new Date(), new Date())
  ];

  async findById(id: string): Promise<StockItem | null> {
    return this.stockItems.find(stockItem => stockItem.id === id) ?? null;
  }

  async findAll(): Promise<StockItem[]> {
    return [...this.stockItems];
  }

  async save(stockItem: StockItem): Promise<void> {
    const existingIndex = this.stockItems.findIndex(item => item.id === stockItem.id);
    if (existingIndex === -1) {
      this.stockItems = [...this.stockItems, stockItem];
      return;
    }

    this.stockItems = this.stockItems.map(item => item.id === stockItem.id ? stockItem : item);
  }
}