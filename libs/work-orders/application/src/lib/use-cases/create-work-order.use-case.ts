// Create Work Order Use Case - Application Layer
import { inject, Injectable } from '@angular/core';
import { WorkOrder, WorkOrderRepository } from '@ops-flow/work-orders/domain';

export interface CreateWorkOrderCommand {
  title: string;
  description: string;
  clientId: string;
}

@Injectable()
export class CreateWorkOrderUseCase {
  private repository = inject(WorkOrderRepository);

  async execute(command: CreateWorkOrderCommand): Promise<WorkOrder> {
    // Business logic orchestration
    const workOrder = WorkOrder.create(
      command.title,
      command.description,
      command.clientId
    );

    // Persist via repository
    await this.repository.save(workOrder);

    return workOrder;
  }
}
