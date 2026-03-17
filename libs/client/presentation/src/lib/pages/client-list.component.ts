// Client List Component - Presentation Layer
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClientStore } from '@ops-flow/client/infrastructure';
import { ClientStatus } from '@ops-flow/client/domain';

@Component({
  selector: 'ops-client-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss']
})
export class ClientListComponent {
  store = inject(ClientStore);

  ngOnInit() {
    this.store.loadClients();
  }

  onCreateClient() {
    // TODO: Open modal/navigate to form
    console.log('Create client clicked');
  }
}
