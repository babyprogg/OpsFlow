import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'ops-root',
  imports: [RouterOutlet],
  template: `
    <div class="app-shell">
      <header class="app-header">
        <h1>OpsFlow</h1>
        <nav>
          <a routerLink="/dashboard">Dashboard</a>
          <a routerLink="/clients">Clients</a>
          <a routerLink="/work-orders">Work Orders</a>
          <a routerLink="/dispatch">Dispatch</a>
        </nav>
      </header>
      <main class="app-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    
    .app-header {
      background: #1a1a2e;
      color: white;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      gap: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .app-header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .app-header nav {
      display: flex;
      gap: 1rem;
    }
    
    .app-header nav a {
      color: #e0e0e0;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    .app-header nav a:hover {
      background: rgba(255,255,255,0.1);
    }
    
    .app-main {
      flex: 1;
      overflow: auto;
      background: #f5f5f5;
    }
  `]
})
export class AppComponent {
  title = 'OpsFlow';
}
