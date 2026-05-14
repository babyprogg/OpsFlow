# OpsFlow Full Roadmap

**Goal:** finish OpsFlow as a production-grade learning workspace for mid-level engineering, architecture, and delivery discipline.

This roadmap assumes the architecture decisions already captured in the ADRs are the standard:

- DDD with Nx boundaries
- Immutable entities and explicit domain invariants
- Vertical slice delivery
- Route-level composition roots
- Signal-based state at the infrastructure layer

## What Is Already Done

From the ADRs and current workspace structure, the project is already past the scaffold-only phase.

Completed foundation:

- ADR-001 through ADR-008 are in place and define the architectural rules.
- `client` is the reference implementation.
- `work-orders` has the core vertical slice implemented.
- `dispatch` has the assignment slice and cross-domain orchestration pattern.
- `inventory` has a compensation strategy defined.
- Nx, Jest, path aliases, and boundary rules are part of the workspace baseline.

That means the remaining work is not “build a starter app.” It is “finish the platform to a standard that could survive production use.”

## How To Work In This Repo

Use this order for every remaining slice:

1. Domain rules first.
2. Application orchestration second.
3. Infrastructure adapters third.
4. Presentation and routes fourth.
5. Tests and docs at each step.

Do not start by building UI screens in isolation. In this codebase, the learning happens when a feature crosses all four layers cleanly.

## Phase 1: Stabilize What Exists

Goal: make the implemented slices boringly reliable before adding more business scope.

Work items:

- Audit all exported barrels so each library exposes only the correct public surface.
- Run and fix lint for boundary violations.
- Close any missing tests in `client`, `work-orders`, and `dispatch`.
- Align provider wiring with ADR-003 everywhere.
- Review the `analytics` stale-data problem and decide on the final invalidation model.
- Confirm domain docs match the current code, not the original scaffold.

Exit criteria:

- `nx lint` is clean for touched libraries.
- Core flows have tests at the correct layer.
- Route-level DI is consistent.
- No domain leaks infrastructure details into domain/application code.

## Phase 2: Finish The Core Business Loop

Goal: complete the main operational path a contractor would actually use.

Recommended implementation order:

1. `client` complete the full customer lifecycle.
2. `contracts` add service agreements and SLA rules.
3. `work-orders` complete the full job lifecycle and service history links.
4. `dispatch` complete assignment, technician availability, and conflict handling.
5. `inventory` complete reservation, consumption, and compensation flows.
6. `billing` generate invoices from completed work orders.
7. `compliance` attach checklist and audit requirements to the operational flow.
8. `analytics` provide read-side visibility across the workflow.

What each slice must prove:

- The domain model prevents invalid business states.
- Use cases orchestrate work through repository ports.
- Infrastructure isolates HTTP, storage, mapping, and signal state.
- Presentation stays thin and route-scoped.
- The feature can be exercised from the shell app.

This phase is where the product becomes real. Everything before it is supporting architecture.

## Phase 3: Cross-Domain Integration

Goal: make the domains cooperate without collapsing into tight coupling.

Integration order:

1. `work-orders` → `dispatch`
2. `work-orders` → `inventory`
3. `work-orders` → `billing`
4. `work-orders` + `billing` + `analytics`
5. `client` + `contracts` as read dependencies
6. `compliance` as a workflow constraint on completion

Architectural rules:

- Cross-domain reads go through application or infrastructure ports, not direct entity import chains.
- Cross-domain updates should be represented with explicit use cases or events.
- Analytics should never become a hidden dependency sink.
- Any shared behavior should be extracted only after the same pattern exists in at least two places.

Exit criteria:

- Cross-domain flows are explicit and testable.
- No circular dependencies are needed to support the product.
- Cache invalidation and read models are intentional, not accidental.

## Phase 4: Shared Platform Hardening

Goal: turn the workspace into something that feels production-shaped, not just feature-shaped.

Platform work to complete:

- Design system primitives: button, card, modal, input, select, checkbox, stack, grid, container, empty state, and feedback states.
- Core services: auth, config, error handling, telemetry, api client, query cache.
- Shared test utilities: builders, fixtures, reusable mocks, and helper factories.
- Shell app UX: navigation, layout, route loading states, and domain entry points.
- Documentation: one short README per major domain and one short architecture note for each shared pattern.

Exit criteria:

- New features can be built without inventing new UI or state primitives each time.
- The core platform code is reusable and tested.
- The shell app feels like a real product shell, not a demo wrapper.

## Phase 5: Quality Gates And Delivery Discipline

Goal: make the repository behave like a production codebase.

Add or finalize these gates:

- Unit tests for every use case.
- Domain tests for every invariant and state transition.
- Component tests for presentation boundaries.
- At least one end-to-end flow for the primary business path.
- A build check for the shell app.
- A lint/boundary check for every pull request.
- A smoke test for the core workflow.

Also define the failure policy:

- Domain failures should be explicit and testable.
- Infrastructure failures should be wrapped or normalized.
- UI failures should degrade gracefully.
- Known technical debt must live in documentation, not in surprise behavior.

Exit criteria:

- The app can be changed with confidence.
- Regression detection is automated.
- The team can distinguish architecture bugs from product bugs.

## Phase 6: Cleanup And Refactor Pass

Goal: after the product works, reduce duplication and tighten the design.

Only do this after the main slices are complete.

Refactor candidates:

- Repeated mapper patterns.
- Repeated form/control store patterns.
- Any store logic that really belongs in a use case.
- Any provider wiring that still sits in components.
- Any over-broad DTOs leaking into presentation.

Rules for refactoring:

- Refactor from a repeated pattern, not a one-off idea.
- Keep behavior fixed while moving code.
- Prefer extracting shared code only when it has proven value in at least two places.

Exit criteria:

- Code is smaller and clearer without losing explicitness.
- Shared abstractions are justified by real repetition.
- No architectural rule is weakened for convenience.

## Phase 7: Release Readiness

Goal: make the finished project feel shippable.

Final release checklist:

- All major domain workflows are implemented.
- All implemented slices have tests at the right layer.
- Dependency boundaries are clean.
- Read models and invalidation are reliable.
- The shell app has coherent navigation and entry points.
- The docs explain how the architecture works and where new code belongs.
- Technical debt is named, prioritized, and limited.

At this point the project is no longer a learning sandbox only. It is a complete example of how to build and structure a production Angular/Nx monorepo with DDD.

## Recommended Starting Point Now

Because you already have ADRs and partial slices, the next thing to do is not another plan. It is to pick one implemented slice and finish it to a production standard.

Start here:

1. Audit `work-orders` against ADR-004, ADR-005, and ADR-006.
2. Verify `dispatch` against ADR-007.
3. Verify `inventory` against ADR-008.
4. Decide whether `analytics` invalidation will use events or cache keys.
5. Then move to the next incomplete domain, which should be `contracts` or `billing` depending on which workflow you want to complete first.

## Definition Of Done For The Whole Project

OpsFlow is finished when:

- Every domain has a clear bounded context and documented purpose.
- The main customer-to-work-order-to-dispatch-to-inventory-to-billing flow works end-to-end.
- Analytics reflects domain changes without manual refresh.
- The UI shell exposes the product cleanly.
- The architecture is enforced by Nx rules and reflected in the code, not just the docs.
- The repo remains a teaching artifact for real-world architecture, not just a prototype.