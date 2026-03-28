// DispatchWorkOrder Use Case Tests
import { DispatchWorkOrderUseCase, DispatchErrorCode } from './dispatch-work-order.use-case';
import {
  DispatchAssignment,
  DispatchAssignmentRepository,
  TechnicianRepository,
  Technician,
  TechnicianStatus,
  TimeSlot
} from '@ops-flow/dispatch/domain';
import { WorkOrderRepository, WorkOrder, WorkOrderStatus } from '@ops-flow/work-orders/domain';

describe('DispatchWorkOrderUseCase', () => {
  let useCase: DispatchWorkOrderUseCase;
  let mockWorkOrderRepo: jest.Mocked<WorkOrderRepository>;
  let mockTechnicianRepo: jest.Mocked<TechnicianRepository>;
  let mockAssignmentRepo: jest.Mocked<DispatchAssignmentRepository>;

  beforeEach(() => {
    mockWorkOrderRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<WorkOrderRepository>;

    mockTechnicianRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<TechnicianRepository>;

    mockAssignmentRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByTechnicianAndTimeSlot: jest.fn()
    } as jest.Mocked<DispatchAssignmentRepository>;

    useCase = new DispatchWorkOrderUseCase(
      mockWorkOrderRepo,
      mockTechnicianRepo,
      mockAssignmentRepo
    );
  });

  describe('successful dispatch', () => {
    it('should successfully dispatch work order to available technician', async () => {
      const workOrder = new WorkOrder(
        'work-123',
        'Fix HVAC',
        'Repair broken AC unit',
        'client-1',
        null,
        WorkOrderStatus.Draft,
        null,
        null,
        new Date(),
        new Date()
      );

      const technician = new Technician(
        'tech-456',
        'John Doe',
        'john@example.com',
        ['HVAC', 'Electrical'],
        TechnicianStatus.Available,
        new Date(),
        new Date()
      );

      mockWorkOrderRepo.findById.mockResolvedValue(workOrder);
      mockTechnicianRepo.findById.mockResolvedValue(technician);
      mockAssignmentRepo.findAll.mockResolvedValue([]);
      mockAssignmentRepo.findByTechnicianAndTimeSlot.mockResolvedValue([]);

      const result = await useCase.execute({
        workOrderId: 'work-123',
        technicianId: 'tech-456',
        startTime: new Date('2026-03-30T09:00:00Z'),
        endTime: new Date('2026-03-30T17:00:00Z')
      });

      expect(result.success).toBe(true);
      expect(result.assignment).toBeDefined();
      expect(result.assignment?.workOrderId).toBe('work-123');
      expect(result.assignment?.technicianId).toBe('tech-456');
      expect(mockAssignmentRepo.save).toHaveBeenCalledWith(expect.any(DispatchAssignment));
    });
  });

  describe('failure scenarios', () => {
    it('should fail when work order not found', async () => {
      mockWorkOrderRepo.findById.mockResolvedValue(null);

      const result = await useCase.execute({
        workOrderId: 'work-123',
        technicianId: 'tech-456',
        startTime: new Date('2026-03-30T09:00:00Z'),
        endTime: new Date('2026-03-30T17:00:00Z')
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(DispatchErrorCode.WorkOrderNotFound);
      expect(mockAssignmentRepo.save).not.toHaveBeenCalled();
    });

    it('should fail when work order is already assigned', async () => {
      const workOrder = new WorkOrder(
        'work-123',
        'Fix HVAC',
        'Repair broken AC unit',
        'client-1',
        null,
        WorkOrderStatus.Draft,
        null,
        null,
        new Date(),
        new Date()
      );

      const existingAssignment = DispatchAssignment.create(
        'work-123',
        'tech-999',
        TimeSlot.create(new Date('2026-03-30T09:00:00Z'), new Date('2026-03-30T17:00:00Z'))
      );

      mockWorkOrderRepo.findById.mockResolvedValue(workOrder);
      mockAssignmentRepo.findAll.mockResolvedValue([existingAssignment]);

      const result = await useCase.execute({
        workOrderId: 'work-123',
        technicianId: 'tech-456',
        startTime: new Date('2026-03-30T09:00:00Z'),
        endTime: new Date('2026-03-30T17:00:00Z')
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(DispatchErrorCode.WorkOrderAlreadyAssigned);
      expect(mockAssignmentRepo.save).not.toHaveBeenCalled();
    });

    it('should fail when technician not found', async () => {
      const workOrder = new WorkOrder(
        'work-123',
        'Fix HVAC',
        'Repair broken AC unit',
        'client-1',
        null,
        WorkOrderStatus.Draft,
        null,
        null,
        new Date(),
        new Date()
      );

      mockWorkOrderRepo.findById.mockResolvedValue(workOrder);
      mockAssignmentRepo.findAll.mockResolvedValue([]);
      mockTechnicianRepo.findById.mockResolvedValue(null);

      const result = await useCase.execute({
        workOrderId: 'work-123',
        technicianId: 'tech-456',
        startTime: new Date('2026-03-30T09:00:00Z'),
        endTime: new Date('2026-03-30T17:00:00Z')
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(DispatchErrorCode.TechnicianNotFound);
      expect(mockAssignmentRepo.save).not.toHaveBeenCalled();
    });

    it('should fail when technician is unavailable', async () => {
      const workOrder = new WorkOrder(
        'work-123',
        'Fix HVAC',
        'Repair broken AC unit',
        'client-1',
        null,
        WorkOrderStatus.Draft,
        null,
        null,
        new Date(),
        new Date()
      );

      const technician = new Technician(
        'tech-456',
        'John Doe',
        'john@example.com',
        ['HVAC'],
        TechnicianStatus.Unavailable,
        new Date(),
        new Date()
      );

      mockWorkOrderRepo.findById.mockResolvedValue(workOrder);
      mockAssignmentRepo.findAll.mockResolvedValue([]);
      mockTechnicianRepo.findById.mockResolvedValue(technician);

      const result = await useCase.execute({
        workOrderId: 'work-123',
        technicianId: 'tech-456',
        startTime: new Date('2026-03-30T09:00:00Z'),
        endTime: new Date('2026-03-30T17:00:00Z')
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(DispatchErrorCode.TechnicianUnavailable);
      expect(mockAssignmentRepo.save).not.toHaveBeenCalled();
    });

    it('should fail when time slot is invalid', async () => {
      const workOrder = new WorkOrder(
        'work-123',
        'Fix HVAC',
        'Repair broken AC unit',
        'client-1',
        null,
        WorkOrderStatus.Draft,
        null,
        null,
        new Date(),
        new Date()
      );

      const technician = new Technician(
        'tech-456',
        'John Doe',
        'john@example.com',
        ['HVAC'],
        TechnicianStatus.Available,
        new Date(),
        new Date()
      );

      mockWorkOrderRepo.findById.mockResolvedValue(workOrder);
      mockAssignmentRepo.findAll.mockResolvedValue([]);
      mockTechnicianRepo.findById.mockResolvedValue(technician);

      const result = await useCase.execute({
        workOrderId: 'work-123',
        technicianId: 'tech-456',
        startTime: new Date('2026-03-30T17:00:00Z'),
        endTime: new Date('2026-03-30T09:00:00Z') // End before start
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(DispatchErrorCode.InvalidTimeSlot);
      expect(mockAssignmentRepo.save).not.toHaveBeenCalled();
    });

    it('should fail when technician has conflicting assignment', async () => {
      const workOrder = new WorkOrder(
        'work-123',
        'Fix HVAC',
        'Repair broken AC unit',
        'client-1',
        null,
        WorkOrderStatus.Draft,
        null,
        null,
        new Date(),
        new Date()
      );

      const technician = new Technician(
        'tech-456',
        'John Doe',
        'john@example.com',
        ['HVAC'],
        TechnicianStatus.Available,
        new Date(),
        new Date()
      );

      const conflictingAssignment = DispatchAssignment.create(
        'work-999',
        'tech-456',
        TimeSlot.create(
          new Date('2026-03-30T10:00:00Z'),
          new Date('2026-03-30T14:00:00Z')
        )
      );

      mockWorkOrderRepo.findById.mockResolvedValue(workOrder);
      mockAssignmentRepo.findAll.mockResolvedValue([]);
      mockTechnicianRepo.findById.mockResolvedValue(technician);
      mockAssignmentRepo.findByTechnicianAndTimeSlot.mockResolvedValue([conflictingAssignment]);

      const result = await useCase.execute({
        workOrderId: 'work-123',
        technicianId: 'tech-456',
        startTime: new Date('2026-03-30T09:00:00Z'),
        endTime: new Date('2026-03-30T17:00:00Z')
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(DispatchErrorCode.TimeSlotConflict);
      expect(result.error?.details).toHaveProperty('conflicts');
      expect(mockAssignmentRepo.save).not.toHaveBeenCalled();
    });
  });
});
