// Work Order List Component - Presentation Layer
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderStore } from '@ops-flow/work-orders/infrastructure';
import { FormsModule } from '@angular/forms';
import { CompleteWorkOrderAndConsumePartsUseCase } from '@ops-flow/work-orders/application';

@Component({
  selector: 'ops-work-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-order-list.component.html',
  styleUrls: ['./work-order-list.component.scss'],
})
export class WorkOrderListComponent {
  store = inject(WorkOrderStore);
  private completeWorkOrderAndConsumePartsUseCase = inject(CompleteWorkOrderAndConsumePartsUseCase);

  completionWorkOrderId = '';
  completionStockItemId = 'stock-1';
  completionQuantity = 1;
  completionStatus = '';

  ngOnInit() {
    this.store.loadWorkOrders();
  }

  onCreateWorkOrder() {
    // TODO: Open modal/navigate to form
    console.log('Create work order clicked');
  }

  async completeWithParts() {
    try {
      const result = await this.completeWorkOrderAndConsumePartsUseCase.execute({
        workOrderId: this.completionWorkOrderId,
        parts: [
          {
            stockItemId: this.completionStockItemId,
            quantity: Number(this.completionQuantity),
          },
        ],
      });

      this.completionStatus = `${result.workOrder.title} completed with ${result.stockItems.length} part movement(s).`;
      await this.store.loadWorkOrders();
    } catch (error: any) {
      this.completionStatus = error.message;
    }
  }
}
