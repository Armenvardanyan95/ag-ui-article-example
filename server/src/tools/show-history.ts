import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { geocode, getHistory, getNormal, summarize } from '../../../shared/open-meteo';
import type { HistoryResult } from '../../../shared/weather';
import { runSafely } from './run-safely';

export const showHistory = new FunctionTool({
  name: 'show_history',
  description:
    'Shows how a past period (up to yesterday) compared with the 1991–2020 average. ' +
    'Use it for "how was August", "was this summer hotter than usual", and for questions ' +
    'about dates more than 16 days ahead: show the same period last year and say it is typical weather, not a forecast.',
  parameters: z.object({
    place: z.string().describe('City name.'),
    from: z.string().describe('First day, YYYY-MM-DD.'),
    to: z.string().describe('Last day, YYYY-MM-DD, no later than yesterday. At most one year after `from`.'),
  }),
  execute: ({ place, from, to }) =>
    runSafely(async (): Promise<HistoryResult> => {
      const location = await geocode(place);
      const days = await getHistory(location, from, to);
      const normal = await getNormal(location, days);
      return { place: location, from, to, actual: summarize(days), normal, days };
    }),
});
