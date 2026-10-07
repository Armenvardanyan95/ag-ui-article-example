import { Component, computed, inject, input } from '@angular/core';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';
import { describeWeather, type NowResult } from '../../../../shared/weather';
import { WeatherStore } from '../weather/weather-store';
import { viewState } from './tool-result';

export type NowArgs = { place: string };

/** Renders show_now. */
@Component({
  selector: 'app-now-card',
  template: `
    @let view = state();
    @if (view.status === 'ready') {
      <div class="card row">
        <div>
          <div class="title">{{ view.data.place.name }}</div>
          <div class="sub">
            {{ describe(view.data.current.weatherCode) }} · Feels {{ store.temperature(view.data.current.feelsLike) }} ·
            Wind {{ store.wind(view.data.current.windSpeed) }}
          </div>
        </div>
        <div class="value">
          <span class="big">{{ store.temperature(view.data.current.temperature) }}</span>
          <span class="sub">{{ store.temperature(view.data.today.max) }} / {{ store.temperature(view.data.today.min) }}</span>
        </div>
      </div>
    } @else if (view.status === 'error') {
      <p class="sub">{{ view.message }}</p>
    } @else {
      <p class="sub">Checking the weather in {{ toolCall().args.place }}…</p>
    }
  `,
  styles: `
    .row { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
    .value { display: flex; flex-direction: column; align-items: flex-end; }
    .big { font-size: 32px; font-weight: 300; }
  `,
})
export class NowCard implements ToolRenderer<NowArgs> {
  readonly toolCall = input.required<AngularToolCall<NowArgs>>();
  protected readonly state = computed(() => viewState<NowResult>(this.toolCall()));
  protected readonly store = inject(WeatherStore);
  protected readonly describe = describeWeather;
}
