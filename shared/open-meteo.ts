// A small Open-Meteo client (https://open-meteo.com). Free, no API key.
// Uses plain fetch, so it runs in Node (server tools) and in the browser (dashboard).

import type { Current, Day, Hour, PeriodSummary, Place } from './weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

const DAILY = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum';
const HOURLY = 'temperature_2m,precipitation_probability,wind_speed_10m,uv_index,relative_humidity_2m';
const CURRENT = 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day';

async function getJson(url: string, params: Record<string, string | number>): Promise<any> {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const response = await fetch(`${url}?${query}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed (${response.status})`);
  }
  return response.json();
}

export async function geocode(name: string): Promise<Place> {
  const data = await getJson(GEOCODING_URL, { name, count: 1, language: 'en' });
  const hit = data.results?.[0];
  if (!hit) {
    throw new Error(`No place found for "${name}"`);
  }
  return {
    name: hit.name,
    country: hit.country ?? '',
    latitude: hit.latitude,
    longitude: hit.longitude,
    timezone: hit.timezone,
  };
}

export interface Forecast {
  current: Current;
  hours: Hour[];
  days: Day[];
}

/** Forecast for up to 16 days. `from` and `to` are local dates (YYYY-MM-DD). */
export async function getForecast(place: Place, range?: { from: string; to: string }): Promise<Forecast> {
  const data = await getJson(FORECAST_URL, {
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
    current: CURRENT,
    hourly: HOURLY,
    daily: DAILY,
    ...(range ? { start_date: range.from, end_date: range.to } : { forecast_days: 16 }),
  });

  return {
    current: {
      time: data.current.time,
      temperature: data.current.temperature_2m,
      feelsLike: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
    },
    hours: data.hourly.time.map((time: string, i: number) => ({
      time,
      temperature: data.hourly.temperature_2m[i],
      precipitationProbability: data.hourly.precipitation_probability[i] ?? 0,
      windSpeed: data.hourly.wind_speed_10m[i],
      uvIndex: data.hourly.uv_index[i] ?? 0,
      humidity: data.hourly.relative_humidity_2m[i],
    })),
    days: data.daily.time.map((date: string, i: number) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      max: data.daily.temperature_2m_max[i],
      min: data.daily.temperature_2m_min[i],
      precipitationProbability: data.daily.precipitation_probability_max[i] ?? 0,
      precipitation: data.daily.precipitation_sum[i] ?? 0,
    })),
  };
}

export type PastDay = Pick<Day, 'date' | 'max' | 'min' | 'precipitation'>;

/** Observed daily weather for past dates, back to 1940. */
export async function getHistory(place: Place, from: string, to: string): Promise<PastDay[]> {
  const data = await getJson(ARCHIVE_URL, {
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
    start_date: from,
    end_date: to,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
  });

  return data.daily.time.map((date: string, i: number) => ({
    date,
    max: data.daily.temperature_2m_max[i],
    min: data.daily.temperature_2m_min[i],
    precipitation: data.daily.precipitation_sum[i] ?? 0,
  }));
}

/** Averages the days of the year covered by `days` over 1991–2020, the standard climate normal period. */
export async function getNormal(place: Place, days: PastDay[]): Promise<PeriodSummary> {
  const all = await getHistory(place, '1991-01-01', '2020-12-31');
  const wanted = new Set(days.map((d) => d.date.slice(5)));
  const matching = all.filter((d) => wanted.has(d.date.slice(5)));
  const years = 30;

  return {
    max: average(matching.map((d) => d.max)),
    min: average(matching.map((d) => d.min)),
    precipitation: round(sum(matching.map((d) => d.precipitation)) / years),
  };
}

export function summarize(days: PastDay[]): PeriodSummary {
  return {
    max: average(days.map((d) => d.max)),
    min: average(days.map((d) => d.min)),
    precipitation: round(sum(days.map((d) => d.precipitation))),
  };
}

const sum = (values: number[]) => values.reduce((a, b) => a + (b ?? 0), 0);
const average = (values: number[]) => round(sum(values) / Math.max(values.length, 1));
const round = (value: number) => Math.round(value * 10) / 10;
