import { randomUUID } from 'node:crypto';
import { getFunctionCalls, getFunctionResponses, type Event } from '@google/adk';
import { EventType, type AGUIEvent } from '@ag-ui/core';

/**
 * Translates ADK events into AG-UI events.
 *
 * With SSE streaming, ADK first yields partial events with pieces of text, then one final
 * event with the whole text. We stream the pieces and use the final event to close the message.
 * Tool calls and tool results only appear in final events.
 */
export async function* toAgUiEvents(events: AsyncIterable<Event>): AsyncGenerator<AGUIEvent> {
  let messageId: string | undefined;
  let answered = false;

  for await (const event of events) {
    if (event.errorCode) {
      throw new Error(event.errorMessage ?? event.errorCode);
    }

    const text = textOf(event);
    answered ||= Boolean(text) || getFunctionCalls(event).length > 0;

    if (event.partial) {
      if (!text) continue;
      if (!messageId) {
        messageId = randomUUID();
        yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };
      }
      yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: text };
      continue;
    }

    if (messageId) {
      yield { type: EventType.TEXT_MESSAGE_END, messageId };
      messageId = undefined;
    } else if (text) {
      yield* wholeMessage(text);
    }

    // ADK gives every function call an id, which links the call to its result.
    for (const call of getFunctionCalls(event)) {
      const toolCallId = call.id!;
      yield { type: EventType.TOOL_CALL_START, toolCallId, toolCallName: call.name! };
      yield { type: EventType.TOOL_CALL_ARGS, toolCallId, delta: JSON.stringify(call.args ?? {}) };
      yield { type: EventType.TOOL_CALL_END, toolCallId };
    }

    for (const response of getFunctionResponses(event)) {
      yield {
        type: EventType.TOOL_CALL_RESULT,
        messageId: randomUUID(),
        toolCallId: response.id!,
        content: JSON.stringify(response.response),
      };
    }

    // A client tool call ends the run. The browser runs the tool and starts a new run with the result.
    if (event.longRunningToolIds?.length) {
      return;
    }
  }

  if (!answered) {
    throw new Error('The model returned an empty answer. Please try again.');
  }
}

function* wholeMessage(text: string): Generator<AGUIEvent> {
  const messageId = randomUUID();
  yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };
  yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: text };
  yield { type: EventType.TEXT_MESSAGE_END, messageId };
}

function textOf(event: Event): string {
  const parts = event.content?.parts ?? [];
  return parts.map((part) => (part.text && !part.thought ? part.text : '')).join('');
}
