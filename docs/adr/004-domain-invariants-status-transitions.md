# ADR-004: Domain Invariants and Status Transition Guards

**Status:** Accepted
**Date:** 2026-03-26
**Deciders:** Architecture Team

## Context

Work Orders in OpsFlow have a complex lifecycle with multiple states (Draft → Scheduled → InProgress → Completed / Cancelled). Business rules dictate strict transition paths:

- Only Draft work orders can be scheduled
- Only Scheduled work orders can start
- Only InProgress work orders can complete
- Completed work orders are immutable
- Each transition has preconditions (e.g., scheduling requires a future date and assignee)

Without enforcement at the domain layer, invalid state transitions could corrupt data and violate business rules. Previous systems allowed UI or API layers to create invalid states, leading to bugs and data inconsistencies.

## Decision

We will **enforce all business rules as domain invariants** within the entity class itself, using guard clauses and validation methods.

### Implementation Pattern

```typescript
export class WorkOrder {
  // Immutable properties enforced via readonly
  constructor(
    public readonly id: string,
    public readonly status: WorkOrderStatus,
    // ... other fields
  ) {
    this.validate(); // Always validate on construction
  }

  // State transitions return new instances (immutability)
  schedule(scheduledDate: Date, assignedTo: string): WorkOrder {
    // Guard clause: check current state
    if (this.status !== WorkOrderStatus.Draft) {
      throw new Error('Only draft work orders can be scheduled');
    }

    // Guard clause: validate preconditions
    if (!scheduledDate || scheduledDate < new Date()) {
      throw new Error('Scheduled date must be in the future');
    }

    // Return new instance with updated state
    return new WorkOrder(/* updated values */);
  }

  // Private validation enforces structural invariants
  private validate(): void {
    if (!this.title || this.title.trim().length === 0) {
      throw new Error('Work order title is required');
    }
  }
}
```

### Key Principles

1. **Fail Fast:** Invalid operations throw errors immediately at the domain layer
2. **Self-Validating Objects:** Entities validate themselves on construction
3. **Type Safety:** Enum types prevent invalid status values at compile time
4. **Immutability:** State transitions create new instances rather than mutating
5. **Single Source of Truth:** Business rules live in one place (the entity)

## Consequences

### Positive

✅ **Impossible States:** Invalid transitions cannot be created by accident
✅ **Self-Documenting:** Entity methods reveal the business rules clearly
✅ **Testability:** Business logic can be tested without infrastructure
✅ **Reliability:** Bugs caught at domain layer, not in production
✅ **Refactoring Safety:** Changes to rules are compiler-enforced everywhere
✅ **Universal Enforcement:** Rules apply regardless of entry point (API, UI, background job)

### Negative

❌ **Verbose Error Handling:** Callers must catch and handle domain exceptions
❌ **Less Flexibility:** Legitimate edge cases might be blocked by strict rules
❌ **Migration Complexity:** Importing legacy data with invalid states is harder
❌ **Performance:** Validation on every construction (mitigated by object reuse)

### Neutral

⚠️ **Exception vs Result Pattern:** Could use Result<T, Error> instead of throwing
⚠️ **Event Sourcing Alignment:** Immutable transitions align well with event stores
⚠️ **Debugging:** Stack traces point to exact business rule violations

## Trade-offs

| Aspect | Alternative | Chosen Approach | Rationale |
|--------|-------------|-----------------|-----------|
| Validation Location | Service layer | Domain entity | Prevents invalid state creation at source |
| Error Handling | Return nulls/booleans | Throw exceptions | Makes invalid states unrepresentable |
| Mutability | Mutable objects | Immutable transitions | Prevents accidental state corruption |
| State Machine | External library | Domain methods | Keeps business logic in domain layer |

## Risks

1. **Over-Strict Rules:** Edge cases blocked by overly strict validation
   *Mitigation:* Document exceptions in tests, add explicit bypass methods if needed

2. **Performance Bottleneck:** Creating new instances on every transition
   *Mitigation:* Profile in production; modern JS VMs handle this well

3. **Breaking Changes:** Tightening rules breaks existing callers
   *Mitigation:* Version entities, use deprecation warnings before enforcement

## Implementation Examples

### Valid Transition (Success)
```typescript
const workOrder = WorkOrder.create('Fix HVAC', 'Replace filter', 'client-123');
// status: Draft

const scheduled = workOrder.schedule(tomorrow, 'tech-456');
// status: Scheduled, assignedTo: tech-456

const inProgress = scheduled.start();
// status: InProgress

const completed = inProgress.complete();
// status: Completed ✅
```

### Invalid Transition (Failure)
```typescript
const workOrder = WorkOrder.create('Fix HVAC', 'Replace filter', 'client-123');
const completed = workOrder.complete(); // ❌ Throws Error
// → "Only in-progress work orders can be completed"
```

## Testing Strategy

Domain invariant tests cover:
- ✅ All valid transitions succeed
- ✅ All invalid transitions throw expected errors
- ✅ Precondition validation (dates, assignees, etc.)
- ✅ Immutability (original instance unchanged after transition)
- ✅ Edge cases (boundary dates, empty strings, null values)

See: `libs/work-orders/domain/src/lib/entities/work-order.entity.spec.ts`

## Related Decisions

- **ADR-001:** DDD structure enables pure domain logic
- **ADR-002:** Signal stores handle state reactivity separately
- **ADR-005:** Immutable entities align with functional programming patterns

## References

- [Domain-Driven Design: Tackling Complexity](https://www.domainlanguage.com/ddd/)
- [Making Impossible States Impossible](https://www.youtube.com/watch?v=IcgmSRJHu_8)
- [Parse, Don't Validate](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/)
