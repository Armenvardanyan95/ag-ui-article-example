import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { geocode, getForecast } from '../../../shared/open-meteo';
import type { TimelineResult } from '../../../shared/weather';
import { runSafely } from './run-safely';

export const showTimeline = new FunctionTool({
  name: 'show_timeline',
  description:
    'Shows an hour-by-hour chart for one to three days within the next 16 days. ' +
    'Use it for "when", "what time" and "how does it change" questions. ' +
    'Highlight the window that answers the question, e.g. the best time for a run.',
  parameters: z.object({
    place: z.string().describe('City name.'),
    from: z.string().describe('First day, YYYY-MM-DD.'),
    to: z.string().describe('Last day, YYYY-MM-DD. At most 3 days after `from`.'),
    metrics: z
      .array(z.enum(['temperature', 'precipitationProbability', 'windSpeed', 'uvIndex', 'humidity']))
      .min(1)
      .describe('What to plot. Temperature and precipitation probability cover most questions.'),
    highlightFrom: z.string().optional().describe('Start of the highlighted window, YYYY-MM-DDTHH:00.'),
    highlightTo: z.string().optional().describe('End of the highlighted window, YYYY-MM-DDTHH:00.'),
    highlightLabel: z.string().optional().describe('A few words, e.g. "Best time to run".'),
  }),
  execute: ({ place, from, to, metrics, highlightFrom, highlightTo, highlightLabel = '' }) =>
    runSafely(async (): Promise<TimelineResult> => {
      const location = await geocode(place);
      const forecast = await getForecast(location, { from, to });
      const highlight =
        highlightFrom && highlightTo ? { from: highlightFrom, to: highlightTo, label: highlightLabel } : undefined;
      return { place: location, metrics, hours: forecast.hours, highlight };
    }),
});
