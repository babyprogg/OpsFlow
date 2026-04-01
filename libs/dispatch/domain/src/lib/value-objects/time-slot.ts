// TimeSlot Value Object - Domain Layer
export class TimeSlot {
  constructor(
    public readonly startTime: Date,
    public readonly endTime: Date
  ) {
    this.validate();
  }

  static create(startTime: Date, endTime: Date): TimeSlot {
    return new TimeSlot(startTime, endTime);
  }

  overlaps(other: TimeSlot): boolean {
    return this.startTime < other.endTime && this.endTime > other.startTime;
  }

  contains(date: Date): boolean {
    return date >= this.startTime && date <= this.endTime;
  }

  private validate(): void {
    if (!this.startTime || !this.endTime) {
      throw new Error('TimeSlot requires both start and end times');
    }
    if (this.startTime >= this.endTime) {
      throw new Error('TimeSlot start time must be before end time');
    }
  }
}
