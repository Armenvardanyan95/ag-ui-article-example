import { inject } from '@angular/core';
import { registerFrontendTool } from '@copilotkit/angular';
import { z } from 'zod';
import { ActionNote } from '../views/action-note';
import { WeatherStore } from '../weather/weather-store';

/**
 * Tools that run in the browser. CopilotKit sends their JSON Schema to the agent with every run.
 * When the agent calls one, the handler runs here and its return value goes back to the agent
 * as the tool result. Call this from an injection context.
 */
export function registerDashboardTools(): void {
  const store = inject(WeatherStore);

  registerFrontendTool({
    name: 'set_location',
    description: 'Switches the dashboard to another place.',
    parameters: z.object({
      place: z.string().describe('City name, e.g. "Tbilisi".'),
    }),
    component: ActionNote,
    handler: async ({ place }) => {
      const found = await store.setLocation(place);
      return `The dashboard now shows ${found.name}, ${found.country}.`;
    },
  });

  registerFrontendTool({
    name: 'set_units',
    description: 'Switches the dashboard between Celsius and km/h (metric) and Fahrenheit and mph (imperial).',
    parameters: z.object({
      units: z.enum(['metric', 'imperial']),
    }),
    component: ActionNote,
    handler: async ({ units }) => {
      store.units.set(units);
      return `The dashboard now uses ${units} units.`;
    },
  });
}
