# ADR-008: Inventory Reservation and Compensation Strategy

**Status:** Accepted  
**Date:** 2026-04-01  
**Deciders:** Architecture Team

## Context

OpsFlow's inventory system must:
- Preserve complete traceability of all stock movements
- Prevent negative stock situations
- Handle failure scenarios gracefully when partial changes occur
- Support auditing of inventory transactions
- Ensure data consistency across distributed operations

Work order completion triggers inventory consumption, which requires coordination between:
1. **Work Orders** - What has been completed
2. **Inventory** - Available stock and movement history
3. **Parts** - Individual stock items and reservations

Key challenges:
- Preventing over-consumption of limited inventory
- Detecting insufficient stock before persistence
- Handling partial failures mid-transaction
- Maintaining audit trail for compliance
- Rolling back failed operations safely
- Coordination between multiple stock items

## Decision

We will implement **Inventory Reservation and Compensation** using a three-phase strategy:

1. **Reservation Phase** - Reserve parts before consumption
2. **Confirmation Phase** - Confirm consumption after validation
3. **Compensation Phase** - Restore stock snapshot on failure

### Domain Boundaries

```
Inventory Domain (libs/inventory/)
├── domain/
│   ├── InventoryItem entity
│   ├── StockReservation entity
│   ├── StockMovement value object
│   ├── ReservationStatus enum
│   ├── InventoryItemRepository port
│   └── StockMovementRepository port
├── application/
│   ├── CompleteInventoryUseCase (orchestrator)
│   ├── ReservationValidator
│   ├── CompensationStrategy
│   └── Error codes and contracts
└── infrastructure/
    └── Repository implementations
```

### Inventory Transaction Flow

```
Input: { workOrderId, parts: [{ partId, quantity }] }
  ↓
1. Load all inventory items for parts
   ✗ → PartNotFound
  ↓
2. Create pre-transaction stock snapshot
   ✓ → Snapshot stored
  ↓
3. PHASE 1: Reserve all parts
   For each part:
     - Check available quantity ≥ required quantity
     ✗ → InsufficientStock (before persistence)
     - Create StockReservation entity
  ↓
4. Persist all reservations
   ✗ → PersistenceFailed
       → Compensation: restore from snapshot
       → Return error with original stock state
  ↓
5. PHASE 2: Confirm consumption (mark reserved as consumed)
   For each part:
     - Reduce reserved quantity
     - Record StockMovement entry
  ↓
6. Persist all movements
   ✗ → PersistenceFailed
       → Compensation: restore from snapshot
       → Return error with original stock state
  ↓
7. Record completion audit log
   ✓ → Transaction complete
```

### Stock Movement Records

Each inventory item tracks:
```typescript
interface StockMovement {
  id: UUID;
  inventoryItemId: UUID;
  type: MovementType;           // Reserve, Consume, Compensate, Adjust
  quantity: number;              // Can be negative for compensation
  timestamp: DateTime;
  reference: string;             // workOrderId, reason
  actor: UUID;                    // User or system
}
```

### Error Codes

```typescript
enum InventoryErrorCode {
  PartNotFound,               // Part doesn't exist
  InsufficientStock,          // Not enough quantity available
  ReservationFailed,          // Failed to reserve part
  ConsumptionFailed,          // Failed to confirm consumption
  PersistenceFailed,          // Database write failed
  CompensationFailed,         // Rollback failed (critical)
  SnapshotExpired,            // Snapshot timestamp exceeded TTL
}
```

Each error includes:
- `code` - Machine-readable identifier
- `message` - User-friendly description
- `details` - Additional context (e.g., current stock levels)
- `affectedItems` - List of items affected by failure

### Key Design Decisions

#### 1. Pre-Persistence Validation
**Choice:** Validate sufficient stock before any persistence attempts

**Rationale:**
- Prevents unnecessary database operations
- Fails fast for known issues
- Reduces failed transaction cleanup
- Clearer error reporting for users

#### 2. Pre-Transaction Stock Snapshot
**Choice:** Load and cache complete item state before any modifications

**Rationale:**
- Enables simple all-or-nothing rollback
- No need for complex transaction coordination
- Audit trail captures exact compensation
- Handles partial failures cleanly

#### 3. Compensation Phase with Movement History
**Choice:** Record compensation as explicit movements (not delete/undo)

**Rationale:**
- Preserves complete transaction history
- Enables audit compliance
- Supports investigation of failures
- Clear traceability for support

#### 4. Result-Based Error Handling
**Choice:** Return `InventoryResult` with success flag and restored state

**Rationale:**
- Domain validation is expected behavior
- Enables programmatic failure handling
- Cleaner testing without exception handling
- Consistent with application layer

#### 5. Atomic Reservations per Phase
**Choice:** Reserve all parts first, confirm all second (separate batches)

**Rationale:**
- Reduces lock duration per operation
- Clearer state transitions
- Easier to debug mid-transaction failures
- Allows partial recovery strategies

## Consequences

✅ **Positive:**
- No negative stock possible (validated before persistence)
- Complete audit trail of all movements
- Simple rollback strategy (restore from snapshot)
- Failures detected early
- Clear error reporting with context
- Supports compliance and investigations

⚠️ **Considerations:**
- Requires keeping stock snapshots in memory during transaction
- Two persistence operations per completion (reservation + confirmation)
- Compensation history increases audit log size
- Time window exists between snapshot and persistence (external changes not captured)
- May require distributed transaction patterns if work-order and inventory are separate services

## Future Enhancements

- [ ] Batch compensation with retry logic
- [ ] Predictive stock warnings (low inventory alerts)
- [ ] Reorder point automation
- [ ] Stock expiry and rotation handling (FIFO/LIFO)
- [ ] Multi-warehouse inventory coordination
- [ ] Demand forecasting based on work order patterns
- [ ] Supplier integration for automatic reordering