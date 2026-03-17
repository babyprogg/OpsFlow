# OpsFlow Quick Reference

## 🚀 Common Commands

```bash
# Development
npm start                    # Start dev server (localhost:4200)
npm run build               # Production build
npm run graph               # Visualize dependency graph

# Testing
npm test                    # Run all tests
nx test client-domain       # Test specific library
npm run affected:test       # Test only changed code

# Code Quality
npm run lint                # Lint all projects
npm run format              # Format code with Prettier
npm run format:check        # Check formatting

# Nx Specific
nx affected -t build        # Build affected projects
nx affected -t lint         # Lint affected projects
nx show projects            # List all projects
nx list                     # List available plugins
```

## 📁 Where Does Code Go?

```
Feature: "Add client notes"

1. Domain Layer (libs/client/domain/)
   - entities/note.entity.ts       → Business objects
   - value-objects/                → Immutable values
   - ports/client.repository.ts    → Interface contracts

2. Application Layer (libs/client/application/)
   - use-cases/add-note.use-case.ts → Business logic orchestration
   - commands/                      → Write operations
   - queries/                       → Read operations

3. Infrastructure Layer (libs/client/infrastructure/)
   - repositories/client-http.repository.ts → HTTP implementation
   - mappers/note.mapper.ts        → DTO ↔ Domain mapping
   - stores/client.store.ts        → Signal-based state

4. Presentation Layer (libs/client/presentation/)
   - pages/client-detail.component.ts → Smart components
   - components/note-form.component.ts → UI components
   - client.routes.ts              → Route configuration
```

## 🎯 Import Patterns

### ✅ Correct Imports
```typescript
// Use path aliases
import { Client } from '@ops-flow/client/domain';
import { ClientStore } from '@ops-flow/client/infrastructure';
import { ButtonComponent } from '@ops-flow/design-system/components';

// Layer dependencies (allowed)
// Presentation → Application, Domain, Infrastructure, Design System, Core
import { CreateClientUseCase } from '@ops-flow/client/application';

// Application → Domain, Core
import { Client, ClientRepository } from '@ops-flow/client/domain';

// Infrastructure → Domain, Application, Core
import { Client } from '@ops-flow/client/domain';
import { CreateClientUseCase } from '@ops-flow/client/application';
```

### ❌ Forbidden Imports
```typescript
// Domain importing from infrastructure (NEVER!)
import { ClientStore } from '@ops-flow/client/infrastructure';

// Domain importing from application (NEVER!)
import { CreateClientUseCase } from '@ops-flow/client/application';

// Cross-domain without proper dependency (check ADR-001)
import { WorkOrder } from '@ops-flow/work-orders/domain'; // in client domain
```

## 🧪 Testing Quick Reference

### Domain Tests (Pure Logic)
```typescript
describe('Client', () => {
  it('should create client with valid data', () => {
    const client = Client.create('Acme Corp', mockContact);
    expect(client.id).toBeDefined();
    expect(client.status).toBe(ClientStatus.Prospect);
  });
});
```

### Use Case Tests (Mock Repository)
```typescript
describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase;
  let mockRepo: jest.Mocked<ClientRepository>;

  beforeEach(() => {
    mockRepo = { save: jest.fn() };
    useCase = new CreateClientUseCase();
    (useCase as any).repository = mockRepo;
  });

  it('should save client via repository', async () => {
    await useCase.execute({ name: 'Acme', primaryContact: mockContact });
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### Component Tests (Mock Store)
```typescript
describe('ClientListComponent', () => {
  let component: ClientListComponent;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      clients: signal([mockClient1, mockClient2]),
      loadClients: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ClientListComponent],
      providers: [{ provide: ClientStore, useValue: mockStore }]
    }).compileComponents();
  });
});
```

## 🔍 Troubleshooting

### "Cannot find module '@ops-flow/...'"
**Fix:** Check `tsconfig.base.json` has path alias configured:
```json
"@ops-flow/client/domain": ["libs/client/domain/src/index.ts"]
```

### "Module boundary violation"
**Fix:** Check `.eslintrc.json` constraints. Example:
- Domain cannot import from infrastructure
- Use `nx graph` to visualize dependencies

### "Property does not exist on type 'unknown'"
**Fix:** Add proper typing to injected services:
```typescript
private repository = inject(ClientRepository); // typed
```

### Tests fail with "Cannot find module"
**Fix:** Ensure `jest.preset.js` has moduleNameMapper configured

## 📐 Nx Project Structure

```bash
# List all projects
nx show projects

# Show project details
nx show project client-domain

# Run command for specific project
nx test client-domain
nx lint client-application
nx build shell

# Affected commands (Git-based)
nx affected:test    # Test changed code
nx affected:lint    # Lint changed code
nx affected:build   # Build changed apps
```

## 🎨 Code Patterns

### Creating an Entity
```typescript
export class Client {
  constructor(
    public readonly id: string,
    public readonly name: string,
    // ... other fields
  ) {
    this.validate();
  }

  static create(name: string): Client {
    return new Client(crypto.randomUUID(), name);
  }

  private validate(): void {
    if (!this.name) throw new Error('Name required');
  }
}
```

### Creating a Use Case
```typescript
@Injectable()
export class CreateClientUseCase {
  private repository = inject(ClientRepository);

  async execute(command: CreateClientCommand): Promise<Client> {
    const client = Client.create(command.name, command.contact);
    await this.repository.save(client);
    return client;
  }
}
```

### Creating a Signal Store
```typescript
export const ClientStore = signalStore(
  { providedIn: 'root' },
  withState({ clients: [], loading: false }),
  withComputed(({ clients }) => ({
    activeClients: computed(() => clients().filter(c => c.status === 'active'))
  })),
  withMethods((store, useCase = inject(ListClientsUseCase)) => ({
    async loadClients() {
      patchState(store, { loading: true });
      const clients = await useCase.execute();
      patchState(store, { clients, loading: false });
    }
  }))
);
```

### Creating a Component
```typescript
@Component({
  selector: 'ops-client-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (store.loading()) {
      <p>Loading...</p>
    } @else {
      @for (client of store.clients(); track client.id) {
        <div>{{ client.name }}</div>
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

## 📚 File Naming Conventions

```
client.entity.ts              # Domain entity
email.vo.ts                   # Value object
client.repository.ts          # Repository interface (port)
create-client.use-case.ts     # Use case
client-http.repository.ts     # Repository implementation
client.mapper.ts              # DTO mapper
client.store.ts               # Signal store
client-list.component.ts      # Component
client.routes.ts              # Route configuration
providers.ts                  # DI provider functions
```

## 🔗 Essential Links

- [Full Architecture](README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Known Improvements](KNOWN-IMPROVEMENTS.md)
- [Phase 1 Summary](PHASE-1-SUMMARY.md)
- [ADR-001: DDD Boundaries](docs/adr/001-ddd-with-nx-boundaries.md)
- [ADR-002: State Management](docs/adr/002-signal-state-management.md)
- [ADR-003: DI Patterns](docs/adr/003-route-composition-roots.md)

## 🆘 Need Help?

1. Check [CONTRIBUTING.md](CONTRIBUTING.md) for workflows
2. Review [ADRs](docs/adr/) for architectural decisions
3. Study `libs/client/` for reference implementation
4. Run `nx graph` to visualize dependencies
5. Check TypeScript errors - they often indicate boundary violations
