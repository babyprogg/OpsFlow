// DispatchAssignment Entity Tests
import { DispatchAssignment, DispatchStatus } from './dispatch-assignment.entity';
import { TimeSlot } from '../value-objects/time-slot';

describe('DispatchAssignment Entity', () => {
  describe('create', () => {
    it('should create a dispatch assignment with Assigned status', () => {
      const timeSlot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );

      const assignment = DispatchAssignment.create(
        'work-order-123',
        'tech-456',
        timeSlot
      );

      expect(assignment.workOrderId).toBe('work-order-123');
      expect(assignment.technicianId).toBe('tech-456');
      expect(assignment.timeSlot).toBe(timeSlot);
      expect(assignment.status).toBe(DispatchStatus.Assigned);
      expect(assignment.id).toBeDefined();
    });

    it('should throw error when work order ID is empty', () => {
      const timeSlot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );

      expect(() => DispatchAssignment.create('', 'tech-456', timeSlot)).toThrow(
        'Work order ID is required'
      );
    });

    it('should throw error when technician ID is empty', () => {
      const timeSlot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );

      expect(() => DispatchAssignment.create('work-order-123', '', timeSlot)).toThrow(
        'Technician ID is required'
      );
    });
  });

  describe('hasConflictWith', () => {
    it('should detect conflict when same technician has overlapping time slot', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T12:00:00Z')
      );
      const timeSlot2 = TimeSlot.create(
        new Date('2026-03-30T10:00:00Z'),
        new Date('2026-03-30T14:00:00Z')
      );

      const assignment1 = DispatchAssignment.create('work-1', 'tech-1', timeSlot1);
      const assignment2 = DispatchAssignment.create('work-2', 'tech-1', timeSlot2);

      expect(assignment1.hasConflictWith(assignment2)).toBe(true);
      expect(assignment2.hasConflictWith(assignment1)).toBe(true);
    });

    it('should not detect conflict when different technicians have overlapping time slots', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T12:00:00Z')
      );
      const timeSlot2 = TimeSlot.create(
        new Date('2026-03-30T10:00:00Z'),
        new Date('2026-03-30T14:00:00Z')
      );

      const assignment1 = DispatchAssignment.create('work-1', 'tech-1', timeSlot1);
      const assignment2 = DispatchAssignment.create('work-2', 'tech-2', timeSlot2);

      expect(assignment1.hasConflictWith(assignment2)).toBe(false);
      expect(assignment2.hasConflictWith(assignment1)).toBe(false);
    });

    it('should not detect conflict when same technician has non-overlapping time slots', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T12:00:00Z')
      );
      const timeSlot2 = TimeSlot.create(
        new Date('2026-03-30T14:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );

      const assignment1 = DispatchAssignment.create('work-1', 'tech-1', timeSlot1);
      const assignment2 = DispatchAssignment.create('work-2', 'tech-1', timeSlot2);

      expect(assignment1.hasConflictWith(assignment2)).toBe(false);
      expect(assignment2.hasConflictWith(assignment1)).toBe(false);
    });

    it('should not detect conflict when one assignment is cancelled', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T12:00:00Z')
      );
      const timeSlot2 = TimeSlot.create(
        new Date('2026-03-30T10:00:00Z'),
        new Date('2026-03-30T14:00:00Z')
      );

      const assignment1 = DispatchAssignment.create('work-1', 'tech-1', timeSlot1);
      const assignment2 = DispatchAssignment.create('work-2', 'tech-1', timeSlot2).cancel();

      expect(assignment1.hasConflictWith(assignment2)).toBe(false);
      expect(assignment2.hasConflictWith(assignment1)).toBe(false);
    });

    it('should not detect conflict when one assignment is completed', () => {
      const timeSlot1 = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T12:00:00Z')
      );
      const timeSlot2 = TimeSlot.create(
        new Date('2026-03-30T10:00:00Z'),
        new Date('2026-03-30T14:00:00Z')
      );

      const assignment1 = DispatchAssignment.create('work-1', 'tech-1', timeSlot1).complete();
      const assignment2 = DispatchAssignment.create('work-2', 'tech-1', timeSlot2);

      expect(assignment1.hasConflictWith(assignment2)).toBe(false);
      expect(assignment2.hasConflictWith(assignment1)).toBe(false);
    });
  });

  describe('complete', () => {
    it('should complete an assigned assignment', () => {
      const timeSlot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );
      const assignment = DispatchAssignment.create('work-1', 'tech-1', timeSlot);

      const completed = assignment.complete();

      expect(completed.status).toBe(DispatchStatus.Completed);
      expect(completed.id).toBe(assignment.id);
    });

    it('should throw error when completing already completed assignment', () => {
      const timeSlot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );
      const assignment = DispatchAssignment.create('work-1', 'tech-1', timeSlot).complete();

      expect(() => assignment.complete()).toThrow('Assignment is already completed');
    });

    it('should throw error when completing cancelled assignment', () => {
      const timeSlot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );
      const assignment = DispatchAssignment.create('work-1', 'tech-1', timeSlot).cancel();

      expect(() => assignment.complete()).toThrow('Cannot complete a cancelled assignment');
    });
  });

  describe('cancel', () => {
    it('should cancel an assigned assignment', () => {
      const timeSlot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );
      const assignment = DispatchAssignment.create('work-1', 'tech-1', timeSlot);

      const cancelled = assignment.cancel();

      expect(cancelled.status).toBe(DispatchStatus.Cancelled);
      expect(cancelled.id).toBe(assignment.id);
    });

    it('should throw error when cancelling completed assignment', () => {
      const timeSlot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );
      const assignment = DispatchAssignment.create('work-1', 'tech-1', timeSlot).complete();

      expect(() => assignment.cancel()).toThrow('Cannot cancel a completed assignment');
    });
  });
});
