// Work Order Mapper - Infrastructure Layer
import { WorkOrder, WorkOrderStatus } from '@ops-flow/work-orders/domain';

export class WorkOrderMapper {
  static toDomain(dto: any): WorkOrder {
    return new WorkOrder(
      dto.id,
      dto.title,
      dto.description,
      dto.clientId,
      dto.assignedTo ?? null,
      dto.status as WorkOrderStatus,
      dto.scheduledDate ? new Date(dto.scheduledDate) : null,
      dto.completedDate ? new Date(dto.completedDate) : null,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  static toDto(workOrder: WorkOrder): any {
    return {
      id: workOrder.id,
      title: workOrder.title,
      description: workOrder.description,
      clientId: workOrder.clientId,
      assignedTo: workOrder.assignedTo,
      status: workOrder.status,
      scheduledDate: workOrder.scheduledDate?.toISOString() ?? null,
      completedDate: workOrder.completedDate?.toISOString() ?? null,
      createdAt: workOrder.createdAt.toISOString(),
      updatedAt: workOrder.updatedAt.toISOString()
    };
  }
}
