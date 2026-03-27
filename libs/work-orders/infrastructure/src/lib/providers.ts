// Work Orders Infrastructure Layer Providers
import { Provider } from '@angular/core';
import { WorkOrderRepository } from '@ops-flow/work-orders/domain';
import { WorkOrderHttpRepository } from './repositories/work-order-http.repository';

export function provideWorkOrderRepositories(): Provider[] {
  return [
    {
      provide: WorkOrderRepository,
      useClass: WorkOrderHttpRepository
    }
  ];
}
