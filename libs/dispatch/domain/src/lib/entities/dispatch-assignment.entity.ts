// DispatchAssignment Entity - Domain Layer
import { TimeSlot } from '../value-objects/time-slot';

export class DispatchAssignment {
  constructor(
    public readonly id: string,
    public readonly workOrderId: string,
    public readonly technicianId: string,
    public readonly timeSlot: TimeSlot,
    public readonly status: DispatchStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  static create(
    workOrderId: string,
    technicianId: string,
    timeSlot: TimeSlot
  ): DispatchAssignment {
    return new DispatchAssignment(
      crypto.randomUUID(),
      workOrderId,
      technicianId,
      timeSlot,
      DispatchStatus.Assigned,
      new Date(),
      new Date()
    );
  }

  complete(): DispatchAssignment {
    if (this.status === DispatchStatus.Completed) {
      throw new Error('Assignment is already completed');
    }
    if (this.status === DispatchStatus.Cancelled) {
      throw new Error('Cannot complete a cancelled assignment');
    }

    return new DispatchAssignment(
      this.id,
      this.workOrderId,
      this.technicianId,
      this.timeSlot,
      DispatchStatus.Completed,
      this.createdAt,
      new Date()
    );
  }

  cancel(reason?: string): DispatchAssignment {
    if (this.status === DispatchStatus.Completed) {
      throw new Error('Cannot cancel a completed assignment');
    }

    return new DispatchAssignment(
      this.id,
      this.workOrderId,
      this.technicianId,
      this.timeSlot,
      DispatchStatus.Cancelled,
      this.createdAt,
      new Date()
    );
  }

  hasConflictWith(other: DispatchAssignment): boolean {
    // Only check for conflicts if both assignments are active (not cancelled or completed)
    const isThisActive = this.status === DispatchStatus.Assigned || this.status === DispatchStatus.InProgress;
    const isOtherActive = other.status === DispatchStatus.Assigned || other.status === DispatchStatus.InProgress;

    if (!isThisActive || !isOtherActive) {
      return false;
    }

    // Conflict if same technician and overlapping time slots
    return this.technicianId === other.technicianId && this.timeSlot.overlaps(other.timeSlot);
  }

  private validate(): void {
    if (!this.workOrderId || this.workOrderId.trim().length === 0) {
      throw new Error('Work order ID is required');
    }
    if (!this.technicianId || this.technicianId.trim().length === 0) {
      throw new Error('Technician ID is required');
    }
    if (!this.timeSlot) {
      throw new Error('Time slot is required');
    }
  }
}

export enum DispatchStatus {
  Assigned = 'assigned',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled'
}
