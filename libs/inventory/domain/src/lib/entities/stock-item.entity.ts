export enum StockMovementType {
  Reserved = 'reserved',
  ConsumptionConfirmed = 'consumption_confirmed',
  ReservationReleased = 'reservation_released',
  ConsumptionReversed = 'consumption_reversed'
}

export interface StockMovement {
  id: string;
  type: StockMovementType;
  quantity: number;
  workOrderId: string | null;
  reference: string;
  occurredAt: Date;
}

export class StockItem {
  constructor(
    public readonly id: string,
    public readonly sku: string,
    public readonly name: string,
    public readonly onHandQty: number,
    public readonly reservedQty: number,
    public readonly consumedQty: number,
    public readonly movements: StockMovement[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  static create(sku: string, name: string, quantity: number): StockItem {
    return new StockItem(
      crypto.randomUUID(),
      sku,
      name,
      quantity,
      0,
      0,
      [],
      new Date(),
      new Date()
    );
  }

  get availableQty(): number {
    return this.onHandQty - this.reservedQty - this.consumedQty;
  }

  reserve(quantity: number, workOrderId: string, reference = 'work-order-reservation'): StockItem {
    this.ensurePositiveQuantity(quantity, 'reservation');

    if (quantity > this.availableQty) {
      throw new Error(`Insufficient stock for ${this.sku}`);
    }

    return this.rebuild(
      this.reservedQty + quantity,
      this.consumedQty,
      StockMovementType.Reserved,
      quantity,
      workOrderId,
      reference
    );
  }

  confirmConsumption(quantity: number, workOrderId: string, reference = 'work-order-consumption'): StockItem {
    this.ensurePositiveQuantity(quantity, 'consumption');

    if (quantity > this.reservedQty) {
      throw new Error(`Insufficient reserved stock for ${this.sku}`);
    }

    return this.rebuild(
      this.reservedQty - quantity,
      this.consumedQty + quantity,
      StockMovementType.ConsumptionConfirmed,
      quantity,
      workOrderId,
      reference
    );
  }

  releaseReservation(quantity: number, workOrderId: string, reference = 'reservation-release'): StockItem {
    this.ensurePositiveQuantity(quantity, 'reservation release');

    if (quantity > this.reservedQty) {
      throw new Error(`Insufficient reserved stock for ${this.sku}`);
    }

    return this.rebuild(
      this.reservedQty - quantity,
      this.consumedQty,
      StockMovementType.ReservationReleased,
      quantity,
      workOrderId,
      reference
    );
  }

  reverseConsumption(quantity: number, workOrderId: string, reference = 'consumption-reversal'): StockItem {
    this.ensurePositiveQuantity(quantity, 'consumption reversal');

    if (quantity > this.consumedQty) {
      throw new Error(`Insufficient consumed stock for ${this.sku}`);
    }

    return this.rebuild(
      this.reservedQty + quantity,
      this.consumedQty - quantity,
      StockMovementType.ConsumptionReversed,
      quantity,
      workOrderId,
      reference
    );
  }

  private rebuild(
    reservedQty: number,
    consumedQty: number,
    movementType: StockMovementType,
    quantity: number,
    workOrderId: string,
    reference: string
  ): StockItem {
    return new StockItem(
      this.id,
      this.sku,
      this.name,
      this.onHandQty,
      reservedQty,
      consumedQty,
      [
        ...this.movements,
        {
          id: crypto.randomUUID(),
          type: movementType,
          quantity,
          workOrderId,
          reference,
          occurredAt: new Date()
        }
      ],
      this.createdAt,
      new Date()
    );
  }

  private ensurePositiveQuantity(quantity: number, operation: string): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(`Stock quantity for ${operation} must be greater than zero`);
    }
  }

  private validate(): void {
    if (!this.sku || this.sku.trim().length === 0) {
      throw new Error('Stock item SKU is required');
    }

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Stock item name is required');
    }

    if (!Number.isInteger(this.onHandQty) || this.onHandQty < 0) {
      throw new Error('Stock item quantity must be zero or greater');
    }

    if (!Number.isInteger(this.reservedQty) || this.reservedQty < 0) {
      throw new Error('Reserved quantity must be zero or greater');
    }

    if (!Number.isInteger(this.consumedQty) || this.consumedQty < 0) {
      throw new Error('Consumed quantity must be zero or greater');
    }

    if (this.reservedQty + this.consumedQty > this.onHandQty) {
      throw new Error('Stock item quantities cannot exceed on-hand quantity');
    }
  }
}