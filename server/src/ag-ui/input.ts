import type { Content, Part } from '@google/genai';
import type { Message, RunAgentInput } from '@ag-ui/core';

/**
 * The client sends the whole conversation on every run, but the ADK session already
 * holds the history. So we only pass on what is new since the last assistant turn:
 * the user's message, or the results of tools that ran in the browser.
 */
export function toAdkMessage(input: RunAgentInput): Content {
  const lastAssistant = input.messages.findLastIndex((m) => m.role === 'assistant');
  const fresh = input.messages.slice(lastAssistant + 1);
  const clientTools = new Set(input.tools.map((t) => t.name));
  const toolNames = toolNamesById(input.messages);

  const parts = fresh.flatMap((message): Part[] => {
    if (message.role === 'user') {
      return [{ text: textOf(message.content) }];
    }
    const name = message.role === 'tool' ? toolNames.get(message.toolCallId) : undefined;
    if (message.role === 'tool' && name && clientTools.has(name)) {
      return [{ functionResponse: { id: message.toolCallId, name, response: { result: message.content } } }];
    }
    return [];
  });

  return { role: 'user', parts };
}

/** Values the agent reads from session state: the client's tools and what the dashboard shows. */
export function toStateDelta(input: RunAgentInput): Record<string, unknown> {
  return {
    client_tools: input.tools,
    dashboard: input.context.map((c) => `${c.description}: ${c.value}`).join('\n'),
  };
}

function toolNamesById(messages: Message[]): Map<string, string> {
  const calls = messages.flatMap((m) => (m.role === 'assistant' ? (m.toolCalls ?? []) : []));
  return new Map(calls.map((call) => [call.id, call.function.name]));
}

function textOf(content: Extract<Message, { role: 'user' }>['content']): string {
  if (typeof content === 'string') return content;
  return content.map((part) => (part.type === 'text' ? part.text : '')).join('');
}
