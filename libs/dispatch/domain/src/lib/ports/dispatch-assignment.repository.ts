// DispatchAssignment Repository Port - Domain Layer
import { DispatchAssignment } from '../entities/dispatch-assignment.entity';
import { TimeSlot } from '../value-objects/time-slot';

export abstract class DispatchAssignmentRepository {
  abstract findById(id: string): Promise<DispatchAssignment | null>;
  abstract findAll(filters?: DispatchAssignmentFilters): Promise<DispatchAssignment[]>;
  abstract save(assignment: DispatchAssignment): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findByTechnicianAndTimeSlot(technicianId: string, timeSlot: TimeSlot): Promise<DispatchAssignment[]>;
}

export interface DispatchAssignmentFilters {
  technicianId?: string;
  workOrderId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}
