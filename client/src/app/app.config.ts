import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpAgent } from '@ag-ui/client';
import { provideCopilotKit } from '@copilotkit/angular';
import { weatherViews } from './views';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideCopilotKit({
      // Talk to our own AG-UI endpoint directly. The dev server proxies /agent to the Node server.
      selfManagedAgents: {
        weather: new HttpAgent({ url: '/agent' }),
      },
      // Server tool calls are rendered as components, matched by tool name.
      renderToolCalls: weatherViews,
      enableInspector: false,
    }),
  ],
};
