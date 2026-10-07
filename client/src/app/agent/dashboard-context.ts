import { inject } from '@angular/core';
import { connectAgentContext } from '@copilotkit/angular';
import { WeatherStore } from '../weather/weather-store';

/**
 * Sends what the dashboard shows to the agent as AG-UI context, with every run.
 * The function reads signals, so the context follows the dashboard as it changes.
 * Call this from an injection context.
 */
export function connectDashboardContext(): void {
  const store = inject(WeatherStore);

  connectAgentContext(() => {
    const place = store.place();
    const units = store.units() === 'metric' ? 'metric (°C, km/h, mm)' : 'imperial (°F, mph, in)';
    return {
      description: 'Dashboard',
      value: `Location: ${place.name}, ${place.country}\nToday: ${store.today()}\nUnits: ${units}`,
    };
  });
}
