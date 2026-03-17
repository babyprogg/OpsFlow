# Contributing to OpsFlow

Thank you for contributing! This guide helps you work effectively within our DDD/Nx architecture.

## 🏗️ Architecture Principles

1. **Domain-Driven Design:** Business logic lives in domain/application layers
2. **Dependency Rules:** Dependencies flow inward (presentation → infrastructure → application → domain)
3. **Nx Boundaries:** Enforced via ESLint - respect layer tags
4. **Signal-First:** Use Angular signals + @ngrx/signals for state
5. **Standalone Components:** No NgModules, use route providers

## 📋 Before You Code

### Read These First
- [README.md](README.md) - Architecture overview
- [ADR-001](docs/adr/001-ddd-with-nx-boundaries.md) - DDD structure
- [ADR-002](docs/adr/002-signal-state-management.md) - State patterns
- [ADR-003](docs/adr/003-route-composition-roots.md) - DI patterns

### Check Existing Code
```bash
# Find similar features
nx graph

# See what depends on what
nx show projects --affected
```

## 🚀 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/add-client-notes
```

### 2. Identify the Domain
Determine which domain your feature belongs to:
- Client management? → `client`
- Work order related? → `work-orders`
- Billing? → `billing`
- Etc.

### 3. Follow the Layer Flow

**Start Bottom-Up:**

#### A. Domain Layer (if needed)
Define entities, value objects, or domain services:

```typescript
// libs/client/domain/src/lib/entities/note.entity.ts
export class ClientNote {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly createdBy: string
  ) {}

  static create(clientId: string, content: string, userId: string): ClientNote {
    return new ClientNote(
      crypto.randomUUID(),
      clientId,
      content,
      new Date(),
      userId
    );
  }
}

// Export from libs/client/domain/src/index.ts
export * from './lib/entities/note.entity';
```

#### B. Application Layer (use case)
Orchestrate business logic:

```typescript
// libs/client/application/src/lib/use-cases/add-note.use-case.ts
import { inject, Injectable } from '@angular/core';
import { ClientRepository } from '@ops-flow/client/domain';
import { ClientNote } from '@ops-flow/client/domain';

@Injectable()
export class AddClientNoteUseCase {
  private repo = inject(ClientRepository);

  async execute(clientId: string, content: string, userId: string): Promise<ClientNote> {
    const note = ClientNote.create(clientId, content, userId);
    await this.repo.addNote(note);
    return note;
  }
}

// Export from libs/client/application/src/index.ts
export * from './lib/use-cases/add-note.use-case';
```

#### C. Infrastructure Layer (repository implementation)
Handle HTTP/storage:

```typescript
// libs/client/infrastructure/src/lib/repositories/client-http.repository.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ClientRepository, ClientNote } from '@ops-flow/client/domain';

@Injectable()
export class ClientHttpRepository implements ClientRepository {
  private http = inject(HttpClient);

  async addNote(note: ClientNote): Promise<void> {
    await this.http.post(`/api/clients/${note.clientId}/notes`, {
      id: note.id,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      createdBy: note.createdBy
    }).toPromise();
  }
}
```

Update store if needed:
```typescript
// libs/client/infrastructure/src/lib/stores/client.store.ts
withMethods((store, addNote = inject(AddClientNoteUseCase)) => ({
  async addNote(clientId: string, content: string) {
    const userId = 'current-user'; // Get from auth
    const note = await addNote.execute(clientId, content, userId);
    patchState(store, { notes: [...store.notes(), note] });
  }
}))
```

#### D. Presentation Layer (UI)
Build the component:

```typescript
// libs/client/presentation/src/lib/components/note-form.component.ts
import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ClientStore } from '@ops-flow/client/infrastructure';

