import { Provider } from '@angular/core';
import { InventoryRepository } from '@ops-flow/inventory/domain';
import { InMemoryInventoryRepository } from './repositories/in-memory-inventory.repository';

export function provideInventoryRepositories(): Provider[] {
  return [
    {
      provide: InventoryRepository,
      useClass: InMemoryInventoryRepository
    }
  ];
}