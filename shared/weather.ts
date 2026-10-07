// Types shared by the server tools and the Angular components that render them.
// All values are metric: °C, mm, km/h. The client converts for display.

export interface Place {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface Current {
  time: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
}

export interface Day {
  date: string;
  weatherCode: number;
  max: number;
  min: number;
  precipitationProbability: number;
  precipitation: number;
}

export interface Hour {
  time: string;
  temperature: number;
  precipitationProbability: number;
  windSpeed: number;
  uvIndex: number;
  humidity: number;
}

export type Metric = 'temperature' | 'precipitationProbability' | 'windSpeed' | 'uvIndex' | 'humidity';

// Tool results. Each one is rendered by one Angular component.

export interface NowResult {
  place: Place;
  current: Current;
  today: Day;
}

export interface DaysResult {
  place: Place;
  days: (Day & { note?: string })[];
  best?: string;
}

export interface TimelineResult {
  place: Place;
  metrics: Metric[];
  hours: Hour[];
  highlight?: { from: string; to: string; label: string };
}

export interface PeriodSummary {
  max: number;
  min: number;
  precipitation: number;
}

export interface HistoryResult {
  place: Place;
  from: string;
  to: string;
  actual: PeriodSummary;
  normal: PeriodSummary;
  days: Pick<Day, 'date' | 'max' | 'min' | 'precipitation'>[];
}

export interface CompareResult {
  places: { place: Place; days: Day[] }[];
}

export interface ToolError {
  error: string;
}

export function describeWeather(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 2) return 'Partly cloudy';
  if (code === 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow showers';
  return 'Thunderstorm';
}
