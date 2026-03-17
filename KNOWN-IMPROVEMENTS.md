# Known Improvements & Technical Debt

This document tracks **intentional architectural decisions** where we accepted suboptimal solutions for MVP velocity. Each item includes:
- Location
- Description
- Business impact
- Recommended fix
- Priority

---

## 🔴 High Priority

### #1: Naive Cache Invalidation (Dashboard Stale Data)

**Location:** `libs/analytics/infrastructure/src/lib/stores/analytics.store.ts`

**Problem:**  
Dashboard aggregates metrics from multiple domains (open work orders, SLA breaches, pending invoices). When a work order status changes, the dashboard doesn't automatically refresh. Users see stale counts until manually refreshing.

**Business Impact:**
- **User Experience:** Dispatchers may act on outdated information
- **Trust:** Users question data accuracy
- **Workaround:** Manual F5 refresh required

**Current Implementation:**
```typescript
// analytics.store.ts
withMethods((store) => ({
  async loadMetrics() {
    const data = await fetch('/api/analytics/dashboard');
    patchState(store, { metrics: data });
  }
}));
```

No subscription to work order updates or cache invalidation hooks.

**Recommended Fix:**
1. Introduce domain events:
   ```typescript
   // work-orders/domain
   export class WorkOrderStatusChanged extends DomainEvent {
     constructor(public orderId: string, public newStatus: Status) {}
   }
   ```

2. Subscribe in analytics store:
   ```typescript
   constructor(private events: DomainEventBus) {
     this.events.on(WorkOrderStatusChanged, () => {
       this.loadMetrics(); // Re-fetch dashboard
     });
   }
   ```

3. Alternatively, use QueryCacheService with key-based invalidation:
   ```typescript
   cacheService.invalidatePattern(/^dashboard-metrics/);
   ```

**Effort:** ~3 days (requires event infrastructure)  
**Priority:** 🔴 High - Core UX issue

---

## 🟡 Medium Priority

### #2: Broad DTO Used in Presentation (WorkOrderDTO)

**Location:** `libs/work-orders/presentation/src/lib/pages/work-order-list.component.ts`

**Problem:**  
List view component consumes full `WorkOrderDTO` with 25+ fields when only 6 are displayed (ID, client name, status, priority, assignedTo, dueDate). Over-fetching data and tight coupling to backend shape.

**Business Impact:**
- **Performance:** Larger payloads than needed (minor on small datasets)
- **Coupling:** Changes to backend DTO require frontend updates even if list view doesn't use new fields
- **Maintainability:** Unclear which fields component actually needs

**Current Implementation:**
```typescript
// work-order-list.component.ts
export class WorkOrderListComponent {
  workOrders = signal<WorkOrderDTO[]>([]);
}
```

**Recommended Fix:**
1. Create view model in presentation layer:
   ```typescript
   // work-orders/presentation/src/lib/models/work-order-list.view-model.ts
   export interface WorkOrderListViewModel {
     id: string;
     clientName: string;
     status: string;
     priority: string;
     assignedTo: string;
     dueDate: Date;
   }
   ```

2. Add mapper:
   ```typescript
   export function toWorkOrderListViewModel(dto: WorkOrderDTO): WorkOrderListViewModel {
     return {
       id: dto.id,
       clientName: dto.client.name,
       status: dto.status,
       priority: dto.priority,
       assignedTo: dto.assignedTechnician?.name ?? 'Unassigned',
       dueDate: new Date(dto.dueDate)
     };
   }
   ```

3. Use in component:
   ```typescript
   workOrders = signal<WorkOrderListViewModel[]>([]);
   ```

**Effort:** ~1 day  
**Priority:** 🟡 Medium - Performance + coupling concern

---

### #3: Missing Unit Tests for Use Cases

**Location:** All `libs/{domain}/application/` folders

**Problem:**  
Use cases have minimal test coverage. Only 2 out of 32 use cases have unit tests (`CreateClientUseCase` and `AssignTechnicianUseCase`).

**Business Impact:**
- **Risk:** Refactoring may introduce bugs
- **Documentation:** Tests serve as usage examples
- **Confidence:** Cannot safely change business logic

