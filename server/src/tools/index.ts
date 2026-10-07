import { comparePlaces } from './compare-places';
import { showDays } from './show-days';
import { showHistory } from './show-history';
import { showNow } from './show-now';
import { showTimeline } from './show-timeline';

/** Server tools. Each one fetches real data and is rendered as a component in the chat. */
export const weatherTools = [showNow, showDays, showTimeline, showHistory, comparePlaces];
