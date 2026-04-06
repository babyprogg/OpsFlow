# ADR-007: Dispatch Work Order Assignment Strategy

**Status:** Accepted  
**Date:** 2026-04-01  
**Deciders:** Architecture Team

## Context

OpsFlow needs to assign qualified technicians to work orders based on:
- Technician skills and availability
- Time slot conflicts
- Work order status
- Scheduling constraints

The dispatch process requires coordination between three domains:
1. **Work Orders** - What needs to be done
2. **Dispatch** - Assignment and scheduling logic
3. **Technicians** - Who is available (future: from scheduling module)

Key challenges:
- Preventing double-assignment of work orders
- Detecting scheduling conflicts for technicians
- Handling edge cases (unavailable technicians, invalid time slots)
- Clear error reporting for failed assignments
- Transaction safety (all-or-nothing assignment)

## Decision

We will implement **Dispatch Work Order Assignment** using a dedicated `DispatchWorkOrderUseCase` that:

1. **Acts as an orchestrator** between WorkOrders and Dispatch domains
2. **Validates pre-conditions** before creating assignments
3. **Detects conflicts** using time slot overlap logic
4. **Returns detailed errors** for debugging and user feedback
5. **Uses result-based error handling** (not exceptions) for domain validation failures

### Domain Boundaries

```
Dispatch Domain (libs/dispatch/)
├── domain/
│   ├── DispatchAssignment entity
│   ├── TimeSlot value object
│   ├── Technician entity 
│   ├── TechnicianStatus enum
│   ├── DispatchAssignmentRepository port
│   └── TechnicianRepository port
├── application/
│   ├── DispatchWorkOrderUseCase (orchestrator)
│   └── Error codes and contracts
└── infrastructure/
    └── Repository implementations
```

### Assignment Validation Flow

```
Input: { workOrderId, technicianId, startTime, endTime }
  ↓
1. Verify work order exists
   ✗ → WorkOrderNotFound
  ↓
2. Check work order not already assigned
   ✗ → WorkOrderAlreadyAssigned
  ↓
3. Verify technician exists
   ✗ → TechnicianNotFound
  ↓
4. Check technician availability status
   ✗ → TechnicianUnavailable
  ↓
5. Validate time slot (end > start)
   ✗ → InvalidTimeSlot
  ↓
6. Find existing assignments for technician in time range
   ✗ → TimeSlotConflict (with details)
  ↓
7. Create and persist DispatchAssignment
   ✓ → Assignment created successfully
```

### Error Codes

```typescript
enum DispatchErrorCode {
  WorkOrderNotFound,         // Work order doesn't exist
  WorkOrderAlreadyAssigned,  // Work order already has assignment
  TechnicianNotFound,        // Technician doesn't exist
  TechnicianUnavailable,     // Technician status is unavailable
  InvalidTimeSlot,           // End time before start time
  TimeSlotConflict           // Scheduling overlap detected
}
```

Each error includes:
- `code` - Machine-readable identifier
- `message` - User-friendly description
- `details` - Additional context (e.g., conflicting assignments)

### Key Design Decisions

#### 1. Result-Based Error Handling
**Choice:** Return `DispatchResult` with `success: boolean` instead of throwing exceptions

**Rationale:**
- Domain validation failures are expected, not exceptional
- Enables clear error presentation to users
- Cleaner testing without try/catch blocks
- Matches application layer convention

#### 2. Conflict Detection via TimeSlot Value Object
**Choice:** Use `TimeSlot` value object with `hasConflictWith()` method

**Rationale:**
- Encapsulates overlap logic (not scattered across code)
- Reusable across different assignment scenarios
- Easy to test and modify business rules
- Immutable time boundaries

#### 3. Technician Status Enum
**Choice:** Use explicit `TechnicianStatus` enum (Available, Unavailable, OnLeave, etc.)

**Rationale:**
- Prevents invalid status strings
- Type-safe status checks
- Easy to extend with new statuses
- Clear semantics vs magic strings

#### 4. Repository Pattern for External Domains
**Choice:** Inject `WorkOrderRepository` from work-orders domain

**Rationale:**
- Decouples dispatch from work-orders implementation
- Dispatch domain controls only dispatch logic
- Work-order changes don't break dispatch
- Follows dependency inversion principle

## Consequences

✅ **Positive:**
- Centralized, testable assignment logic
- Detailed error information for debugging
- Clear separation between domains
- Conflicts detected before persistence
- Easy to add new validation rules

⚠️ **Considerations:**
- Requires distributed transaction handling if work-order and assignment must be coordinated
- Time slot conflict detection is O(n) - may need optimization for hundreds of assignments
- Technician availability is snapshot-based (real-time changes not reflected mid-request)

## Future Enhancements

- [ ] Skill matching (technician skills vs work order requirements)
- [ ] Resource optimization (find best available technician for slot)
- [ ] Batch assignment (assign multiple work orders in one request)
- [ ] Assignment cancellation with re-dispatch
- [ ] Technician preference rules (preferred work types, geographic zones)
