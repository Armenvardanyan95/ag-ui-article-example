import type { Request, Response } from 'express';
import { StreamingMode } from '@google/adk';
import { EventType, RunAgentInputSchema, type AGUIEvent } from '@ag-ui/core';
import { EventEncoder } from '@ag-ui/encoder';
import { runner } from '../runner';
import { toAgUiEvents } from './bridge';
import { toAdkMessage, toStateDelta } from './input';
import { sessionFor } from './sessions';

/** POST /agent: takes an AG-UI RunAgentInput and streams AG-UI events back as Server-Sent Events. */
export async function agentEndpoint(req: Request, res: Response): Promise<void> {
  const input = RunAgentInputSchema.parse(req.body);
  const { threadId, runId } = input;

  // The browser closes the connection when the user presses stop. That aborts the ADK run.
  const abort = new AbortController();
  res.on('close', () => abort.abort());

  const encoder = new EventEncoder();
  res.writeHead(200, { 'Content-Type': encoder.getContentType(), 'Cache-Control': 'no-cache' });
  const send = (event: AGUIEvent) => res.write(encoder.encodeSSE(event));

  send({ type: EventType.RUN_STARTED, threadId, runId });

  try {
    const session = await sessionFor(threadId);
    const adkEvents = runner.runAsync({
      userId: session.userId,
      sessionId: session.id,
      newMessage: toAdkMessage(input),
      stateDelta: toStateDelta(input),
      runConfig: { streamingMode: StreamingMode.SSE },
      abortSignal: abort.signal,
    });

    for await (const event of toAgUiEvents(adkEvents)) {
      send(event);
    }
    send({ type: EventType.RUN_FINISHED, threadId, runId });
  } catch (error) {
    if (!abort.signal.aborted) {
      const message = error instanceof Error ? error.message : String(error);
      send({ type: EventType.RUN_ERROR, message });
    }
  }

  res.end();
}
