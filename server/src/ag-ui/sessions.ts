import type { Session } from '@google/adk';
import { runner } from '../runner';

// The demo has no login, so every conversation belongs to one user.
const USER_ID = 'demo-user';

/**
 * AG-UI names a conversation with `threadId`, ADK with `sessionId`.
 * We use the thread id as the session id and create the session on the first run.
 */
export function sessionFor(threadId: string): Promise<Session> {
  return runner.sessionService.getOrCreateSession({
    appName: runner.appName,
    userId: USER_ID,
    sessionId: threadId,
  });
}
