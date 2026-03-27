// Get Work Order Use Case - Application Layer
import { inject, Injectable } from '@angular/core';
import { WorkOrder, WorkOrderRepository } from '@ops-flow/work-orders/domain';

@Injectable()
export class GetWorkOrderUseCase {
  private repository = inject(WorkOrderRepository);

  async execute(id: string): Promise<WorkOrder | null> {
    return this.repository.findById(id);
  }
}
