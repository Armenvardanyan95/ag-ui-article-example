import { Component, computed, inject, input } from '@angular/core';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';
import { describeWeather, type DaysResult } from '../../../../shared/weather';
import { dayLabel } from '../weather/dates';
import { WeatherStore } from '../weather/weather-store';
import { viewState } from './tool-result';

export type DaysArgs = { place: string; from: string; to: string };

/** Renders show_days: one row per day, with the agent's notes and its pick. */
@Component({
  selector: 'app-days-card',
  template: `
    @let view = state();
    @if (view.status === 'ready') {
      <div class="card">
        @for (day of view.data.days; track day.date) {
          <div class="row">
            <div>
              <div class="title">
                {{ dayLabel(day.date) }}
                @if (day.date === view.data.best) {
                  <span class="tag">Best</span>
                }
              </div>
              <div class="sub">{{ day.note ?? describe(day.weatherCode) }}</div>
            </div>
            <div class="value">
              <div>
                <span class="title">{{ store.temperature(day.max) }}</span>
                <span class="sub"> {{ store.temperature(day.min) }}</span>
              </div>
              <div class="sub">{{ day.precipitationProbability }}%</div>
            </div>
          </div>
        }
      </div>
    } @else if (view.status === 'error') {
      <p class="sub">{{ view.message }}</p>
    } @else {
      <p class="sub">Getting the forecast…</p>
    }
  `,
  styles: `
    .row { display: flex; justify-content: space-between; gap: 16px; }
    .value { text-align: right; }
    .tag { margin-left: 6px; padding: 1px 8px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 11px; font-weight: 500; }
  `,
})
export class DaysCard implements ToolRenderer<DaysArgs> {
  readonly toolCall = input.required<AngularToolCall<DaysArgs>>();
  protected readonly state = computed(() => viewState<DaysResult>(this.toolCall()));
  protected readonly store = inject(WeatherStore);
  protected readonly describe = describeWeather;
  protected readonly dayLabel = dayLabel;
}
