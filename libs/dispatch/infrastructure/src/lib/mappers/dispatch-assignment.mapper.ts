// DispatchAssignment Mapper - Infrastructure Layer
import { DispatchAssignment, DispatchStatus, TimeSlot } from '@ops-flow/dispatch/domain';

export interface DispatchAssignmentDto {
  id: string;
  workOrderId: string;
  technicianId: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export class DispatchAssignmentMapper {
  static toDomain(dto: DispatchAssignmentDto): DispatchAssignment {
    const timeSlot = TimeSlot.create(
      new Date(dto.startTime),
      new Date(dto.endTime)
    );

    return new DispatchAssignment(
      dto.id,
      dto.workOrderId,
      dto.technicianId,
      timeSlot,
      dto.status as DispatchStatus,
      new Date(dto.createdAt),
      new Date(dto.updatedAt)
    );
  }

  static toDto(assignment: DispatchAssignment): DispatchAssignmentDto {
    return {
      id: assignment.id,
      workOrderId: assignment.workOrderId,
      technicianId: assignment.technicianId,
      startTime: assignment.timeSlot.startTime.toISOString(),
      endTime: assignment.timeSlot.endTime.toISOString(),
      status: assignment.status,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString()
    };
  }
}
