# ADR-002: Signal-Based State Management with @ngrx/signals

**Status:** Accepted  
**Date:** 2026-03-09  
**Deciders:** Architecture Team

## Context

OpsFlow requires state management for:
- Domain aggregate state (clients, work orders, etc.)
- UI state (filters, selections, modals)
- Cross-cutting concerns (auth, config, telemetry)
- Real-time updates (dispatch board, work order status)

Traditional approaches (NgRx Store, Akita, NGXS) provide powerful patterns but add significant boilerplate. Angular Signals (v19+) offer a native, reactive primitive with change detection optimizations.

## Decision

We will use **Angular Signals** as the primary state primitive and **@ngrx/signals** for structured domain state management.

### State Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  Components consume signals via hooks   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Infrastructure Layer               │
│  SignalStore per aggregate              │
│  - withState(initialState)              │
│  - withComputed(derivedValues)          │
│  - withMethods(actions)                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│       Application Layer                 │
│  Use Cases orchestrate state changes    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Domain Layer                    │
│  Pure business logic (no signals)       │
└─────────────────────────────────────────┘
```

### Implementation Pattern

**Infrastructure: Signal Store**
```typescript
// libs/client/infrastructure/src/lib/stores/client.store.ts
import { signalStore, withState, withMethods, withComputed } from '@ngrx/signals';

interface ClientState {
  clients: Client[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

export const ClientStore = signalStore(
  { providedIn: 'root' },
  withState<ClientState>({
    clients: [],
    selectedId: null,
    loading: false,
    error: null
  }),
  withComputed(({ clients, selectedId }) => ({
    selectedClient: computed(() => 
      clients().find(c => c.id === selectedId()) ?? null
    ),
    activeClients: computed(() => 
      clients().filter(c => c.status === 'active')
    )
  })),
  withMethods((store, useCases = inject(ClientUseCases)) => ({
    async loadClients() {
      patchState(store, { loading: true });
      try {
        const clients = await useCases.getAllClients();
        patchState(store, { clients, loading: false });
      } catch (error) {
        patchState(store, { error: error.message, loading: false });
      }
    },
    selectClient(id: string) {
      patchState(store, { selectedId: id });
    }
  }))
);
```

**Presentation: Component Consumption**
```typescript
@Component({
  selector: 'ops-client-list',
  standalone: true,
  template: `
    @if (store.loading()) {
      <p>Loading...</p>
    } @else {
      @for (client of store.activeClients(); track client.id) {
        <div (click)="store.selectClient(client.id)">
          {{ client.name }}
        </div>
      }
    }
  `
})
export class ClientListComponent {
  store = inject(ClientStore);
  
  ngOnInit() {
    this.store.loadClients();
  }
}
```

### Cache Invalidation Strategy

A shared `QueryCacheService` tracks dependencies:
```typescript
// libs/core/query-cache/src/lib/query-cache.service.ts
export class QueryCacheService {
  invalidate(keys: string[]): void {
    // Notifies stores to refetch
  }
  
  invalidatePattern(pattern: RegExp): void {
    // Bulk invalidation
  }
}
```

**Known Issue (Intentional):** Dashboard may show stale data if work orders update but cache isn't invalidated. This is a documented improvement opportunity.

## Consequences

### Positive

✅ **Native integration:** Signals are first-class in Angular 19+  
✅ **Reduced boilerplate:** No actions, reducers, effects, selectors as separate files  
✅ **Type safety:** Full TypeScript inference  
✅ **Performance:** Fine-grained change detection  
✅ **Composability:** Computed signals react to dependencies automatically  
✅ **DevTools:** `@ngrx/signals` provides Redux DevTools integration

### Negative

❌ **Immature ecosystem:** Fewer patterns and examples than classic NgRx  
❌ **No middleware:** Need custom solutions for logging, persistence  
❌ **Learning curve:** Team needs to unlearn some Redux patterns  
❌ **Limited time-travel debugging:** Not as robust as NgRx Store

### Neutral

⚠️ **Mixing paradigms:** Some devs may still reach for RxJS BehaviorSubject  
⚠️ **Testing:** Need new patterns for signal-based tests

## Trade-offs

| Aspect | @ngrx/store | @ngrx/signals | Rationale |
|--------|-------------|---------------|-----------|
| Boilerplate | High | Low | Faster development |
| DevTools | Excellent | Good | Acceptable for MVP |
| Ecosystem | Mature | Emerging | Risk accepted |
| Learning Curve | Steep | Moderate | Better for new devs |

## Risks

1. **Breaking changes:** @ngrx/signals may evolve rapidly  
   *Mitigation:* Abstract behind repository interfaces

2. **Performance at scale:** Unknown if signal stores handle 10K+ entities efficiently  
   *Mitigation:* Add pagination and virtual scrolling early

3. **Team resistance:** Devs familiar with NgRx Store may resist change  
   *Mitigation:* Provide training and coexist with classic NgRx if needed

## Implementation Notes

- Keep stores in `infrastructure` layer, **not** presentation
- Use Cases should call store methods, not HTTP directly
- Computed signals replace most selectors
- Add `toSignal()` for RxJS interop when needed
- Use `effect()` for side effects (logging, analytics)

## Intentional Improvement Opportunity

**Issue:** Naive cache invalidation in dashboard  
The dashboard aggregates data from multiple domains. When a work order status changes, the dashboard count may remain stale until manual refresh.

**Why Deferred:** Implementing a robust pub/sub or event-driven cache invalidation adds complexity. For MVP, force-refresh is acceptable.

**Future Fix:** Introduce domain events or WebSocket updates to trigger invalidations.

## References

- [Angular Signals](https://angular.dev/guide/signals)
- [@ngrx/signals Documentation](https://ngrx.io/guide/signals)
- [Signal Store Examples](https://github.com/ngrx/platform/tree/main/modules/signals)
