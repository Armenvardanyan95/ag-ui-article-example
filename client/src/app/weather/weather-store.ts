import { Injectable, computed, resource, signal } from '@angular/core';
import { geocode, getForecast } from '../../../../shared/open-meteo';
import type { Place } from '../../../../shared/weather';

export type Units = 'metric' | 'imperial';

const YEREVAN: Place = {
  name: 'Yerevan',
  country: 'Armenia',
  latitude: 40.17765,
  longitude: 44.5126,
  timezone: 'Asia/Yerevan',
};

/** What the dashboard shows. The agent reads it as context and changes it with client tools. */
@Injectable({ providedIn: 'root' })
export class WeatherStore {
  readonly place = signal<Place>(YEREVAN);
  readonly units = signal<Units>('metric');

  readonly forecast = resource({
    params: () => this.place(),
    loader: ({ params }) => getForecast(params),
  });

  /** Today's date where the place is, e.g. 2026-09-24. */
  readonly today = computed(() =>
    new Intl.DateTimeFormat('en-CA', { timeZone: this.place().timezone }).format(new Date()),
  );

  async setLocation(name: string): Promise<Place> {
    const place = await geocode(name);
    this.place.set(place);
    return place;
  }

  temperature(celsius: number): string {
    const value = this.units() === 'metric' ? celsius : celsius * 1.8 + 32;
    return `${Math.round(value)}°`;
  }

  wind(kmh: number): string {
    return this.units() === 'metric' ? `${Math.round(kmh)} km/h` : `${Math.round(kmh / 1.609)} mph`;
  }

  precipitation(mm: number): string {
    return this.units() === 'metric' ? `${mm.toFixed(1)} mm` : `${(mm / 25.4).toFixed(2)} in`;
  }
}
