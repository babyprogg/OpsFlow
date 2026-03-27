# ADR-006: Immutable Entities and Value Objects

**Status:** Accepted
**Date:** 2026-03-26
**Deciders:** Architecture Team

## Context

Entities in OpsFlow (Client, WorkOrder, Equipment, etc.) maintain state that changes over time. When implementing state transitions, we face a choice:

1. **Mutable Entities:** Modify properties directly (e.g., `workOrder.status = 'completed'`)
2. **Immutable Entities:** Create new instances on state changes (e.g., `workOrder.complete()` returns new instance)

Mutable entities are simpler to write but can lead to:
- Accidental modifications from unexpected code paths
- Difficulty tracking state changes over time
- Race conditions in async operations
- Challenges with undo/redo functionality
- Complex debugging ("who changed this value?")

Immutable entities add boilerplate but provide:
- Predictable behavior (no hidden mutations)
- Better support for time-travel debugging
- Natural alignment with event sourcing
- Thread-safety guarantees
- Clearer audit trails

## Decision

We will implement **all domain entities as immutable objects** using TypeScript's `readonly` modifier and factory methods that return new instances.

### Implementation Pattern

```typescript
export class WorkOrder {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly status: WorkOrderStatus,
    public readonly scheduledDate: Date | null,
    public readonly completedDate: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  // Factory method for creating new instances
  static create(title: string, description: string, clientId: string): WorkOrder {
    return new WorkOrder(
      crypto.randomUUID(),
      title,
      WorkOrderStatus.Draft,
      null,
      null,
      new Date(),
      new Date()
    );
  }

  // State transition returns NEW instance
  schedule(scheduledDate: Date, assignedTo: string): WorkOrder {
    this.validateTransition();

    return new WorkOrder(
      this.id,                    // Keep same ID
      this.title,                 // Carry forward unchanged fields
      WorkOrderStatus.Scheduled,  // Update status
      scheduledDate,              // Update scheduled date
      null,
      this.createdAt,            // Preserve creation time
      new Date()                 // Update modification time
    );
  }
}
```

### Key Principles

1. **Readonly Properties:** All entity properties marked `readonly` at compile time
2. **Factory Methods:** Static methods (`create`) for initial construction
3. **Transition Methods:** Instance methods that return new entities
4. **Preserved Identity:** Entity ID remains constant across transitions
5. **Temporal Metadata:** Track `createdAt` (immutable) and `updatedAt` (changes)

## Consequences

### Positive

✅ **Predictable Behavior:** No hidden mutations, state changes are explicit
✅ **Time-Travel Debugging:** Can replay state transitions with full history
✅ **Thread Safety:** Safe to pass entities across async boundaries
✅ **Event Sourcing Ready:** Natural fit with event-driven architectures
✅ **Undo/Redo:** Keep previous instances in memory for easy rollback
✅ **Audit Trail:** Each transition creates trackable artifact
✅ **Testing Confidence:** No shared mutable state between tests
✅ **Functional Programming:** Aligns with pure functions and referential transparency

### Negative

❌ **Memory Overhead:** Creating new objects on every change
❌ **Verbose Code:** More boilerplate than simple property assignments
❌ **Learning Curve:** Team must learn immutable patterns
❌ **Framework Integration:** Some frameworks expect mutable objects (Angular forms)
❌ **Deep Cloning:** Complex nested objects require careful copying
❌ **Performance:** More garbage collection (mitigated by modern JS engines)

### Neutral

⚠️ **Structural Sharing:** Could optimize with libraries like Immer or immutable.js
⚠️ **Serialization:** Need to reconstruct entities from DTOs on deserialization
⚠️ **ORM Integration:** Traditional ORMs assume mutability (not applicable for API-driven app)

## Trade-offs

| Aspect | Mutable Entities | Immutable Entities | Rationale |
|--------|-----------------|-------------------|-----------|
| Simplicity | Simpler syntax | More boilerplate | Worth it for safety guarantees |
| Performance | Faster (in-place) | Slower (new objects) | Modern VMs optimize well |
| Debugging | Harder to track changes | Changes are explicit | Critical for complex business rules |
| Concurrency | Requires locks | Naturally safe | Important for async use cases |
| Change Tracking | Manual diffing | Built-in via history | Better audit and undo support |

## Risks

1. **Memory Leaks:** Holding references to old instances indefinitely
   *Mitigation:* Clear history after persistence, use weak references for caches

2. **Performance Bottleneck:** Creating thousands of objects per second
   *Mitigation:* Profile first, optimize if needed (structural sharing, object pooling)

3. **Framework Incompatibility:** Angular forms or other tools expect mutability
   *Mitigation:* Use DTOs/ViewModels in presentation layer, entities stay immutable

4. **Complex Copying:** Deeply nested objects hard to clone correctly
   *Mitigation:* Keep entities flat, use value objects, avoid deep nesting

