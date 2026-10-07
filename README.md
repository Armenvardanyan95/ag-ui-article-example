# Weather agent: Angular, AG-UI and Google ADK

A weather dashboard with an agent next to it. Ask anything ("is the weekend good for a barbecue?",
"how was August?", "compare Yerevan and Tbilisi") and the agent answers with components filled with
real data from [Open-Meteo](https://open-meteo.com).

- `server/`: Google ADK agent (TypeScript, Gemini) exposed as an AG-UI endpoint over SSE
- `client/`: Angular 22 app (zoneless, signals) using `@copilotkit/angular`
- `shared/`: Open-Meteo client and result types, used by both

## Run it

```bash
npm install
cp server/.env.example server/.env   # then add your GEMINI_API_KEY
npm run dev                          # server on :8000, app on http://localhost:4200
```

Screenshots for the article: with the app running, `npm run screenshots` writes PNGs to `docs/screenshots/`.

## Where things are

| Topic | File |
| --- | --- |
| LlmAgent and Gemini config | `server/src/agent.ts` |
| Server tools (FunctionTool + Zod) | `server/src/tools/*.ts` |
| InMemoryRunner | `server/src/runner.ts` |
| threadId → sessionId | `server/src/ag-ui/sessions.ts` |
| AG-UI input → ADK message and state | `server/src/ag-ui/input.ts` |
| ADK events → AG-UI events | `server/src/ag-ui/bridge.ts` |
| SSE endpoint and cancellation | `server/src/ag-ui/endpoint.ts` |
| Browser tools on the ADK side | `server/src/ag-ui/client-tools.ts` |
| CopilotKit setup | `client/src/app/app.config.ts` |
| Headless chat with signals | `client/src/app/assistant/assistant.ts` |
| Client tools (`set_location`, `set_units`) | `client/src/app/agent/dashboard-tools.ts` |
| Dashboard as agent context | `client/src/app/agent/dashboard-context.ts` |
| Generative UI components | `client/src/app/views/*.ts` |

## How a question becomes components

1. The Angular app sends an AG-UI `RunAgentInput`: the conversation, the client tools as JSON Schema,
   and the dashboard as context.
2. The server passes the new message to ADK. The agent calls `show_*` tools, which fetch Open-Meteo data.
3. The bridge streams ADK events back as AG-UI events: text deltas, `TOOL_CALL_*` and `TOOL_CALL_RESULT`.
4. CopilotKit renders each `show_*` call with its component, using the tool result as data.
5. If the agent calls a client tool, CopilotKit runs it in the browser and starts a new run with the result.
