import type { AngularToolCall } from '@copilotkit/angular';

export type ViewState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

/** A tool call is loading until its result arrives. Server tools return JSON, or `{ error }` on failure. */
export function viewState<T>(call: AngularToolCall<any>): ViewState<T> {
  if (call.status !== 'complete') {
    return { status: 'loading' };
  }
  const result = JSON.parse(call.result);
  return 'error' in result ? { status: 'error', message: result.error } : { status: 'ready', data: result };
}
