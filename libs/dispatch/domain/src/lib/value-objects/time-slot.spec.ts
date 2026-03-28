// TimeSlot Value Object Tests
import { TimeSlot } from './time-slot';

describe('TimeSlot', () => {
  describe('create', () => {
    it('should create a valid time slot', () => {
      const startTime = new Date('2026-03-30T09:00:00Z');
      const endTime = new Date('2026-03-30T17:00:00Z');

      const timeSlot = TimeSlot.create(startTime, endTime);

      expect(timeSlot.startTime).toEqual(startTime);
      expect(timeSlot.endTime).toEqual(endTime);
    });

    it('should throw error when start time is after end time', () => {
      const startTime = new Date('2026-03-30T17:00:00Z');
      const endTime = new Date('2026-03-30T09:00:00Z');

      expect(() => TimeSlot.create(startTime, endTime)).toThrow(
        'TimeSlot start time must be before end time'
      );
    });

    it('should throw error when start time equals end time', () => {
      const time = new Date('2026-03-30T09:00:00Z');

      expect(() => TimeSlot.create(time, time)).toThrow(
        'TimeSlot start time must be before end time'
      );
    });
  });

  describe('overlaps', () => {
    it('should detect overlapping time slots', () => {
      const slot1 = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T12:00:00Z')
      );
      const slot2 = TimeSlot.create(
        new Date('2026-03-30T10:00:00Z'),
        new Date('2026-03-30T14:00:00Z')
      );

      expect(slot1.overlaps(slot2)).toBe(true);
      expect(slot2.overlaps(slot1)).toBe(true);
    });

    it('should not detect overlap for adjacent time slots', () => {
      const slot1 = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T12:00:00Z')
      );
      const slot2 = TimeSlot.create(
        new Date('2026-03-30T12:00:00Z'),
        new Date('2026-03-30T14:00:00Z')
      );

      expect(slot1.overlaps(slot2)).toBe(false);
      expect(slot2.overlaps(slot1)).toBe(false);
    });

    it('should not detect overlap for separate time slots', () => {
      const slot1 = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T12:00:00Z')
      );
      const slot2 = TimeSlot.create(
        new Date('2026-03-30T14:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );

      expect(slot1.overlaps(slot2)).toBe(false);
      expect(slot2.overlaps(slot1)).toBe(false);
    });
  });

  describe('contains', () => {
    it('should return true when date is within time slot', () => {
      const slot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );
      const date = new Date('2026-03-30T12:00:00Z');

      expect(slot.contains(date)).toBe(true);
    });

    it('should return false when date is before time slot', () => {
      const slot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );
      const date = new Date('2026-03-30T08:00:00Z');

      expect(slot.contains(date)).toBe(false);
    });

    it('should return false when date is after time slot', () => {
      const slot = TimeSlot.create(
        new Date('2026-03-30T09:00:00Z'),
        new Date('2026-03-30T17:00:00Z')
      );
      const date = new Date('2026-03-30T18:00:00Z');

      expect(slot.contains(date)).toBe(false);
    });
  });
});
