# ADR-001: Domain-Driven Design with Nx Module Boundaries

**Status:** Accepted  
**Date:** 2026-03-09  
**Deciders:** Architecture Team

## Context

OpsFlow is a multi-tenant Field Service + Compliance platform for SMB contractors. The system needs to manage multiple complex domains (clients, work orders, dispatch, inventory, billing, compliance, analytics) with clear boundaries to support:

- Independent team ownership
- Parallel feature development
- Controlled coupling between domains
- Testability and maintainability
- Future microservices migration if needed

## Decision

We will structure the codebase using **Domain-Driven Design (DDD) principles** enforced through **Nx workspace module boundaries**.

### Library Structure

Each domain is split into 4 layers:

```
libs/
  {domain}/
    domain/          # Entities, Value Objects, Domain Services, Port Interfaces
    application/     # Use Cases, Commands, Queries (business logic orchestration)
    infrastructure/  # Repositories, HTTP Adapters, Mappers, Signal Stores
    presentation/    # Pages, UI Components, Routes
```

### Dependency Rules (Enforced via Nx)

```
presentation -> application, domain, infrastructure, design-system, core
application  -> domain, core
domain       -> domain (same or shared), core
infrastructure -> domain, application, core
```

**Cross-domain dependencies** are explicitly controlled:
- `work-orders` can depend on `client`, `contracts`, `inventory`
- `billing` can depend on `work-orders`, `client`
- `dispatch` can depend on `work-orders`
- `analytics` can depend on all domains (read-only)

### Nx Tags

Each library is tagged:
- Layer: `layer:domain`, `layer:application`, `layer:infrastructure`, `layer:presentation`
- Domain: `domain:client`, `domain:work-orders`, etc.
- Type: `type:core`, `type:design-system`, `type:app`

Nx's `@nx/enforce-module-boundaries` ESLint rule enforces these constraints at build time.

### Path Aliases

TypeScript path aliases provide clean imports:
```typescript
import { Client } from '@ops-flow/client/domain';
import { CreateClientUseCase } from '@ops-flow/client/application';
import { ClientRepository } from '@ops-flow/client/infrastructure';
```

## Consequences

### Positive

✅ **Clear ownership:** Each domain can be owned by a different team  
✅ **Enforced boundaries:** Nx prevents accidental coupling  
✅ **Testability:** Pure domain logic isolated from infrastructure  
✅ **Scalability:** Easy to add new domains or split existing ones  
✅ **Refactoring safety:** Changes within a layer don't ripple uncontrollably  
✅ **Onboarding:** New developers quickly understand where code belongs

### Negative

❌ **Initial overhead:** More directories and configuration  
❌ **Learning curve:** Team needs to understand DDD and Nx constraints  
❌ **Verbose imports:** Longer import paths (mitigated by path aliases)  
❌ **Over-engineering risk:** Small features may feel heavy in early stages

### Neutral

⚠️ **Migration path:** If converting to microservices, each domain becomes a service  
⚠️ **Shared kernel:** Core utilities must be carefully designed to avoid coupling  
⚠️ **Cross-domain queries:** May need anti-corruption layers or event-driven sync

## Trade-offs

| Aspect | Alternative | Chosen Approach | Rationale |
|--------|-------------|-----------------|-----------|
| Structure | Feature folders | DDD layers | Better separation of concerns for complex domains |
| Enforcement | Code review | Automated (Nx) | Scales better with team growth |
| Granularity | Monolithic modules | Fine-grained libraries | Enables lazy loading and better caching |

## Risks

1. **Over-abstraction:** Team might create too many interfaces early  
   *Mitigation:* Start with concrete implementations, refactor when patterns emerge

2. **Circular dependencies:** Domain A needs Domain B which needs Domain A  
   *Mitigation:* Use domain events or anti-corruption layers

3. **Performance:** Too many small bundles might slow initial load  
   *Mitigation:* Group related presentation libs in route-level bundles

## Implementation Notes

- Use `nx graph` cli command to visualize dependencies
- Run `nx affected:test` to test only changed code
- Add `depConstraints` to `.eslintrc.json` as boundaries evolve
- Document cross-domain dependencies in each domain's README

## References

- [Nx Module Boundaries](https://nx.dev/features/enforce-module-boundaries)
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
