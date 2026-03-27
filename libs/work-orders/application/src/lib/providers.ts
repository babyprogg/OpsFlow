// Work Orders Application Layer Providers
import { Provider } from '@angular/core';
import { CreateWorkOrderUseCase } from './use-cases/create-work-order.use-case';
import { GetWorkOrderUseCase } from './use-cases/get-work-order.use-case';
import { ListWorkOrdersUseCase } from './use-cases/list-work-orders.use-case';
import { UpdateWorkOrderStatusUseCase } from './use-cases/update-work-order-status.use-case';

export function provideWorkOrderUseCases(): Provider[] {
  return [
    CreateWorkOrderUseCase,
    GetWorkOrderUseCase,
    ListWorkOrdersUseCase,
    UpdateWorkOrderStatusUseCase
  ];
}
