import { Provider } from '@angular/core';
import { InventoryRepository } from '@ops-flow/inventory/domain';
import { ConfirmInventoryConsumptionUseCase } from './use-cases/confirm-inventory-consumption.use-case';
import { ListStockItemsUseCase } from './use-cases/list-stock-items.use-case';
import { ReserveInventoryPartsUseCase } from './use-cases/reserve-inventory-parts.use-case';

export function provideInventoryUseCases(): Provider[] {
  return [
    {
      provide: ListStockItemsUseCase,
      useFactory: (inventoryRepository: InventoryRepository) =>
        new ListStockItemsUseCase(inventoryRepository),
      deps: [InventoryRepository]
    },
    {
      provide: ReserveInventoryPartsUseCase,
      useFactory: (inventoryRepository: InventoryRepository) =>
        new ReserveInventoryPartsUseCase(inventoryRepository),
      deps: [InventoryRepository]
    },
    {
      provide: ConfirmInventoryConsumptionUseCase,
      useFactory: (inventoryRepository: InventoryRepository) =>
        new ConfirmInventoryConsumptionUseCase(inventoryRepository),
      deps: [InventoryRepository]
    }
  ];
}