@Component({
  selector: 'ops-note-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <textarea formControlName="content" placeholder="Add a note..."></textarea>
      <button type="submit">Save</button>
    </form>
  `
})
export class NoteFormComponent {
  private fb = inject(FormBuilder);
  private store = inject(ClientStore);
  
  noteAdded = output<void>();

  form = this.fb.group({
    content: ['']
  });

  async onSubmit() {
    const content = this.form.value.content!;
    await this.store.addNote(this.store.selectedClient()!.id, content);
    this.noteAdded.emit();
    this.form.reset();
  }
}
```

### 4. Write Tests

#### Domain Tests (Pure Logic)
```typescript
// libs/client/domain/src/lib/entities/note.entity.spec.ts
describe('ClientNote', () => {
  it('should create note with generated ID', () => {
    const note = ClientNote.create('client-1', 'Test note', 'user-1');
    
    expect(note.id).toBeDefined();
    expect(note.clientId).toBe('client-1');
    expect(note.content).toBe('Test note');
  });
});
```

#### Use Case Tests (Mocked Repo)
```typescript
// libs/client/application/src/lib/use-cases/add-note.use-case.spec.ts
describe('AddClientNoteUseCase', () => {
  let useCase: AddClientNoteUseCase;
  let mockRepo: jest.Mocked<ClientRepository>;

  beforeEach(() => {
    mockRepo = { addNote: jest.fn() };
    useCase = new AddClientNoteUseCase();
    (useCase as any).repo = mockRepo;
  });

  it('should add note via repository', async () => {
    await useCase.execute('client-1', 'Test', 'user-1');
    
    expect(mockRepo.addNote).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'client-1',
        content: 'Test'
      })
    );
  });
});
```

#### Component Tests
```typescript
// libs/client/presentation/src/lib/components/note-form.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoteFormComponent } from './note-form.component';
import { ClientStore } from '@ops-flow/client/infrastructure';

describe('NoteFormComponent', () => {
  let component: NoteFormComponent;
  let fixture: ComponentFixture<NoteFormComponent>;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      selectedClient: jest.fn(() => ({ id: 'client-1' })),
      addNote: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [NoteFormComponent],
      providers: [
        { provide: ClientStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NoteFormComponent);
    component = fixture.componentInstance;
  });

  it('should call store.addNote on submit', async () => {
    component.form.patchValue({ content: 'Test note' });
    await component.onSubmit();
    
    expect(mockStore.addNote).toHaveBeenCalledWith('client-1', 'Test note');
  });
});
```

### 5. Lint & Format
```bash
# Lint your changes
nx lint client-domain client-application client-infrastructure client-presentation

# Format
npm run format
```

### 6. Run Tests
```bash
# Test affected projects
npm run affected:test

# Or specific project
nx test client-application
```

### 7. Commit
```bash
git add .
git commit -m "feat(client): add note creation feature

- Add ClientNote entity
- Implement AddClientNoteUseCase
- Update ClientHttpRepository
- Add NoteFormComponent
- Add unit tests for all layers

Closes #123"
```

## 🧪 Testing Guidelines

### What to Test

| Layer | Test Type | What to Test |
|-------|-----------|--------------|
| Domain | Unit | Entity creation, validation, business rules |
| Application | Unit | Use case logic, error handling |
| Infrastructure | Integration | HTTP calls (mocked), mappers |
| Presentation | Component | User interactions, signal reactivity |

### What NOT to Test
- ❌ Third-party library internals (Angular, RxJS)
- ❌ Simple getters/setters
- ❌ Stubs (pure data interfaces)

### Mock Strategies

**Domain Layer:** No mocks (pure functions)

**Application Layer:** Mock repositories
```typescript
const mockRepo: ClientRepository = {
  findById: jest.fn().mockResolvedValue(new Client(...)),
  save: jest.fn()
};
```

**Infrastructure:** Mock HttpClient
```typescript
const mockHttp = {
  get: jest.fn().mockReturnValue(of(mockData)),
  post: jest.fn().mockReturnValue(of({}))
};
```

**Presentation:** Mock stores
```typescript
const mockStore = {
  clients: signal([mockClient1, mockClient2]),
  loadClients: jest.fn()
};
```

## 🚨 Common Pitfalls

### ❌ Wrong: Importing Across Layers Incorrectly
```typescript
// DON'T: Domain importing from infrastructure
import { ClientStore } from '@ops-flow/client/infrastructure';
```

### ✅ Correct: Respecting Dependencies
```typescript
// Domain defines interface
export abstract class ClientRepository {
  abstract findById(id: string): Promise<Client>;
}

// Infrastructure implements
export class ClientHttpRepository implements ClientRepository { }
```

---

### ❌ Wrong: Business Logic in Components
```typescript
@Component({ ... })
export class ClientFormComponent {
  onSubmit() {
    // ❌ Validation logic in component
    if (this.data.email && !this.data.email.includes('@')) {
      alert('Invalid email');
    }
  }
}
```

### ✅ Correct: Logic in Domain/Application
```typescript
// Domain value object
export class Email {
  private constructor(private value: string) {}

  static create(value: string): Email {
    if (!value.includes('@')) {
      throw new Error('Invalid email');
    }
    return new Email(value);
  }
}

// Component
onSubmit() {
  const email = Email.create(this.form.value.email); // Throws if invalid
  await this.useCase.execute({ email });
}
```

---

### ❌ Wrong: Signal Store in Domain Layer
```typescript
// libs/client/domain/src/lib/client.store.ts  ❌
export const ClientStore = signalStore( ... );
```

### ✅ Correct: Stores in Infrastructure
```typescript
// libs/client/infrastructure/src/lib/stores/client.store.ts  ✅
export const ClientStore = signalStore( ... );
```

---

## 📦 Adding a New Library

```bash
# Use Nx generator (preferred)
npx nx g @nx/workspace:library my-feature --directory=libs/client/my-feature

# Or manually:
mkdir -p libs/client/my-feature/src/lib
touch libs/client/my-feature/project.json
touch libs/client/my-feature/src/index.ts
```

Then add to `tsconfig.base.json`:
```json
"@ops-flow/client/my-feature": ["libs/client/my-feature/src/index.ts"]
```

## 🔍 Code Review Checklist

Before submitting PR:
- [ ] Tests pass (`npm run affected:test`)
- [ ] Lint passes (`npm run affected:lint`)
- [ ] No Nx boundary violations
- [ ] Business logic in correct layer (not in components)
- [ ] Types are strict (no `any`)
- [ ] Public API exported from `index.ts`
- [ ] ADR updated if architectural change
- [ ] KNOWN-IMPROVEMENTS.md updated if debt added

## 🎯 Style Guide

### Naming Conventions
- **Entities:** `Client`, `WorkOrder` (PascalCase nouns)
- **Value Objects:** `Email`, `Money` (PascalCase nouns)
- **Use Cases:** `CreateClientUseCase`, `GetWorkOrderUseCase` (PascalCase, ends with `UseCase`)
- **Repositories:** `ClientRepository`, `WorkOrderRepository` (PascalCase, ends with `Repository`)
- **Stores:** `ClientStore`, `WorkOrderStore` (PascalCase, ends with `Store`)
- **Components:** `client-list.component.ts` (kebab-case)

### File Structure
```
libs/domain/layer/src/
  ├── lib/
  │   ├── entities/
  │   ├── value-objects/
  │   ├── services/
  │   └── ports/
  └── index.ts  (Public API)
```

### Import Order
1. Angular core
2. Third-party
3. Core/shared libs
4. Domain libs
5. Relative imports

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { signalStore } from '@ngrx/signals';

import { AuthService } from '@ops-flow/core/auth';
import { Client } from '@ops-flow/client/domain';

import { ClientService } from './client.service';
```

## 🆘 Getting Help

- **Architecture questions:** Check ADRs in `docs/adr/`
- **"Where does this code go?":** Re-read [ADR-001](docs/adr/001-ddd-with-nx-boundaries.md)
- **Nx commands:** Run `nx list` or `nx help`
- **Debugging boundaries:** Run `nx graph` and inspect dependencies

## 📝 Documentation

When adding a feature, update:
- `README.md` if modifying architecture
- `KNOWN-IMPROVEMENTS.md` if accepting technical debt
- Domain-specific README (create if missing)
- ADR if changing architectural decision

---

**Thank you for maintaining our architectural standards!** 🙏
