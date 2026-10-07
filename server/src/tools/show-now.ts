import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { geocode, getForecast } from '../../../shared/open-meteo';
import type { NowResult } from '../../../shared/weather';
import { runSafely } from './run-safely';

export const showNow = new FunctionTool({
  name: 'show_now',
  description: 'Shows a card with the current conditions and today\'s range for a place.',
  parameters: z.object({
    place: z.string().describe('City name, e.g. "Yerevan" or "Paris, France".'),
  }),
  execute: ({ place }) =>
    runSafely(async (): Promise<NowResult> => {
      const location = await geocode(place);
      const forecast = await getForecast(location);
      return { place: location, current: forecast.current, today: forecast.days[0] };
    }),
});