## Implementation Examples

### Immutability in Action

```typescript
const workOrder = WorkOrder.create('Fix HVAC', 'Replace filter', 'client-123');
console.log(workOrder.status); // Draft

const scheduled = workOrder.schedule(tomorrow, 'tech-456');
console.log(workOrder.status);   // Still Draft ✅
console.log(scheduled.status);   // Scheduled ✅

console.log(workOrder !== scheduled); // true ✅
console.log(workOrder.id === scheduled.id); // true ✅
```

### Integration with Signal Store

```typescript
export const WorkOrderStore = signalStore(
  withMethods((store) => ({
    async scheduleWorkOrder(id: string, date: Date, assignee: string) {
      const updated = await updateStatus.execute({ id, action: 'schedule', ... });

      // Replace entire work order in array (immutability preserved)
      const workOrders = store.workOrders().map(w =>
        w.id === updated.id ? updated : w
      );

      patchState(store, { workOrders });
    }
  }))
);
```

### Comparison with Mutable Approach (What We Avoided)

```typescript
// ❌ Mutable (NOT USED)
class MutableWorkOrder {
  status: WorkOrderStatus;

  schedule(date: Date, assignee: string): void {
    this.status = WorkOrderStatus.Scheduled; // Direct mutation
    this.scheduledDate = date;
    this.assignedTo = assignee;
  }
}

// Problems:
workOrder.schedule(tomorrow, 'tech-456');
// 1. Original object is lost (can't undo)
// 2. Side effects not obvious from signature (returns void)
// 3. Concurrent calls could race
// 4. Hard to test (shared state)
```

## Patterns Used

### 1. Factory Method Pattern
Static methods encapsulate complex construction logic:
```typescript
static create(title: string, description: string, clientId: string): WorkOrder {
  return new WorkOrder(/* with defaults */);
}
```

### 2. Builder Pattern (For Complex Objects)
Could be used for entities with many optional fields:
```typescript
WorkOrder.builder()
  .withTitle('Fix HVAC')
  .withDescription('Replace filter')
  .forClient('client-123')
  .build();
```

### 3. Copy-On-Write
Transition methods copy all fields, update only what changed:
```typescript
return new WorkOrder(
  this.id,        // Same
  this.title,     // Same
  newStatus,      // Changed
  this.createdAt  // Same
);
```

## Testing Benefits

### Immutable Tests Are Cleaner

```typescript
it('should not mutate original work order on scheduling', () => {
  const original = WorkOrder.create('Title', 'Desc', 'client-1');
  const scheduled = original.schedule(tomorrow, 'tech-1');

  expect(original.status).toBe(WorkOrderStatus.Draft); // Still Draft
  expect(scheduled.status).toBe(WorkOrderStatus.Scheduled);
  expect(original).not.toBe(scheduled); // Different objects
});
```

### No Test Pollution

```typescript
describe('WorkOrder', () => {
  const workOrder = WorkOrder.create('Title', 'Desc', 'client-1');

  it('test 1', () => {
    const scheduled = workOrder.schedule(tomorrow, 'tech-1');
    // workOrder unchanged - safe for next test
  });

  it('test 2', () => {
    const inProgress = workOrder.start();
    // No pollution from test 1
  });
});
```

## Future Considerations

### Event Sourcing Integration

Immutable entities naturally align with event sourcing:

```typescript
// Event stream represents all transitions
const events = [
  { type: 'WorkOrderCreated', payload: { title, description } },
  { type: 'WorkOrderScheduled', payload: { date, assignee } },
  { type: 'WorkOrderStarted', payload: { timestamp } },
  { type: 'WorkOrderCompleted', payload: { timestamp } }
];

// Replay events to rebuild current state
const currentState = events.reduce((entity, event) =>
  entity.apply(event), initialState
);
```

### Performance Optimization (if needed)

If profiling shows issues, consider:
1. **Structural Sharing:** Use Immer.js or immutable.js
2. **Object Pooling:** Reuse objects for high-throughput scenarios
3. **Lazy Copying:** Only clone when actually needed
4. **Proxy Pattern:** Use ES6 Proxies for change detection

## Related Decisions

- **ADR-001:** DDD structure keeps entities in domain layer
- **ADR-002:** Signal stores handle reactivity, entities stay immutable
- **ADR-004:** Immutability enforces domain invariants naturally
- **ADR-005:** Vertical slicing applies this pattern consistently

## References

- [Immutability in JavaScript](https://developer.mozilla.org/en-US/docs/Glossary/Immutable)
- [Persistent Data Structures](https://en.wikipedia.org/wiki/Persistent_data_structure)
- [Immer.js - Immutability with Mutations](https://immerjs.github.io/immer/)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Functional Core, Imperative Shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell)
