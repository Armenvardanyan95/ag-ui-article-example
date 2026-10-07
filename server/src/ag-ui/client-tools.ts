import { BaseTool, BaseToolset, type ReadonlyContext } from '@google/adk';
import type { FunctionDeclaration } from '@google/genai';
import type { Tool } from '@ag-ui/core';

/**
 * A tool that runs in the browser. The model can call it, but ADK does not execute it:
 * it is long-running and returns nothing, so the run ends and the call goes to the client.
 * The client sends the result back with the next run.
 */
class ClientTool extends BaseTool {
  constructor(private readonly tool: Tool) {
    super({ name: tool.name, description: tool.description, isLongRunning: true });
  }

  override _getDeclaration(): FunctionDeclaration {
    return {
      name: this.tool.name,
      description: this.tool.description,
      parametersJsonSchema: this.tool.parameters,
    };
  }

  override async runAsync(): Promise<undefined> {
    return undefined;
  }
}

/** The client sends its tools with every run. We keep them in session state and expose them here. */
export class ClientToolset extends BaseToolset {
  constructor() {
    super([]);
  }

  override async getTools(context?: ReadonlyContext): Promise<BaseTool[]> {
    const tools = context?.state.get<Tool[]>('client_tools') ?? [];
    return tools.map((tool) => new ClientTool(tool));
  }

  override async close(): Promise<void> {}
}
