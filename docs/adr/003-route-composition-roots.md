# ADR-003: Route-Level Composition Roots and Dependency Injection

**Status:** Accepted  
**Date:** 2026-03-09  
**Deciders:** Architecture Team

## Context

OpsFlow uses lazy-loaded routes for each domain. Each domain needs:
- Dependency injection (DI) providers for services, repositories, stores
- Proper scoping (singleton vs. route-scoped)
- Testability (ability to mock dependencies)
- Separation of concerns (presentation shouldn't know about HTTP details)

Angular standalone components (v19+) shift DI configuration from `NgModule` to component/route level.

## Decision

We will use **route-level composition roots** to wire dependencies for each domain, providing services at the route level using the `providers` array.

### Architecture Pattern

```
apps/shell/src/app/app.routes.ts (Global Providers)
  ├── AuthService (singleton)
  ├── ConfigService (singleton)
  ├── TelemetryService (singleton)
  └── [Domain Routes] (Lazy Loaded)
       │
       └── libs/{domain}/presentation/src/lib/{domain}.routes.ts
            ├── DomainUseCases (route-scoped)
            ├── DomainRepository (route-scoped)
            ├── DomainStore (providedIn: 'root')
            └── Domain Components
```

### Implementation

**Global Shell Providers (Singletons)**
```typescript
// apps/shell/src/main.ts
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    // Core services - singleton across entire app
    provideAuth(),
    provideConfig(),
    provideTelemetry(),
    provideErrorHandler()
  ]
});
```

**Domain-Level Providers (Route-Scoped)**
```typescript
// libs/client/presentation/src/lib/client.routes.ts
import { Route } from '@angular/router';
import { provideClientRepositories } from '@ops-flow/client/infrastructure';
import { provideClientUseCases } from '@ops-flow/client/application';

export const clientRoutes: Route[] = [
  {
    path: '',
    providers: [
      provideClientRepositories(),  // HTTP Repository implementations
      provideClientUseCases()        // Business logic
    ],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/client-list.component')
          .then(m => m.ClientListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/client-detail.component')
          .then(m => m.ClientDetailComponent)
      }
    ]
  }
];
```

**Infrastructure Provider Functions**
```typescript
// libs/client/infrastructure/src/lib/providers.ts
import { Provider } from '@angular/core';
import { ClientRepository } from '@ops-flow/client/domain';
import { ClientHttpRepository } from './repositories/client-http.repository';

export function provideClientRepositories(): Provider[] {
  return [
    {
      provide: ClientRepository,
      useClass: ClientHttpRepository
    }
  ];
}
```

**Application Provider Functions**
```typescript
// libs/client/application/src/lib/providers.ts
import { Provider } from '@angular/core';
import { 
  CreateClientUseCase,
  UpdateClientUseCase,
  GetClientUseCase,
  ListClientsUseCase
} from './use-cases';

export function provideClientUseCases(): Provider[] {
  return [
    CreateClientUseCase,
    UpdateClientUseCase,
    GetClientUseCase,
    ListClientsUseCase
  ];
}
```

**Component Injection**
```typescript
// libs/client/presentation/src/lib/pages/client-list.component.ts
@Component({
  selector: 'ops-client-list',
  standalone: true,
  template: `...`
})
export class ClientListComponent {
  private readonly listClients = inject(ListClientsUseCase);
  private readonly store = inject(ClientStore);
  
  ngOnInit() {
    this.listClients.execute().subscribe(clients => {
      // ...
    });
  }
}
```

### Scoping Strategy

| Service Type | Scope | Rationale |
|-------------|-------|-----------|
| Auth, Config, Telemetry | App-level (singleton) | Shared across all routes |
| Domain Use Cases | Route-level | Fresh state per domain navigation |
| Domain Repositories | Route-level | Can be mocked per route in tests |
| Signal Stores | `providedIn: 'root'` | Need to survive route changes |
| UI Components | Component-level | Stateless, no DI needed |

## Consequences

### Positive

✅ **Explicit dependencies:** Clear provider functions show what each domain needs  
✅ **Testability:** Easy to override providers in tests  
✅ **Lazy loading:** Providers only instantiated when route is activated  
✅ **No NgModules:** Simpler mental model with standalone components  
✅ **Type safety:** DI tokens enforce contracts  

### Negative

❌ **Boilerplate:** Each domain needs `provideX()` functions  
❌ **Scoping confusion:** Devs may misunderstand route vs. root scope  
❌ **Debugging:** Harder to trace provider tree compared to NgModule imports

### Neutral

⚠️ **Migration:** Moving from NgModules requires refactoring all providers  
⚠️ **Convention:** Team must follow consistent provider function naming

## Trade-offs

| Aspect | NgModule Approach | Route Providers | Rationale |
|--------|-------------------|-----------------|-----------|
| Boilerplate | Medium | Low | Standalone reduces overhead |
| Discoverability | High (import tree) | Medium (provider functions) | Accepted tradeoff |
| Testability | Good | Excellent | Critical for complex use cases |
| Tree-shaking | Good | Excellent | Better bundle sizes |

## Risks

1. **Provider duplication:** Accidentally providing same service twice  
   *Mitigation:* Use factory functions and add validation

2. **Memory leaks:** Route-scoped services not cleaned up  
   *Mitigation:* Test with Detox/Playwright to detect leaks

3. **Over-scoping:** Too many route-level providers hurt performance  
   *Mitigation:* Profile and move stable services to root

## Intentional Improvement Opportunity

**Issue:** One domain has providers wired in presentation layer instead of composition root  

The `compliance` domain currently wires `ComplianceChecklistService` directly in the presentation component's `providers` array instead of using a `provideComplianceUseCases()` function at the route level.

**Why Deferred:** For MVP, this simplifies compliance feature development. The service is small and has no complex dependencies.

**Future Fix:** Refactor to use composition root pattern when compliance use cases grow. Add `provideComplianceUseCases()` in `compliance/application` layer.

**Location:** `libs/compliance/presentation/src/lib/pages/checklist.component.ts`

## Implementation Notes

- Name provider functions: `provideDomainUseCases()`, `provideDomainRepositories()`
- Place provider functions in `{layer}/src/lib/providers.ts`
- Export providers from layer's `index.ts` for clean imports
- Use `inject()` function over constructor injection for brevity
- Document singleton vs. route-scoped decisions in code comments

## References

- [Angular Standalone Components](https://angular.dev/guide/standalone-components)
- [Dependency Injection in Angular](https://angular.dev/guide/di)
- [Composition Root Pattern](https://blog.ploeh.dk/2011/07/28/CompositionRoot/)
