import type { RenderToolCallConfig } from '@copilotkit/angular';
import { z } from 'zod';
import { CompareCard } from './compare-card';
import { DaysCard } from './days-card';
import { HistoryCard } from './history-card';
import { NowCard } from './now-card';
import { TimelineChart } from './timeline-chart';

/**
 * One component per server tool. When the agent calls a tool, CopilotKit renders the matching
 * component in the chat and passes it the call's arguments, status and result.
 */
export const weatherViews: RenderToolCallConfig<any>[] = [
  { name: 'show_now', args: z.object({ place: z.string() }), component: NowCard },
  { name: 'show_days', args: z.object({ place: z.string(), from: z.string(), to: z.string() }), component: DaysCard },
  { name: 'show_timeline', args: z.object({ place: z.string(), metrics: z.array(z.string()) }), component: TimelineChart },
  { name: 'show_history', args: z.object({ place: z.string(), from: z.string(), to: z.string() }), component: HistoryCard },
  { name: 'compare_places', args: z.object({ places: z.array(z.string()) }), component: CompareCard },
];
