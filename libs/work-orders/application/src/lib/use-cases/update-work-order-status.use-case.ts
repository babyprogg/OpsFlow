// Update Work Order Status Use Case - Application Layer
import { inject, Injectable } from '@angular/core';
import { WorkOrder, WorkOrderRepository } from '@ops-flow/work-orders/domain';

export interface UpdateWorkOrderStatusCommand {
  id: string;
  action: 'schedule' | 'start' | 'complete' | 'cancel';
  scheduledDate?: Date;
  assignedTo?: string;
  cancelReason?: string;
}

@Injectable()
export class UpdateWorkOrderStatusUseCase {
  private repository = inject(WorkOrderRepository);

  async execute(command: UpdateWorkOrderStatusCommand): Promise<WorkOrder> {
    // Fetch existing work order
    const workOrder = await this.repository.findById(command.id);
    if (!workOrder) {
      throw new Error(`Work order not found: ${command.id}`);
    }

    // Apply state transition
    let updated: WorkOrder;
    switch (command.action) {
      case 'schedule':
        if (!command.scheduledDate || !command.assignedTo) {
          throw new Error('Scheduled date and assignee are required for scheduling');
        }
        updated = workOrder.schedule(command.scheduledDate, command.assignedTo);
        break;
      case 'start':
        updated = workOrder.start();
        break;
      case 'complete':
        updated = workOrder.complete();
        break;
      case 'cancel':
        updated = workOrder.cancel(command.cancelReason);
        break;
      default:
        throw new Error(`Unknown action: ${command.action}`);
    }

    // Persist changes
    await this.repository.save(updated);

    return updated;
  }
}
