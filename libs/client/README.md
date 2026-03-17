# Client Domain

> **Domain Type:** Foundational  
> **Owner:** Customer Success Team  
> **Dependencies:** None

## Overview

The Client domain manages customer records, contacts, and service history for field service operations. It is a foundational domain with no dependencies on other domains.

## Bounded Context

```
┌─────────────────────────────────────────────┐
│             Client Domain                    │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │         Aggregates                    │  │
│  │  - Client (root)                      │  │
│  │  - Contact                            │  │
│  │  - Address                            │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │       Value Objects                   │  │
│  │  - Email                              │  │
│  │  - PhoneNumber                        │  │
│  │  - ClientStatus                       │  │
│  └──────────────────────────────────────┘  │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │       Domain Services                 │  │
│  │  - ClientDuplicationChecker           │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Ubiquitous Language

| Term | Definition |
|------|------------|
| **Client** | A business or individual that contracts field services |
| **Active Client** | Client with status = 'active' and current contract |
| **Service History** | Record of past work orders for a client |
| **Primary Contact** | Main point of contact for scheduling/billing |
| **Billing Contact** | Contact for invoices (may differ from primary) |

## Domain Model

### Client Aggregate

```typescript
class Client {
  id: string;
  name: string;
  status: ClientStatus;
  primaryContact: Contact;
  billingContact: Contact;
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Invariants:**
- Every client must have at least one contact
- Active clients must have a valid billing contact
- Client name must be unique within tenant
- Status transitions: `prospect → active → inactive` (only forward)

### Contact

```typescript
class Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: Email;
  phone: PhoneNumber;
  role: ContactRole; // 'primary' | 'billing' | 'technical'
}
```

### Address

```typescript
class Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  type: AddressType; // 'service' | 'billing'
  isDefault: boolean;
}
```

## Use Cases

### Commands (Write Operations)

| Use Case | Description | Input | Output |
|----------|-------------|-------|--------|
| `CreateClient` | Register new client | `{ name, primaryContact, address }` | `Client` |
| `UpdateClient` | Modify client details | `{ id, updates }` | `Client` |
| `ActivateClient` | Move prospect to active | `{ id }` | `Client` |
| `DeactivateClient` | Mark client as inactive | `{ id, reason }` | `void` |
| `AddContact` | Add secondary contact | `{ clientId, contact }` | `Contact` |
| `UpdateContact` | Modify contact info | `{ id, updates }` | `Contact` |
| `AddAddress` | Add service/billing address | `{ clientId, address }` | `Address` |

### Queries (Read Operations)

| Use Case | Description | Input | Output |
|----------|-------------|-------|--------|
| `GetClient` | Fetch by ID | `{ id }` | `Client` |
| `ListClients` | Search/filter clients | `{ status?, name? }` | `Client[]` |
| `GetClientContacts` | Get all contacts | `{ clientId }` | `Contact[]` |
| `SearchByName` | Fuzzy name search | `{ query }` | `Client[]` |

## Business Rules

1. **Client Name Uniqueness**  
   No two active clients in same tenant can have identical names.  
   *Enforcement:* `ClientDuplicationChecker` domain service

2. **Contact Requirement**  
   Every client must maintain at least one primary contact.  
   *Enforcement:* Client aggregate invariant

3. **Status Transitions**  
   Clients can only move forward in status (prospect → active → inactive).  
   *Enforcement:* `ClientStatus` value object

4. **Address Requirement**  
   Active clients must have at least one service address.  
   *Enforcement:* `ActivateClientUseCase`

## Layer Structure

```
libs/client/
  ├── domain/                    # Pure business logic
  │   ├── entities/
  │   │   ├── client.entity.ts
  │   │   ├── contact.entity.ts
  │   │   └── address.entity.ts
  │   ├── value-objects/
  │   │   ├── email.vo.ts
  │   │   ├── phone-number.vo.ts
  │   │   └── client-status.vo.ts
  │   ├── services/
  │   │   └── client-duplication-checker.service.ts
  │   └── ports/
  │       └── client.repository.ts
  │
  ├── application/               # Use cases
  │   ├── commands/
  │   │   ├── create-client.use-case.ts
  │   │   ├── update-client.use-case.ts
  │   │   └── activate-client.use-case.ts
  │   ├── queries/
  │   │   ├── get-client.use-case.ts
  │   │   └── list-clients.use-case.ts
  │   └── providers.ts
  │
  ├── infrastructure/            # Technical details
  │   ├── repositories/
  │   │   └── client-http.repository.ts
  │   ├── mappers/
  │   │   ├── client.mapper.ts
  │   │   └── contact.mapper.ts
  │   ├── stores/
  │   │   └── client.store.ts
  │   └── providers.ts
  │
  └── presentation/              # UI
      ├── pages/
      │   ├── client-list.component.ts
      │   └── client-detail.component.ts
      ├── components/
      │   ├── client-form.component.ts
      │   └── contact-list.component.ts
      └── client.routes.ts
```

## API Endpoints (Backend Contract)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/clients` | List clients (supports `?status=active&search=ABC`) |
| `GET` | `/api/clients/:id` | Get single client |
| `POST` | `/api/clients` | Create client |
| `PATCH` | `/api/clients/:id` | Update client |
| `POST` | `/api/clients/:id/activate` | Activate client |
| `POST` | `/api/clients/:id/deactivate` | Deactivate client |
| `GET` | `/api/clients/:id/contacts` | List contacts |
| `POST` | `/api/clients/:id/contacts` | Add contact |

## State Management

### ClientStore (Signal Store)

```typescript
interface ClientState {
  clients: Client[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: ClientStatus | null;
    search: string;
  };
}

// Computed signals
selectedClient: Signal<Client | null>
activeClients: Signal<Client[]>
filteredClients: Signal<Client[]>

// Methods
loadClients(): Promise<void>
selectClient(id: string): void
createClient(data: CreateClientDto): Promise<Client>
updateClient(id: string, updates: Partial<Client>): Promise<void>
```

## Cross-Domain Interactions

### Outbound (This domain provides to others)

- **Contracts Domain:** Reads client data for contract creation
- **Work Orders Domain:** References client for job assignment
- **Billing Domain:** Uses client for invoice generation

### Inbound (This domain consumes from others)

*None* - Client is foundational and has no dependencies.

## Testing Strategy

### Domain Layer
- ✅ Unit test all entities, value objects, domain services
- ✅ Test invariant enforcement
- ✅ Test status transitions

### Application Layer
- ✅ Mock repositories
- ✅ Test use case logic and error handling
- ✅ Test business rule orchestration

### Infrastructure
- ✅ Mock HttpClient
- ✅ Test mappers (DTO ↔ Domain)
- ✅ Test store state updates

### Presentation
- ✅ Mock stores
- ✅ Test user interactions
- ✅ Test form validation

## Known Issues & Future Work

1. **Search Performance:** Current search is case-sensitive DB query. Consider full-text search (Elasticsearch) if catalog grows >10K clients.

2. **Client Merge:** No way to merge duplicate clients. Needed for data cleanup.

3. **Contact History:** No audit trail for contact changes. Add if compliance requires.

## Examples

### Creating a Client (Use Case)

```typescript
const createClient = inject(CreateClientUseCase);

const client = await createClient.execute({
  name: 'Acme Corp',
  primaryContact: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@acme.com',
    phone: '+1-555-0100',
    role: 'primary'
  },
  addresses: [{
    street: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
    type: 'service',
    isDefault: true
  }]
});
```

### Component Usage

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

## References

- [ADR-001: DDD with Nx Boundaries](../../docs/adr/001-ddd-with-nx-boundaries.md)
- [Client Entity Tests](domain/src/lib/entities/client.entity.spec.ts)
- [API Specification](https://api.opsflow.dev/docs#tag/clients)
