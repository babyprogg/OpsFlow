// List Work Orders Use Case - Application Layer
import { inject, Injectable } from '@angular/core';
import { WorkOrder, WorkOrderFilters, WorkOrderRepository } from '@ops-flow/work-orders/domain';

@Injectable()
export class ListWorkOrdersUseCase {
  private repository = inject(WorkOrderRepository);

  async execute(filters?: WorkOrderFilters): Promise<WorkOrder[]> {
    return this.repository.findAll(filters);
  }
}
