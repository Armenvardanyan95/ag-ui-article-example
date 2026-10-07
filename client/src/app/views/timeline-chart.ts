import { Component, computed, inject, input } from '@angular/core';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';
import type { Hour, Metric, TimelineResult } from '../../../../shared/weather';
import { dayLabel, hourOf } from '../weather/dates';
import { WeatherStore } from '../weather/weather-store';
import { viewState } from './tool-result';

export type TimelineArgs = { place: string; metrics: Metric[] };

const WIDTH = 360;
const HEIGHT = 44;

const LABELS: Record<Metric, string> = {
  temperature: 'Temperature',
  precipitationProbability: 'Chance of rain',
  windSpeed: 'Wind',
  uvIndex: 'UV index',
  humidity: 'Humidity',
};

/** Renders show_timeline: one small chart per metric, sharing the same hours. */
@Component({
  selector: 'app-timeline-chart',
  template: `
    @let view = state();
    @if (view.status === 'ready') {
      <div class="card">
        <div class="row">
          <div class="title">{{ view.data.place.name }}, {{ period() }}</div>
          @if (view.data.highlight; as highlight) {
            <div class="sub">{{ highlight.label }}: {{ hourOf(highlight.from) }}:00–{{ hourOf(highlight.to) }}:00</div>
          }
        </div>
        @for (chart of charts(); track chart.metric) {
          <div class="row">
            <div class="legend">
              <span class="sub">{{ chart.label }}</span>
              <span class="sub">{{ chart.range }}</span>
            </div>
            <svg [attr.viewBox]="'0 0 ' + width + ' ' + height" preserveAspectRatio="none">
              @if (band(); as b) {
                <rect [attr.x]="b.x" [attr.width]="b.width" y="0" [attr.height]="height" class="band" />
              }
              @if (chart.bars) {
                @for (bar of chart.points; track $index) {
                  <rect [attr.x]="bar.x - 1" [attr.y]="bar.y" width="2" [attr.height]="height - bar.y" class="bar" />
                }
              } @else {
                <polyline [attr.points]="chart.line" class="line" />
              }
            </svg>
          </div>
        }
        <div class="row axis sub">
          @for (tick of ticks(); track tick) {
            <span>{{ tick }}</span>
          }
        </div>
      </div>
    } @else if (view.status === 'error') {
      <p class="sub">{{ view.message }}</p>
    } @else {
      <p class="sub">Getting the hourly forecast…</p>
    }
  `,
  styles: `
    .legend { display: flex; justify-content: space-between; margin-bottom: 6px; }
    svg { display: block; width: 100%; height: 44px; }
    .line { fill: none; stroke: var(--accent); stroke-width: 1.5; vector-effect: non-scaling-stroke; }
    .bar { fill: var(--rain); }
    .band { fill: var(--soft); }
    .axis { display: flex; justify-content: space-between; padding-top: 8px; padding-bottom: 12px; border-top: 0; }
  `,
})
export class TimelineChart implements ToolRenderer<TimelineArgs> {
  readonly toolCall = input.required<AngularToolCall<TimelineArgs>>();
  protected readonly state = computed(() => viewState<TimelineResult>(this.toolCall()));
  protected readonly store = inject(WeatherStore);
  protected readonly hourOf = hourOf;
  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;

  private readonly data = computed(() => {
    const view = this.state();
    return view.status === 'ready' ? view.data : undefined;
  });

  protected readonly period = computed(() => {
    const hours = this.data()?.hours ?? [];
    if (!hours.length) return '';
    const first = dayLabel(hours[0].time.slice(0, 10));
    const last = dayLabel(hours[hours.length - 1].time.slice(0, 10));
    return first === last ? first : `${first} – ${last}`;
  });

  protected readonly charts = computed(() => {
    const data = this.data();
    if (!data) return [];
    return data.metrics.map((metric) => {
      const values = data.hours.map((hour) => hour[metric]);
      const percent = metric === 'precipitationProbability' || metric === 'humidity';
      const points = percent ? scale(values, 0, 100) : scale(values, Math.min(...values), Math.max(...values));
      return {
        metric,
        label: LABELS[metric],
        range: `${this.format(metric, Math.min(...values))} – ${this.format(metric, Math.max(...values))}`,
        bars: metric === 'precipitationProbability',
        points,
        line: points.map((p) => `${p.x},${p.y}`).join(' '),
      };
    });
  });

  /** The highlighted window, in chart coordinates. */
  protected readonly band = computed(() => {
    const data = this.data();
    const highlight = data?.highlight;
    if (!data || !highlight) return undefined;
    const start = data.hours.findIndex((h) => h.time >= highlight.from);
    const end = data.hours.findIndex((h) => h.time >= highlight.to);
    if (start < 0) return undefined;
    const step = WIDTH / Math.max(data.hours.length - 1, 1);
    return { x: start * step, width: ((end < 0 ? data.hours.length - 1 : end) - start) * step };
  });

  protected readonly ticks = computed(() => {
    const hours: Hour[] = this.data()?.hours ?? [];
    const every = Math.max(Math.round(hours.length / 6), 1);
    return hours.filter((_, i) => i % every === 0).map((h) => hourOf(h.time));
  });

  private format(metric: Metric, value: number): string {
    switch (metric) {
      case 'temperature':
        return this.store.temperature(value);
      case 'windSpeed':
        return this.store.wind(value);
      case 'uvIndex':
        return value.toFixed(0);
      default:
        return `${Math.round(value)}%`;
    }
  }
}

/** Maps values onto the chart: x across the width, y from the bottom (`min`) to the top (`max`). */
function scale(values: number[], min: number, max: number): { x: number; y: number }[] {
  const span = max - min || 1;
  const step = WIDTH / Math.max(values.length - 1, 1);
  return values.map((value, i) => ({
    x: round(i * step),
    y: round(HEIGHT - 2 - ((value - min) / span) * (HEIGHT - 4)),
  }));
}

const round = (n: number) => Math.round(n * 10) / 10;
