import { LlmAgent, type ReadonlyContext } from '@google/adk';
import { ClientToolset } from './ag-ui/client-tools';
import { weatherTools } from './tools';

export const weatherAgent = new LlmAgent({
  name: 'weather_agent',
  model: process.env.GEMINI_MODEL ?? 'gemini-3.8-flash',
  description: 'Answers questions about the weather with real Open-Meteo data.',
  instruction,
  tools: [...weatherTools, new ClientToolset()],
  generateContentConfig: {
    temperature: 0.3,
    // With thinking on, Gemini sometimes returns an empty reply when it needs several tools.
    thinkingConfig: { thinkingBudget: 0 },
  },
});

/** Rebuilt for every turn, so the agent always sees what the dashboard shows right now. */
function instruction(context: ReadonlyContext): string {
  const dashboard = context.state.get<string>('dashboard') ?? 'unknown';

  return `
You are the assistant inside a weather app. The dashboard next to you shows:
${dashboard}

How to answer:
- Answer with components: call one or more show_* tools, then write at most two short sentences
  (under 40 words). The components already show the numbers, so do not list them.
  Say what they mean for the question, e.g. "Go for Saturday: dry and calm until the evening."
- Show each component once. Put notes and the best day in the first call instead of calling again.
- If the user names no place, use the dashboard location.
- Tools take city or town names. For lakes, mountains or regions use the nearest town
  (Lake Sevan → Sevan).
- Forecasts reach 16 days ahead. For later dates use show_history for the same period last year
  and say it is typical weather, not a forecast.
- If the user wants the dashboard to show another place, call set_location.
  If they ask for Fahrenheit or Celsius, call set_units.
- Use the dashboard units in your sentences. Write plain text, no Markdown.
- If a tool returns an error, say what went wrong in one sentence.
`;
}
