// DispatchWorkOrder Use Case - Application Layer
import {
  DispatchAssignment,
  DispatchAssignmentRepository,
  TechnicianRepository,
  TimeSlot,
  TechnicianStatus
} from '@ops-flow/dispatch/domain';
import { WorkOrderRepository, WorkOrder } from '@ops-flow/work-orders/domain';

export interface DispatchWorkOrderCommand {
  workOrderId: string;
  technicianId: string;
  startTime: Date;
  endTime: Date;
}

export interface DispatchResult {
  success: boolean;
  assignment?: DispatchAssignment;
  error?: DispatchError;
}

export interface DispatchError {
  code: DispatchErrorCode;
  message: string;
  details?: unknown;
}

export enum DispatchErrorCode {
  WorkOrderNotFound = 'WORK_ORDER_NOT_FOUND',
  TechnicianNotFound = 'TECHNICIAN_NOT_FOUND',
  TechnicianUnavailable = 'TECHNICIAN_UNAVAILABLE',
  TimeSlotConflict = 'TIME_SLOT_CONFLICT',
  InvalidTimeSlot = 'INVALID_TIME_SLOT',
  WorkOrderAlreadyAssigned = 'WORK_ORDER_ALREADY_ASSIGNED'
}

export class DispatchWorkOrderUseCase {
  constructor(
    private readonly workOrderRepository: WorkOrderRepository,
    private readonly technicianRepository: TechnicianRepository,
    private readonly assignmentRepository: DispatchAssignmentRepository
  ) {}

  async execute(command: DispatchWorkOrderCommand): Promise<DispatchResult> {
    // 1. Validate work order exists
    const workOrder = await this.workOrderRepository.findById(command.workOrderId);
    if (!workOrder) {
      return {
        success: false,
        error: {
          code: DispatchErrorCode.WorkOrderNotFound,
          message: `Work order ${command.workOrderId} not found`
        }
      };
    }

    // 2. Check if work order is already assigned
    const existingAssignments = await this.assignmentRepository.findAll({
      workOrderId: command.workOrderId,
      status: 'assigned'
    });
    if (existingAssignments.length > 0) {
      return {
        success: false,
        error: {
          code: DispatchErrorCode.WorkOrderAlreadyAssigned,
          message: `Work order ${command.workOrderId} is already assigned`,
          details: { existingAssignment: existingAssignments[0] }
        }
      };
    }

    // 3. Validate technician exists
    const technician = await this.technicianRepository.findById(command.technicianId);
    if (!technician) {
      return {
        success: false,
        error: {
          code: DispatchErrorCode.TechnicianNotFound,
          message: `Technician ${command.technicianId} not found`
        }
      };
    }

    // 4. Check technician availability status
    if (technician.status === TechnicianStatus.Unavailable) {
      return {
        success: false,
        error: {
          code: DispatchErrorCode.TechnicianUnavailable,
          message: `Technician ${command.technicianId} is unavailable`,
          details: { status: technician.status }
        }
      };
    }

    // 5. Create time slot and validate
    let timeSlot: TimeSlot;
    try {
      timeSlot = TimeSlot.create(command.startTime, command.endTime);
    } catch (error) {
      return {
        success: false,
        error: {
          code: DispatchErrorCode.InvalidTimeSlot,
          message: error instanceof Error ? error.message : 'Invalid time slot',
          details: { startTime: command.startTime, endTime: command.endTime }
        }
      };
    }

    // 6. Check for scheduling conflicts
    const existingAssignmentsForTechnician = await this.assignmentRepository.findByTechnicianAndTimeSlot(
      command.technicianId,
      timeSlot
    );

    const newAssignment = DispatchAssignment.create(
      command.workOrderId,
      command.technicianId,
      timeSlot
    );

    const conflicts = existingAssignmentsForTechnician.filter(existing =>
      newAssignment.hasConflictWith(existing)
    );

    if (conflicts.length > 0) {
      return {
        success: false,
        error: {
          code: DispatchErrorCode.TimeSlotConflict,
          message: `Technician ${command.technicianId} has conflicting assignments in the requested time slot`,
          details: {
            conflicts: conflicts.map(c => ({
              assignmentId: c.id,
              workOrderId: c.workOrderId,
              timeSlot: {
                startTime: c.timeSlot.startTime,
                endTime: c.timeSlot.endTime
              }
            }))
          }
        }
      };
    }

    // 7. Save the assignment
    await this.assignmentRepository.save(newAssignment);

    // 8. Return success
    return {
      success: true,
      assignment: newAssignment
    };
  }
}