**Recommended Fix:**
Add Jest tests for all use cases following pattern:
```typescript
// create-work-order.use-case.spec.ts
describe('CreateWorkOrderUseCase', () => {
  let useCase: CreateWorkOrderUseCase;
  let mockRepo: jest.Mocked<WorkOrderRepository>;

  beforeEach(() => {
    mockRepo = { save: jest.fn() };
    useCase = new CreateWorkOrderUseCase(mockRepo);
  });

  it('should create work order with generated ID', async () => {
    const command = { clientId: '123', description: 'Fix AC' };
    const result = await useCase.execute(command);
    
    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      clientId: '123',
      status: 'draft'
    }));
  });
});
```

**Effort:** ~5 days (32 use cases × 15 min each)  
**Priority:** 🟡 Medium - Quality gate

---

## 🟢 Low Priority

### #4: Duplicated Form Control Store Abstraction

**Location:**  
- `libs/client/presentation/src/lib/stores/form-state.store.ts`
- `libs/contracts/presentation/src/lib/stores/form-state.store.ts`

**Problem:**  
Identical ~50 line implementation managing form dirty/pristine/touched state in two places.

**Business Impact:**
- **Maintenance:** Bugs must be fixed in two places
- **Consistency:** Risk of divergence over time

**Current Implementation:**
```typescript
// Duplicated in both domains
export const FormStateStore = signalStore(
  withState({ dirty: false, pristine: true, touched: false }),
  withMethods((store) => ({
    markDirty() { patchState(store, { dirty: true, pristine: false }); },
    markTouched() { patchState(store, { touched: true }); }
  }))
);
```

**Recommended Fix:**
1. Extract to design system:
   ```
   libs/design-system/form-controls/src/lib/stores/form-state.store.ts
   ```

2. Export from form-controls barrel:
   ```typescript
   export * from './stores/form-state.store';
   ```

3. Import in domains:
   ```typescript
   import { FormStateStore } from '@ops-flow/design-system/form-controls';
   ```

**Effort:** ~2 hours  
**Priority:** 🟢 Low - Only 2 instances, unlikely to add more

---

### #5: Provider Wiring in Presentation (Compliance Module)

**Location:** `libs/compliance/presentation/src/lib/pages/checklist.component.ts`

**Problem:**  
`ComplianceChecklistService` provided at component level instead of route-level composition root. Violates convention established in ADR-003.

**Business Impact:**
- **Consistency:** New developers may follow wrong pattern
- **Testing:** Slightly harder to override in tests

**Current Implementation:**
```typescript
@Component({
  selector: 'ops-compliance-checklist',
  providers: [ComplianceChecklistService],  // ❌ Should be at route level
  template: `...`
})
export class ChecklistComponent {
  service = inject(ComplianceChecklistService);
}
```

**Recommended Fix:**
1. Create provider function:
   ```typescript
   // libs/compliance/application/src/lib/providers.ts
   export function provideComplianceUseCases(): Provider[] {
     return [ComplianceChecklistService];
   }
   ```

2. Wire at route level:
   ```typescript
   // libs/compliance/presentation/src/lib/compliance.routes.ts
   export const complianceRoutes: Route[] = [{
     path: '',
     providers: [provideComplianceUseCases()],
     children: [...]
   }];
   ```

3. Remove from component providers

**Effort:** ~1 hour  
**Priority:** 🟢 Low - Works, just inconsistent

---

## 📊 Summary

| Priority | Count | Total Effort |
|----------|-------|--------------|
| 🔴 High  | 1     | ~3 days      |
| 🟡 Medium| 2     | ~6 days      |
| 🟢 Low   | 2     | ~3 hours     |

**Recommended Sprint Plan:**
1. Sprint 1: Fix cache invalidation (#1) + add domain events infrastructure
2. Sprint 2: Add use case tests (#3)
3. Sprint 3: Extract WorkOrderListViewModel (#2)
4. Sprint 4: Cleanup low-priority items (#4, #5)

---

## 🔄 Process

### Adding New Items

When accepting technical debt, document it here with:
1. Descriptive title
2. Exact file path(s)
3. Why we accepted it (velocity vs. quality tradeoff)
4. How to fix it
5. Business impact
6. Effort estimate
7. Priority

### Retiring Items

When fixing debt, move entry to `CHANGELOG.md` with:
```markdown
### Fixed Technical Debt
- **#1 Dashboard Cache:** Implemented domain events (closes KNOWN-IMPROVEMENTS.md #1)
```

### Preventing New Debt

- Discuss tradeoffs in PR reviews
- Require ADR for architectural shortcuts
- Timebox "quick fixes" to 2 sprints max before formalization
