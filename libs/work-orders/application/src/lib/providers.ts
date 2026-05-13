// Work Orders Application Layer Providers
import { Provider } from '@angular/core';
import { InventoryRepository } from '@ops-flow/inventory/domain';
import { WorkOrderRepository } from '@ops-flow/work-orders/domain';
import { CreateWorkOrderUseCase } from './use-cases/create-work-order.use-case';
import { CompleteWorkOrderAndConsumePartsUseCase } from './use-cases/complete-work-order-and-consume-parts.use-case';
import { GetWorkOrderUseCase } from './use-cases/get-work-order.use-case';
import { ListWorkOrdersUseCase } from './use-cases/list-work-orders.use-case';
import { UpdateWorkOrderStatusUseCase } from './use-cases/update-work-order-status.use-case';

export function provideWorkOrderUseCases(): Provider[] {
  return [
    {
      provide: CreateWorkOrderUseCase,
      useFactory: (workOrderRepository: WorkOrderRepository) =>
        new CreateWorkOrderUseCase(workOrderRepository),
      deps: [WorkOrderRepository],
    },
    {
      provide: CompleteWorkOrderAndConsumePartsUseCase,
      useFactory: (
        workOrderRepository: WorkOrderRepository,
        inventoryRepository: InventoryRepository
      ) => new CompleteWorkOrderAndConsumePartsUseCase(workOrderRepository, inventoryRepository),
      deps: [WorkOrderRepository, InventoryRepository],
    },
    {
      provide: GetWorkOrderUseCase,
      useFactory: (workOrderRepository: WorkOrderRepository) =>
        new GetWorkOrderUseCase(workOrderRepository),
      deps: [WorkOrderRepository],
    },
    {
      provide: ListWorkOrdersUseCase,
      useFactory: (workOrderRepository: WorkOrderRepository) =>
        new ListWorkOrdersUseCase(workOrderRepository),
      deps: [WorkOrderRepository],
    },
    {
      provide: UpdateWorkOrderStatusUseCase,
      useFactory: (workOrderRepository: WorkOrderRepository) =>
        new UpdateWorkOrderStatusUseCase(workOrderRepository),
      deps: [WorkOrderRepository],
    },
  ];
}
