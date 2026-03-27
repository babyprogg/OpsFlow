// Work Order Entity - Domain Layer
export class WorkOrder {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly clientId: string,
    public readonly assignedTo: string | null,
    public readonly status: WorkOrderStatus,
    public readonly scheduledDate: Date | null,
    public readonly completedDate: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  static create(
    title: string,
    description: string,
    clientId: string
  ): WorkOrder {
    return new WorkOrder(
      crypto.randomUUID(),
      title,
      description,
      clientId,
      null,
      WorkOrderStatus.Draft,
      null,
      null,
      new Date(),
      new Date()
    );
  }

  schedule(scheduledDate: Date, assignedTo: string): WorkOrder {
    if (this.status !== WorkOrderStatus.Draft) {
      throw new Error('Only draft work orders can be scheduled');
    }
    if (!scheduledDate || scheduledDate < new Date()) {
      throw new Error('Scheduled date must be in the future');
    }
    if (!assignedTo || assignedTo.trim().length === 0) {
      throw new Error('Work order must be assigned to someone');
    }

    return new WorkOrder(
      this.id,
      this.title,
      this.description,
      this.clientId,
      assignedTo,
      WorkOrderStatus.Scheduled,
      scheduledDate,
      null,
      this.createdAt,
      new Date()
    );
  }

  start(): WorkOrder {
    if (this.status !== WorkOrderStatus.Scheduled) {
      throw new Error('Only scheduled work orders can be started');
    }

    return new WorkOrder(
      this.id,
      this.title,
      this.description,
      this.clientId,
      this.assignedTo,
      WorkOrderStatus.InProgress,
      this.scheduledDate,
      null,
      this.createdAt,
      new Date()
    );
  }

  complete(): WorkOrder {
    if (this.status !== WorkOrderStatus.InProgress) {
      throw new Error('Only in-progress work orders can be completed');
    }

    return new WorkOrder(
      this.id,
      this.title,
      this.description,
      this.clientId,
      this.assignedTo,
      WorkOrderStatus.Completed,
      this.scheduledDate,
      new Date(),
      this.createdAt,
      new Date()
    );
  }

  cancel(reason?: string): WorkOrder {
    if (this.status === WorkOrderStatus.Completed) {
      throw new Error('Completed work orders cannot be cancelled');
    }

    return new WorkOrder(
      this.id,
      this.title,
      this.description,
      this.clientId,
      this.assignedTo,
      WorkOrderStatus.Cancelled,
      this.scheduledDate,
      null,
      this.createdAt,
      new Date()
    );
  }

  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Work order title is required');
    }
    if (!this.description || this.description.trim().length === 0) {
      throw new Error('Work order description is required');
    }
    if (!this.clientId || this.clientId.trim().length === 0) {
      throw new Error('Client ID is required');
    }
  }
}

export enum WorkOrderStatus {
  Draft = 'draft',
  Scheduled = 'scheduled',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled'
}
