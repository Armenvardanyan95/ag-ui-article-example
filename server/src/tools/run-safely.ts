import type { ToolError } from '../../../shared/weather';

/** Turns a failure into `{ error }`, so the model can explain it and the UI can show it. */
export async function runSafely<T>(work: () => Promise<T>): Promise<T | ToolError> {
  try {
    return await work();
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
