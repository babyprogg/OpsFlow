import { StockItem } from '../entities/stock-item.entity';

export abstract class InventoryRepository {
  abstract findById(id: string): Promise<StockItem | null>;
  abstract findAll(): Promise<StockItem[]>;
  abstract save(stockItem: StockItem): Promise<void>;
}