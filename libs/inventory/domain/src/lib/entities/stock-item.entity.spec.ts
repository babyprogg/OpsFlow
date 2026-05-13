import { StockItem, StockMovementType } from './stock-item.entity';

describe('StockItem', () => {
  it('should prevent reservation when stock would underflow', () => {
    const item = StockItem.create('FILTER-100', 'HVAC Filter', 2);

    expect(() => item.reserve(3, 'work-order-1')).toThrow('Insufficient stock for FILTER-100');
  });

  it('should reserve and consume stock with traceable movements', () => {
    const item = StockItem.create('FILTER-100', 'HVAC Filter', 5);

    const reserved = item.reserve(2, 'work-order-1');
    const consumed = reserved.confirmConsumption(1, 'work-order-1');

    expect(reserved.reservedQty).toBe(2);
    expect(reserved.availableQty).toBe(3);
    expect(reserved.movements[0].type).toBe(StockMovementType.Reserved);
    expect(reserved.movements[0].workOrderId).toBe('work-order-1');

    expect(consumed.reservedQty).toBe(1);
    expect(consumed.consumedQty).toBe(1);
    expect(consumed.movements.at(-1)?.type).toBe(StockMovementType.ConsumptionConfirmed);
  });

  it('should allow consumption rollback by reversing consumed stock', () => {
    const item = StockItem.create('BELT-200', 'Drive Belt', 4).reserve(2, 'work-order-2').confirmConsumption(2, 'work-order-2');

    const reversed = item.reverseConsumption(2, 'work-order-2');

    expect(reversed.reservedQty).toBe(2);
    expect(reversed.consumedQty).toBe(0);
    expect(reversed.movements.at(-1)?.type).toBe(StockMovementType.ConsumptionReversed);
  });
});