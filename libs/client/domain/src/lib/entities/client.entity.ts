// Client Entity - Domain Layer
export class Client {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly status: ClientStatus,
    public readonly primaryContact: Contact,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  static create(name: string, primaryContact: Contact): Client {
    return new Client(
      crypto.randomUUID(),
      name,
      ClientStatus.Prospect,
      primaryContact,
      new Date(),
      new Date()
    );
  }

  activate(): Client {
    if (this.status !== ClientStatus.Prospect) {
      throw new Error('Only prospect clients can be activated');
    }
    return new Client(
      this.id,
      this.name,
      ClientStatus.Active,
      this.primaryContact,
      this.createdAt,
      new Date()
    );
  }

  deactivate(): Client {
    return new Client(
      this.id,
      this.name,
      ClientStatus.Inactive,
      this.primaryContact,
      this.createdAt,
      new Date()
    );
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Client name is required');
    }
    if (!this.primaryContact) {
      throw new Error('Primary contact is required');
    }
  }
}

export enum ClientStatus {
  Prospect = 'prospect',
  Active = 'active',
  Inactive = 'inactive'
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}
