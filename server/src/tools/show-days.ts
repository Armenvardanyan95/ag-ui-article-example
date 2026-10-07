import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { geocode, getForecast } from '../../../shared/open-meteo';
import type { DaysResult } from '../../../shared/weather';
import { runSafely } from './run-safely';

export const showDays = new FunctionTool({
  name: 'show_days',
  description:
    'Shows one card per day for a date range within the next 16 days. ' +
    'Use it for "this week", "the weekend", "which day is best for X". ' +
    'Add a short note to the days that matter and mark the best day if the user is choosing.',
  parameters: z.object({
    place: z.string().describe('City name.'),
    from: z.string().describe('First day, YYYY-MM-DD.'),
    to: z.string().describe('Last day, YYYY-MM-DD. At most 16 days from today.'),
    notes: z
      .array(z.object({ date: z.string(), note: z.string().describe('A few words, e.g. "Dry until 19:00".') }))
      .optional(),
    best: z.string().optional().describe('The recommended day, YYYY-MM-DD.'),
  }),
  execute: ({ place, from, to, notes = [], best }) =>
    runSafely(async (): Promise<DaysResult> => {
      const location = await geocode(place);
      const forecast = await getForecast(location, { from, to });
      const days = forecast.days.map((day) => ({
        ...day,
        note: notes.find((n) => n.date === day.date)?.note,
      }));
      return { place: location, days, best };
    }),
});
