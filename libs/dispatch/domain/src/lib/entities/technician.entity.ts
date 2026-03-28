// Technician Entity - Domain Layer
export class Technician {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly skills: string[],
    public readonly status: TechnicianStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  static create(
    name: string,
    email: string,
    skills: string[]
  ): Technician {
    return new Technician(
      crypto.randomUUID(),
      name,
      email,
      skills,
      TechnicianStatus.Available,
      new Date(),
      new Date()
    );
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Technician name is required');
    }
    if (!this.email || this.email.trim().length === 0) {
      throw new Error('Technician email is required');
    }
    if (!this.skills || this.skills.length === 0) {
      throw new Error('Technician must have at least one skill');
    }
  }
}

export enum TechnicianStatus {
  Available = 'available',
  Busy = 'busy',
  Unavailable = 'unavailable'
}
