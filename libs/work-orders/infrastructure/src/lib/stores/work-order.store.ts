// Work Order Store - Infrastructure Layer
import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { WorkOrder, WorkOrderStatus } from '@ops-flow/work-orders/domain';
import {
  ListWorkOrdersUseCase,
  CreateWorkOrderUseCase,
  UpdateWorkOrderStatusUseCase
} from '@ops-flow/work-orders/application';

interface WorkOrderState {
  workOrders: WorkOrder[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: WorkOrderState = {
  workOrders: [],
  selectedId: null,
  loading: false,
  error: null
};

export const WorkOrderStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ workOrders, selectedId }) => ({
    selectedWorkOrder: computed(() =>
      workOrders().find(w => w.id === selectedId()) ?? null
    ),
    draftWorkOrders: computed(() =>
      workOrders().filter(w => w.status === WorkOrderStatus.Draft)
    ),
    scheduledWorkOrders: computed(() =>
      workOrders().filter(w => w.status === WorkOrderStatus.Scheduled)
    ),
    inProgressWorkOrders: computed(() =>
      workOrders().filter(w => w.status === WorkOrderStatus.InProgress)
    ),
    completedWorkOrders: computed(() =>
      workOrders().filter(w => w.status === WorkOrderStatus.Completed)
    )
  })),
  withMethods((store) => {
    const listWorkOrders = inject(ListWorkOrdersUseCase);
    const createWorkOrder = inject(CreateWorkOrderUseCase);
    const updateStatus = inject(UpdateWorkOrderStatusUseCase);

    return {
      async loadWorkOrders() {
        patchState(store, { loading: true, error: null });
        try {
          const workOrders = await listWorkOrders.execute();
          patchState(store, { workOrders, loading: false });
        } catch (error: any) {
          patchState(store, { error: error.message, loading: false });
        }
      },

      selectWorkOrder(id: string) {
        patchState(store, { selectedId: id });
      },

      async createWorkOrder(title: string, description: string, clientId: string) {
        patchState(store, { loading: true, error: null });
        try {
          const workOrder = await createWorkOrder.execute({ title, description, clientId });
          patchState(store, {
            workOrders: [...store.workOrders(), workOrder],
            loading: false
          });
        } catch (error: any) {
          patchState(store, { error: error.message, loading: false });
        }
      },

      async scheduleWorkOrder(id: string, scheduledDate: Date, assignedTo: string) {
        patchState(store, { loading: true, error: null });
        try {
          const updated = await updateStatus.execute({
            id,
            action: 'schedule',
            scheduledDate,
            assignedTo
          });
          this.replaceWorkOrder(updated);
          patchState(store, { loading: false });
        } catch (error: any) {
          patchState(store, { error: error.message, loading: false });
        }
      },

      async startWorkOrder(id: string) {
        patchState(store, { loading: true, error: null });
        try {
          const updated = await updateStatus.execute({ id, action: 'start' });
          this.replaceWorkOrder(updated);
          patchState(store, { loading: false });
        } catch (error: any) {
          patchState(store, { error: error.message, loading: false });
        }
      },

      async completeWorkOrder(id: string) {
        patchState(store, { loading: true, error: null });
        try {
          const updated = await updateStatus.execute({ id, action: 'complete' });
          this.replaceWorkOrder(updated);
          patchState(store, { loading: false });
        } catch (error: any) {
          patchState(store, { error: error.message, loading: false });
        }
      },

      async cancelWorkOrder(id: string, reason?: string) {
        patchState(store, { loading: true, error: null });
        try {
          const updated = await updateStatus.execute({
            id,
            action: 'cancel',
            cancelReason: reason
          });
          this.replaceWorkOrder(updated);
          patchState(store, { loading: false });
        } catch (error: any) {
          patchState(store, { error: error.message, loading: false });
        }
      },

      replaceWorkOrder(updated: WorkOrder) {
        const workOrders = store.workOrders().map(w =>
          w.id === updated.id ? updated : w
        );
        patchState(store, { workOrders });
      }
    };
  })
);
