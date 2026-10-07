import { Component, computed, inject, input } from '@angular/core';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';
import type { HistoryResult } from '../../../../shared/weather';
import { dayLabel } from '../weather/dates';
import { WeatherStore } from '../weather/weather-store';
import { viewState } from './tool-result';

export type HistoryArgs = { place: string; from: string; to: string };

/** Renders show_history: a past period next to the 1991–2020 average. */
@Component({
  selector: 'app-history-card',
  template: `
    @let view = state();
    @if (view.status === 'ready') {
      <div class="card">
        <div class="row">
          <div class="title">{{ view.data.place.name }}, {{ dayLabel(view.data.from) }} – {{ dayLabel(view.data.to) }}</div>
          <div class="sub">Observed, compared with the 1991–2020 average</div>
        </div>
        @for (line of lines(); track line.label) {
          <div class="row line">
            <span>{{ line.label }}</span>
            <span class="title">{{ line.actual }}</span>
            <span class="sub">usual {{ line.normal }}</span>
          </div>
        }
      </div>
    } @else if (view.status === 'error') {
      <p class="sub">{{ view.message }}</p>
    } @else {
      <p class="sub">Looking up past weather…</p>
    }
  `,
  styles: `
    .line { display: grid; grid-template-columns: 1fr 72px 96px; align-items: baseline; }
    .line span:not(:first-child) { text-align: right; }
  `,
})
export class HistoryCard implements ToolRenderer<HistoryArgs> {
  readonly toolCall = input.required<AngularToolCall<HistoryArgs>>();
  protected readonly state = computed(() => viewState<HistoryResult>(this.toolCall()));
  protected readonly store = inject(WeatherStore);
  protected readonly dayLabel = dayLabel;

  protected readonly lines = computed(() => {
    const view = this.state();
    if (view.status !== 'ready') return [];
    const { actual, normal } = view.data;
    const t = (c: number) => this.store.temperature(c);
    const p = (mm: number) => this.store.precipitation(mm);
    return [
      { label: 'Average high', actual: t(actual.max), normal: t(normal.max) },
      { label: 'Average low', actual: t(actual.min), normal: t(normal.min) },
      { label: 'Total rain', actual: p(actual.precipitation), normal: p(normal.precipitation) },
    ];
  });
}
