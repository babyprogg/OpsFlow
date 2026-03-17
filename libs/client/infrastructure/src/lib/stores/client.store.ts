// Client Store - Infrastructure Layer
import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { Client, ClientStatus } from '@ops-flow/client/domain';
import { ListClientsUseCase, CreateClientUseCase } from '@ops-flow/client/application';

interface ClientState {
  clients: Client[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  clients: [],
  selectedId: null,
  loading: false,
  error: null
};

export const ClientStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ clients, selectedId }) => ({
    selectedClient: computed(() => 
      clients().find(c => c.id === selectedId()) ?? null
    ),
    activeClients: computed(() => 
      clients().filter(c => c.status === ClientStatus.Active)
    )
  })),
  withMethods((store) => {
    const listClients = inject(ListClientsUseCase);
    const createClient = inject(CreateClientUseCase);

    return {
      async loadClients() {
        patchState(store, { loading: true, error: null });
        try {
          const clients = await listClients.execute();
          patchState(store, { clients, loading: false });
        } catch (error: any) {
          patchState(store, { error: error.message, loading: false });
        }
      },

      selectClient(id: string) {
        patchState(store, { selectedId: id });
      },

      async createClient(name: string, primaryContact: any) {
        patchState(store, { loading: true, error: null });
        try {
          const client = await createClient.execute({ name, primaryContact });
          patchState(store, { 
            clients: [...store.clients(), client],
            loading: false 
          });
        } catch (error: any) {
          patchState(store, { error: error.message, loading: false });
        }
      }
    };
  })
);
