import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'ops-dashboard',
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h2>Open Work Orders</h2>
          <p class="metric">24</p>
        </div>
        <div class="dashboard-card">
          <h2>SLA Breaches</h2>
          <p class="metric warning">3</p>
        </div>
        <div class="dashboard-card">
          <h2>Active Technicians</h2>
          <p class="metric">12</p>
        </div>
        <div class="dashboard-card">
          <h2>Pending Invoices</h2>
          <p class="metric">8</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
    }
    
    .dashboard h1 {
      margin-bottom: 2rem;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .dashboard-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .dashboard-card h2 {
      font-size: 1rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .metric {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0;
      color: #1a1a2e;
    }
    
    .metric.warning {
      color: #e74c3c;
    }
  `]
})
export class DashboardComponent {}
