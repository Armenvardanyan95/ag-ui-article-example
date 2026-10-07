import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { geocode, getForecast } from '../../../shared/open-meteo';
import type { CompareResult } from '../../../shared/weather';
import { runSafely } from './run-safely';

export const comparePlaces = new FunctionTool({
  name: 'compare_places',
  description: 'Shows the daily forecast for two to four places side by side, for a range within the next 16 days.',
  parameters: z.object({
    places: z.array(z.string()).min(2).max(4).describe('City names.'),
    from: z.string().describe('First day, YYYY-MM-DD.'),
    to: z.string().describe('Last day, YYYY-MM-DD. At most 7 days after `from`.'),
  }),
  execute: ({ places, from, to }) =>
    runSafely(async (): Promise<CompareResult> => ({
      places: await Promise.all(
        places.map(async (name) => {
          const place = await geocode(name);
          const forecast = await getForecast(place, { from, to });
          return { place, days: forecast.days };
        }),
      ),
    })),
});
