import { Component, computed, inject } from '@angular/core';
import { describeWeather, type Day } from '../../../../shared/weather';
import { dayLabel, weekday } from './dates';
import { WeatherStore } from './weather-store';

@Component({
  selector: 'app-dashboard',
  template: `
    <header class="header">
      <div>
        <span class="place">{{ store.place().name }}</span>
        <span class="muted">{{ date() }}</span>
      </div>
      <div class="units" role="group" aria-label="Units">
        <button [class.active]="store.units() === 'metric'" (click)="store.units.set('metric')">°C</button>
        <button [class.active]="store.units() === 'imperial'" (click)="store.units.set('imperial')">°F</button>
      </div>
    </header>

    @if (store.forecast.value(); as forecast) {
      <section class="now">
        <div class="temperature">{{ store.temperature(forecast.current.temperature) }}</div>
        <div class="condition">{{ describe(forecast.current.weatherCode) }}</div>
        <div class="muted">
          Feels {{ store.temperature(forecast.current.feelsLike) }} · Wind {{ store.wind(forecast.current.windSpeed) }} ·
          Humidity {{ forecast.current.humidity }}%
        </div>
      </section>

      <section class="week">
        @for (day of week(); track day.date; let first = $first) {
          <div class="day">
            <span>{{ first ? 'Today' : weekday(day.date) }}</span>
            <span class="muted">{{ summary(day) }}</span>
            <span class="muted low">{{ store.temperature(day.min) }}</span>
            <span class="high">{{ store.temperature(day.max) }}</span>
          </div>
        }
      </section>
    } @else if (store.forecast.error()) {
      <p class="muted">Could not load the forecast.</p>
    } @else {
      <p class="muted">Loading…</p>
    }
  `,
  styles: `
    :host {
      /* White text on the sky. */
      --text: #ffffff;
      --muted: rgba(255, 255, 255, 0.8);
      --line: rgba(255, 255, 255, 0.28);
      color: var(--text);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      gap: 56px;
      padding: 64px 96px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .place {
      font-size: 20px;
      font-weight: 500;
      margin-right: 12px;
    }

    .units button {
      border: 0;
      background: none;
      padding: 8px 4px;
      font: inherit;
      font-size: 14px;
      color: var(--muted);
      cursor: pointer;
    }

    .units button.active {
      color: var(--text);
      font-weight: 500;
    }

    .now {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .temperature {
      font-size: 112px;
      font-weight: 300;
      line-height: 1;
      letter-spacing: -3px;
    }

    .condition {
      font-size: 17px;
    }

    .week {
      max-width: 520px;
    }

    .day {
      display: grid;
      grid-template-columns: 80px 1fr 56px 56px;
      align-items: center;
      height: 48px;
      border-top: 1px solid var(--line);
    }

    .low,
    .high {
      text-align: right;
    }

    .high {
      font-weight: 500;
    }

    @media (max-width: 1100px) {
      :host {
        gap: 40px;
        padding: 48px 40px;
      }
    }

    @media (max-width: 720px) {
      :host {
        gap: 28px;
        padding: 24px 20px;
      }

      .temperature {
        font-size: 72px;
        letter-spacing: -2px;
      }

      .week {
        max-width: none;
      }

      .day {
        grid-template-columns: 52px 1fr 44px 44px;
        height: 44px;
      }
    }
  `,
})
export class Dashboard {
  protected readonly store = inject(WeatherStore);
  protected readonly describe = describeWeather;
  protected readonly weekday = weekday;
  protected readonly date = computed(() => dayLabel(this.store.today()));
  protected readonly week = computed(() => this.store.forecast.value()?.days.slice(0, 7) ?? []);

  protected summary(day: Day): string {
    const text = describeWeather(day.weatherCode);
    return day.precipitationProbability >= 30 ? `${text}, ${day.precipitationProbability}%` : text;
  }
}
