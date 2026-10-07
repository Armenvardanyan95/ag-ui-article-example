import { Component } from '@angular/core';
import { connectDashboardContext } from './agent/dashboard-context';
import { registerDashboardTools } from './agent/dashboard-tools';
import { Assistant } from './assistant/assistant';
import { Dashboard } from './weather/dashboard';
import { Sky } from './weather/sky';

@Component({
  selector: 'app-root',
  imports: [Sky, Dashboard, Assistant],
  template: `
    <app-sky />
    <app-dashboard />
    <app-assistant />
  `,
  styles: `
    :host {
      display: flex;
      height: 100dvh;
    }
    app-dashboard {
      flex: 1;
      overflow-y: auto;
    }
    app-assistant {
      width: 480px;
      border-left: 1px solid rgba(255, 255, 255, 0.4);
    }
    @media (max-width: 1100px) {
      app-assistant {
        width: 400px;
      }
    }
    /* Phones: dashboard on top, chat below, the whole page scrolls. */
    @media (max-width: 720px) {
      :host {
        flex-direction: column;
        height: auto;
        min-height: 100dvh;
      }
      app-dashboard {
        flex: none;
        overflow: visible;
      }
      app-assistant {
        flex: 1;
        width: auto;
        border-left: 0;
        border-top: 1px solid rgba(255, 255, 255, 0.4);
      }
    }
  `,
})
export class App {
  constructor() {
    registerDashboardTools();
    connectDashboardContext();
  }
}
