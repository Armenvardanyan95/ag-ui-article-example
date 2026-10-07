import { Component, input } from '@angular/core';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';

/** A quiet line in the chat when the agent changes the dashboard. */
@Component({
  selector: 'app-action-note',
  template: `
    <p class="muted">
      @if (toolCall().status === 'complete') {
        {{ toolCall().result }}
      } @else {
        Updating the dashboard…
      }
    </p>
  `,
  styles: `
    p {
      margin: 0;
      font-size: 13px;
    }
  `,
})
export class ActionNote implements ToolRenderer<any> {
  readonly toolCall = input.required<AngularToolCall<any>>();
}
