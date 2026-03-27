// Work Order List Component - Presentation Layer
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderStore } from '@ops-flow/work-orders/infrastructure';

@Component({
  selector: 'ops-work-order-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-order-list.component.html',
  styleUrls: ['./work-order-list.component.scss']
})
export class WorkOrderListComponent {
  store = inject(WorkOrderStore);

  ngOnInit() {
    this.store.loadWorkOrders();
  }

  onCreateWorkOrder() {
    // TODO: Open modal/navigate to form
    console.log('Create work order clicked');
  }
}
