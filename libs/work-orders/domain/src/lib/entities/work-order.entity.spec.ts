import { WorkOrder, WorkOrderStatus } from './work-order.entity';

describe('WorkOrder Entity', () => {
  describe('create', () => {
    it('should create work order with default Draft status', () => {
      const workOrder = WorkOrder.create(
        'Fix HVAC System',
        'Replace air filter and check compressor',
        'client-123'
      );

      expect(workOrder.id).toBeDefined();
      expect(workOrder.title).toBe('Fix HVAC System');
      expect(workOrder.description).toBe('Replace air filter and check compressor');
      expect(workOrder.clientId).toBe('client-123');
      expect(workOrder.status).toBe(WorkOrderStatus.Draft);
      expect(workOrder.assignedTo).toBeNull();
      expect(workOrder.scheduledDate).toBeNull();
      expect(workOrder.completedDate).toBeNull();
      expect(workOrder.createdAt).toBeInstanceOf(Date);
      expect(workOrder.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error when title is empty', () => {
      expect(() => WorkOrder.create('', 'Description', 'client-123')).toThrow(
        'Work order title is required'
      );
    });

    it('should throw error when description is empty', () => {
      expect(() => WorkOrder.create('Title', '', 'client-123')).toThrow(
        'Work order description is required'
      );
    });

    it('should throw error when clientId is empty', () => {
      expect(() => WorkOrder.create('Title', 'Description', '')).toThrow(
        'Client ID is required'
      );
    });
  });

  describe('schedule', () => {
    it('should schedule Draft work order with valid date and assignee', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000); // Tomorrow

      const scheduled = workOrder.schedule(futureDate, 'tech-456');

      expect(scheduled.status).toBe(WorkOrderStatus.Scheduled);
      expect(scheduled.scheduledDate).toEqual(futureDate);
      expect(scheduled.assignedTo).toBe('tech-456');
      expect(scheduled.updatedAt.getTime()).toBeGreaterThan(workOrder.updatedAt.getTime());
      expect(scheduled.id).toBe(workOrder.id); // Same ID
    });

    it('should reject scheduling with past date', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const pastDate = new Date(Date.now() - 86400000); // Yesterday

      expect(() => workOrder.schedule(pastDate, 'tech-456')).toThrow(
        'Scheduled date must be in the future'
      );
    });

    it('should reject scheduling without assignee', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000);

      expect(() => workOrder.schedule(futureDate, '')).toThrow(
        'Work order must be assigned to someone'
      );
    });

    it('should reject scheduling non-Draft work order', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000);
      const scheduled = workOrder.schedule(futureDate, 'tech-456');

      expect(() => scheduled.schedule(futureDate, 'tech-789')).toThrow(
        'Only draft work orders can be scheduled'
      );
    });
  });

  describe('start', () => {
    it('should start Scheduled work order', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000);
      const scheduled = workOrder.schedule(futureDate, 'tech-456');

      const inProgress = scheduled.start();

      expect(inProgress.status).toBe(WorkOrderStatus.InProgress);
      expect(inProgress.scheduledDate).toEqual(futureDate);
      expect(inProgress.assignedTo).toBe('tech-456');
      expect(inProgress.updatedAt.getTime()).toBeGreaterThan(scheduled.updatedAt.getTime());
      expect(inProgress.id).toBe(workOrder.id); // Same ID
    });

    it('should reject starting non-Scheduled work order', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');

      expect(() => workOrder.start()).toThrow(
        'Only scheduled work orders can be started'
      );
    });
  });

  describe('complete', () => {
    it('should complete InProgress work order', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000);
      const scheduled = workOrder.schedule(futureDate, 'tech-456');
      const inProgress = scheduled.start();

      const completed = inProgress.complete();

      expect(completed.status).toBe(WorkOrderStatus.Completed);
      expect(completed.completedDate).toBeInstanceOf(Date);
      expect(completed.updatedAt.getTime()).toBeGreaterThan(inProgress.updatedAt.getTime());
      expect(completed.id).toBe(workOrder.id); // Same ID
    });

    it('should reject completing non-InProgress work order', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000);
      const scheduled = workOrder.schedule(futureDate, 'tech-456');

      expect(() => scheduled.complete()).toThrow(
        'Only in-progress work orders can be completed'
      );
    });
  });

  describe('cancel', () => {
    it('should cancel Draft work order', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');

      const cancelled = workOrder.cancel('Client requested cancellation');

      expect(cancelled.status).toBe(WorkOrderStatus.Cancelled);
      expect(cancelled.updatedAt.getTime()).toBeGreaterThan(workOrder.updatedAt.getTime());
      expect(cancelled.id).toBe(workOrder.id); // Same ID
    });

    it('should cancel Scheduled work order', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000);
      const scheduled = workOrder.schedule(futureDate, 'tech-456');

      const cancelled = scheduled.cancel();

      expect(cancelled.status).toBe(WorkOrderStatus.Cancelled);
    });

    it('should cancel InProgress work order', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000);
      const scheduled = workOrder.schedule(futureDate, 'tech-456');
      const inProgress = scheduled.start();

      const cancelled = inProgress.cancel();

      expect(cancelled.status).toBe(WorkOrderStatus.Cancelled);
    });

    it('should reject cancelling Completed work order', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000);
      const scheduled = workOrder.schedule(futureDate, 'tech-456');
      const inProgress = scheduled.start();
      const completed = inProgress.complete();

      expect(() => completed.cancel()).toThrow(
        'Completed work orders cannot be cancelled'
      );
    });
  });

  describe('immutability', () => {
    it('should return new instances on state transitions', () => {
      const workOrder = WorkOrder.create('Title', 'Description', 'client-123');
      const futureDate = new Date(Date.now() + 86400000);
      const scheduled = workOrder.schedule(futureDate, 'tech-456');

      expect(scheduled).not.toBe(workOrder);
      expect(workOrder.status).toBe(WorkOrderStatus.Draft);
      expect(scheduled.status).toBe(WorkOrderStatus.Scheduled);
    });
  });
});
