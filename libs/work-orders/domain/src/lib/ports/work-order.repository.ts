// Work Order Repository Port - Domain Layer
import { WorkOrder } from '../entities/work-order.entity';

export abstract class WorkOrderRepository {
  abstract findById(id: string): Promise<WorkOrder | null>;
  abstract findAll(filters?: WorkOrderFilters): Promise<WorkOrder[]>;
  abstract save(workOrder: WorkOrder): Promise<void>;
  abstract delete(id: string): Promise<void>;
}

export interface WorkOrderFilters {
  status?: string;
  clientId?: string;
  assignedTo?: string;
  search?: string;
}
