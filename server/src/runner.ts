import { InMemoryRunner } from '@google/adk';
import { weatherAgent } from './agent';

/** Runs the agent and keeps sessions in memory. They are lost when the server restarts. */
export const runner = new InMemoryRunner({ agent: weatherAgent, appName: 'weather' });
