import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmInventoryConsumptionUseCase, ListStockItemsUseCase, ReserveInventoryPartsUseCase } from '@ops-flow/inventory/application';
import { StockItem } from '@ops-flow/inventory/domain';

@Component({
  standalone: true,
  selector: 'ops-inventory-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Inventory</p>
          <h1>Reserve parts and confirm consumption</h1>
          <p class="lede">Reservations and consumption updates are traced on each stock item so completion can fail safely when stock is short.</p>
        </div>
        <button type="button" class="ghost" (click)="refresh()">Refresh</button>
      </header>

      <section class="panel">
        <div class="panel-head">
          <h2>Stock Ledger</h2>
          <span>{{ stockItems.length }} items</span>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>On Hand</th>
                <th>Reserved</th>
                <th>Consumed</th>
                <th>Available</th>
                <th>Latest Movement</th>
              </tr>
            </thead>
            <tbody>
              @for (item of stockItems; track item.id) {
                <tr>
                  <td>{{ item.sku }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.onHandQty }}</td>
                  <td>{{ item.reservedQty }}</td>
                  <td>{{ item.consumedQty }}</td>
                  <td>{{ item.availableQty }}</td>
                  <td>{{ item.movements.at(-1)?.type ?? 'none' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="grid">
        <article class="panel">
          <h2>Reserve parts</h2>
          <label>
            Work order ID
            <input [(ngModel)]="reserveWorkOrderId" name="reserveWorkOrderId" type="text" />
          </label>
          <label>
            Stock item
            <select [(ngModel)]="reserveStockItemId" name="reserveStockItemId">
              @for (item of stockItems; track item.id) {
                <option [value]="item.id">{{ item.sku }} - {{ item.name }}</option>
              }
            </select>
          </label>
          <label>
            Quantity
            <input [(ngModel)]="reserveQuantity" name="reserveQuantity" type="number" min="1" />
          </label>
          <button type="button" class="primary" (click)="reservePartsForWorkOrder()">Reserve</button>
        </article>

        <article class="panel">
          <h2>Confirm consumption</h2>
          <label>
            Work order ID
            <input [(ngModel)]="consumeWorkOrderId" name="consumeWorkOrderId" type="text" />
          </label>
          <label>
            Stock item
            <select [(ngModel)]="consumeStockItemId" name="consumeStockItemId">
              @for (item of stockItems; track item.id) {
                <option [value]="item.id">{{ item.sku }} - {{ item.name }}</option>
              }
            </select>
          </label>
          <label>
            Quantity
            <input [(ngModel)]="consumeQuantity" name="consumeQuantity" type="number" min="1" />
          </label>
          <button type="button" class="primary" (click)="confirmConsumptionForWorkOrder()">Confirm</button>
        </article>
      </section>

      @if (errorMessage) {
        <p class="feedback error">{{ errorMessage }}</p>
      }
      @if (successMessage) {
        <p class="feedback success">{{ successMessage }}</p>
      }
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100%;
      background:
        radial-gradient(circle at top left, rgba(59, 130, 246, 0.28), transparent 30%),
        radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 24%),
        linear-gradient(180deg, #08101f 0%, #0f172a 100%);
      color: #e5eef9;
    }

    .shell {
      max-width: 1180px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .eyebrow {
      margin: 0 0 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.22em;
      color: #93c5fd;
      font-size: 0.76rem;
    }

    h1, h2, p {
      margin-top: 0;
    }

    h1 {
      margin-bottom: 0.5rem;
      font-size: clamp(2rem, 4vw, 3.25rem);
    }

    .lede {
      max-width: 60ch;
      color: #bfd2ea;
      margin-bottom: 0;
    }

    .panel {
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 18px;
      padding: 1.25rem;
      box-shadow: 0 18px 50px rgba(2, 6, 23, 0.34);
      backdrop-filter: blur(16px);
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      color: #bfd2ea;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }

    .table-wrap {
      overflow-x: auto;
    }

    table {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
    }

    th, td {
      padding: 0.85rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    }

    th {
      color: #93c5fd;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.78rem;
    }

    label {
      display: grid;
      gap: 0.4rem;
      margin-bottom: 0.9rem;
      color: #d9e6f7;
    }

    input, select {
      width: 100%;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.24);
      background: rgba(8, 15, 31, 0.9);
      color: #f8fafc;
      padding: 0.8rem 0.9rem;
    }

    .primary, .ghost {
      border: 0;
      border-radius: 999px;
      padding: 0.85rem 1.1rem;
      font-weight: 700;
      cursor: pointer;
    }

    .primary {
      background: linear-gradient(135deg, #7dd3fc, #60a5fa);
      color: #0f172a;
    }

    .ghost {
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: rgba(15, 23, 42, 0.72);
      color: #dbeafe;
    }

    .feedback {
      margin-top: 1rem;
      padding: 0.9rem 1rem;
      border-radius: 12px;
    }

    .feedback.error {
      background: rgba(127, 29, 29, 0.55);
      color: #fecaca;
    }

    .feedback.success {
      background: rgba(20, 83, 45, 0.55);
      color: #bbf7d0;
    }

    @media (max-width: 720px) {
      .hero {
        flex-direction: column;
        align-items: start;
      }
    }
  `]
})
export class InventoryPageComponent implements OnInit {
  private listStockItemsUseCase = inject(ListStockItemsUseCase);
  private reserveInventoryPartsUseCase = inject(ReserveInventoryPartsUseCase);
  private confirmInventoryConsumptionUseCase = inject(ConfirmInventoryConsumptionUseCase);

  stockItems: StockItem[] = [];
  reserveWorkOrderId = 'work-order-1001';
  reserveStockItemId = 'stock-1';
  reserveQuantity = 1;
  consumeWorkOrderId = 'work-order-1001';
  consumeStockItemId = 'stock-1';
  consumeQuantity = 1;
  successMessage = '';
  errorMessage = '';

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.stockItems = await this.listStockItemsUseCase.execute();
  }

  async reservePartsForWorkOrder(): Promise<void> {
    try {
      await this.reserveInventoryPartsUseCase.execute({
        workOrderId: this.reserveWorkOrderId,
        parts: [{ stockItemId: this.reserveStockItemId, quantity: Number(this.reserveQuantity) }]
      });
      this.setSuccess('Reservation recorded.');
      await this.refresh();
    } catch (error: any) {
      this.setError(error.message);
    }
  }

  async confirmConsumptionForWorkOrder(): Promise<void> {
    try {
      await this.confirmInventoryConsumptionUseCase.execute({
        workOrderId: this.consumeWorkOrderId,
        parts: [{ stockItemId: this.consumeStockItemId, quantity: Number(this.consumeQuantity) }]
      });
      this.setSuccess('Consumption confirmed.');
      await this.refresh();
    } catch (error: any) {
      this.setError(error.message);
    }
  }

  private setSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
  }

  private setError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
  }
}