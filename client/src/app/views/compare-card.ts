import { Component, computed, inject, input } from '@angular/core';
import type { AngularToolCall, ToolRenderer } from '@copilotkit/angular';
import type { CompareResult } from '../../../../shared/weather';
import { dayLabel } from '../weather/dates';
import { WeatherStore } from '../weather/weather-store';
import { viewState } from './tool-result';

export type CompareArgs = { places: string[] };

/** Renders compare_places: days down, places across. */
@Component({
  selector: 'app-compare-card',
  template: `
    @let view = state();
    @if (view.status === 'ready') {
      <div class="card">
        <div class="row grid" [style.grid-template-columns]="columns()">
          <span></span>
          @for (entry of view.data.places; track entry.place.name) {
            <span class="title">{{ entry.place.name }}</span>
          }
        </div>
        @for (date of dates(); track date; let i = $index) {
          <div class="row grid" [style.grid-template-columns]="columns()">
            <span class="sub">{{ dayLabel(date) }}</span>
            @for (entry of view.data.places; track entry.place.name) {
              <span>
                {{ store.temperature(entry.days[i].max) }}
                <span class="sub">{{ store.temperature(entry.days[i].min) }} · {{ entry.days[i].precipitationProbability }}%</span>
              </span>
            }
          </div>
        }
      </div>
    } @else if (view.status === 'error') {
      <p class="sub">{{ view.message }}</p>
    } @else {
      <p class="sub">Comparing places…</p>
    }
  `,
  styles: `
    .grid { display: grid; gap: 12px; align-items: baseline; }
  `,
})
export class CompareCard implements ToolRenderer<CompareArgs> {
  readonly toolCall = input.required<AngularToolCall<CompareArgs>>();
  protected readonly state = computed(() => viewState<CompareResult>(this.toolCall()));
  protected readonly store = inject(WeatherStore);
  protected readonly dayLabel = dayLabel;

  protected readonly dates = computed(() => {
    const view = this.state();
    return view.status === 'ready' ? view.data.places[0].days.map((d) => d.date) : [];
  });

  protected readonly columns = computed(() => {
    const view = this.state();
    const count = view.status === 'ready' ? view.data.places.length : 0;
    return `88px repeat(${count}, 1fr)`;
  });
}
