import { Component, ElementRef, afterRenderEffect, computed, effect, inject, signal, viewChild } from '@angular/core';
import type { Message } from '@ag-ui/client';
import { CopilotKit, RenderToolCalls, injectAgentStore } from '@copilotkit/angular';

/**
 * The chat panel, built on CopilotKit's headless API. The agent store exposes the conversation
 * as signals, so streamed tokens update the view without zone.js.
 */
@Component({
  selector: 'app-assistant',
  imports: [RenderToolCalls],
  template: `
    <div class="messages" #scroller>
      @for (message of messages(); track message.id) {
        @if (message.role === 'user') {
          <div class="user">{{ text(message) }}</div>
        } @else if (message.role === 'assistant') {
          @if (text(message)) {
            <div class="assistant">{{ text(message) }}</div>
          }
          @if (message.toolCalls?.length) {
            <copilot-render-tool-calls [message]="message" [messages]="messages()" [isLoading]="isRunning()" />
          }
        }
      } @empty {
        <p class="muted">Ask about today, the weekend, next month or another city.</p>
      }

      @if (isThinking()) {
        <p class="muted">Thinking…</p>
      }

      @if (error(); as message) {
        <p class="muted">
          {{ message }}
          <button class="link" (click)="run()">Try again</button>
        </p>
      }
    </div>

    <form class="composer" (submit)="$event.preventDefault(); send()">
      <input
        aria-label="Message"
        placeholder="Ask about the weather"
        autocomplete="off"
        [value]="draft()"
        (input)="draft.set($any($event.target).value)"
      />
      @if (isRunning()) {
        <button type="button" aria-label="Stop" (click)="stop()">
          <svg viewBox="0 0 24 24" width="14" height="14"><rect x="5" y="5" width="14" height="14" rx="2" fill="currentColor" /></svg>
        </button>
      } @else {
        <button type="submit" aria-label="Send">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </button>
      }
    </form>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      /* Frosted glass over the sky. */
      background: rgba(255, 255, 255, 0.78);
      backdrop-filter: blur(24px) saturate(1.2);
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 64px 40px 24px;
    }

    .messages p {
      margin: 0;
    }

    .user {
      align-self: flex-end;
      max-width: 80%;
      padding: 10px 14px;
      background: var(--soft);
      border-radius: 12px;
    }

    .assistant {
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .link {
      border: 0;
      background: none;
      padding: 0;
      font: inherit;
      text-decoration: underline;
      cursor: pointer;
    }

    .composer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 16px 40px 40px;
      height: 52px;
      padding: 0 6px 0 16px;
      border: 1px solid var(--field);
      border-radius: 12px;
      background: #fff;
    }

    .composer input {
      flex: 1;
      border: 0;
      outline: 0;
      font: inherit;
      background: transparent;
    }

    .composer button {
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 8px;
      background: var(--accent);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    @media (max-width: 1100px) {
      .messages {
        padding: 48px 24px 16px;
      }

      .composer {
        margin: 12px 24px 24px;
      }
    }

    /* Phones: the page scrolls, so the message box sticks to the bottom of the screen. */
    @media (max-width: 720px) {
      .messages {
        overflow: visible;
        padding: 24px 20px 16px;
      }

      .messages > * {
        scroll-margin-bottom: 96px;
      }

      .composer {
        position: sticky;
        bottom: 0;
        margin: 0 12px calc(12px + env(safe-area-inset-bottom));
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }
    }
  `,
})
export class Assistant {
  private readonly copilotKit = inject(CopilotKit);
  private readonly store = injectAgentStore('weather');
  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  protected readonly messages = computed(() => this.store().messages());
  protected readonly isRunning = computed(() => this.store().isRunning());
  protected readonly isThinking = computed(() => this.isRunning() && this.messages().at(-1)?.role === 'user');
  protected readonly draft = signal('');
  protected readonly error = signal<string | undefined>(undefined);
  private stopped = false;

  constructor() {
    // A failed run arrives as an AG-UI RUN_ERROR event. The client also reports its own abort
    // this way when the user presses stop, which we don't show.
    effect((onCleanup) => {
      const { unsubscribe } = this.store().agent.subscribe({
        onRunErrorEvent: ({ event }) => {
          if (!this.stopped) this.error.set(event.message);
        },
      });
      onCleanup(unsubscribe);
    });

    // Keep the newest content in view while it streams in.
    // scrollIntoView works both when the panel scrolls (desktop) and when the page does (phones).
    afterRenderEffect(() => {
      if (this.messages().length === 0) return;
      this.scroller().nativeElement.lastElementChild?.scrollIntoView({ block: 'end' });
    });
  }

  protected async send(): Promise<void> {
    const content = this.draft().trim();
    if (!content || this.isRunning()) return;

    this.store().agent.addMessage({ id: crypto.randomUUID(), role: 'user', content });
    this.draft.set('');
    await this.run();
  }

  protected async run(): Promise<void> {
    this.error.set(undefined);
    this.stopped = false;
    try {
      await this.copilotKit.core.runAgent({ agent: this.store().agent });
    } catch (error) {
      // Stopping aborts the request, which rejects here. That is not an error to show.
      if (!this.stopped) {
        this.error.set(error instanceof Error ? error.message : 'Something went wrong.');
      }
    }
  }

  /** Aborts the request. The server sees the connection close and cancels the ADK run. */
  protected stop(): void {
    this.stopped = true;
    this.copilotKit.core.stopAgent({ agent: this.store().agent });
  }

  protected text(message: Message): string {
    return typeof message.content === 'string' ? message.content : '';
  }
}
