import { Component, inject, linkedSignal } from '@angular/core';
import type { Current } from '../../../../shared/weather';
import { WeatherStore } from './weather-store';

export type Scene = 'clear-day' | 'clear-night' | 'cloudy' | 'rain' | 'snow' | 'storm';

const SCENES: Scene[] = ['clear-day', 'clear-night', 'cloudy', 'rain', 'snow', 'storm'];

/** Picks a sky from the WMO weather code and whether the sun is up. */
export function sceneFor({ weatherCode, isDay }: Current): Scene {
  if (weatherCode >= 95) return 'storm';
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) return 'snow';
  if (weatherCode >= 51) return 'rain';
  if (weatherCode >= 3) return 'cloudy';
  return isDay ? 'clear-day' : 'clear-night';
}

/** A full-screen sky behind the app that follows the dashboard's weather. */
@Component({
  selector: 'app-sky',
  template: `
    @for (name of scenes; track name) {
      <div class="gradient {{ name }}" [class.active]="scene() === name"></div>
    }

    <div class="shade"></div>

    @switch (scene()) {
      @case ('clear-day') {
        <div class="fx-sun"></div>
      }
      @case ('clear-night') {
        <div class="fx-stars"></div>
      }
      @case ('cloudy') {
        <div class="fx-clouds"></div>
      }
      @case ('rain') {
        <div class="fx-clouds"></div>
        <div class="fx-rain"></div>
      }
      @case ('snow') {
        <div class="fx-snow"></div>
      }
      @case ('storm') {
        <div class="fx-clouds"></div>
        <div class="fx-rain"></div>
        <div class="fx-flash"></div>
      }
    }
  `,
  styles: `
    :host {
      position: fixed;
      inset: 0;
      z-index: -1;
      overflow: hidden;
      background: #5aa4ea;
    }

    :host > div {
      position: absolute;
      inset: 0;
    }

    /* Skies cross-fade when the weather changes. */
    .gradient {
      opacity: 0;
      transition: opacity 1.2s ease;
    }

    .gradient.active {
      opacity: 1;
    }

    .clear-day { background: linear-gradient(180deg, #2d7dd6 0%, #58a2e8 50%, #a8d2f4 100%); }
    .clear-night { background: linear-gradient(180deg, #0a1531 0%, #1a2c5a 55%, #384d84 100%); }
    .cloudy { background: linear-gradient(180deg, #56697f 0%, #7f90a3 55%, #aebbc8 100%); }
    .rain { background: linear-gradient(180deg, #27364a 0%, #43546a 55%, #66788d 100%); }
    .snow { background: linear-gradient(180deg, #62799a 0%, #93a8bf 55%, #c9d5e2 100%); }
    .storm { background: linear-gradient(180deg, #161b28 0%, #2d3344 55%, #4c5163 100%); }

    /* Clouds, rain and snow at night: the same sky, darker. */
    .shade {
      background: #050a1e;
      opacity: 0;
      transition: opacity 1.2s ease;
    }

    :host(.night) .shade {
      opacity: 0.4;
    }

    .fx-sun {
      background: radial-gradient(circle at 85% 8%, rgba(255, 244, 214, 0.75) 0, rgba(255, 244, 214, 0.25) 12%, transparent 35%);
    }

    .fx-stars {
      background-image:
        radial-gradient(1px 1px at 20px 30px, #fff, transparent),
        radial-gradient(1px 1px at 90px 120px, rgba(255, 255, 255, 0.8), transparent),
        radial-gradient(1.5px 1.5px at 160px 60px, #fff, transparent),
        radial-gradient(1px 1px at 230px 170px, rgba(255, 255, 255, 0.7), transparent);
      background-size: 260px 220px;
      animation: twinkle 4s ease-in-out infinite alternate;
    }

    .fx-clouds {
      inset: -20% -40%;
      background:
        radial-gradient(ellipse 30% 12% at 20% 18%, rgba(255, 255, 255, 0.28), transparent 70%),
        radial-gradient(ellipse 35% 14% at 65% 10%, rgba(255, 255, 255, 0.22), transparent 70%),
        radial-gradient(ellipse 28% 10% at 45% 35%, rgba(255, 255, 255, 0.16), transparent 70%);
      animation: drift 60s ease-in-out infinite alternate;
    }

    .fx-rain {
      inset: -20%;
      background-image:
        radial-gradient(1px 14px at 50% 50%, rgba(255, 255, 255, 0.45), transparent),
        radial-gradient(1px 10px at 50% 50%, rgba(255, 255, 255, 0.3), transparent);
      background-size: 70px 110px, 45px 80px;
      background-position: 0 0, 22px 40px;
      transform: rotate(12deg);
      animation: fall 0.6s linear infinite;
    }

    .fx-snow {
      inset: -20%;
      background-image:
        radial-gradient(2.5px 2.5px at 50% 50%, rgba(255, 255, 255, 0.95), transparent),
        radial-gradient(1.5px 1.5px at 50% 50%, rgba(255, 255, 255, 0.8), transparent);
      background-size: 90px 90px, 140px 140px;
      background-position: 0 0, 40px 60px;
      animation: snowfall 9s linear infinite;
    }

    .fx-flash {
      background: #fff;
      opacity: 0;
      animation: flash 7s infinite;
    }

    @keyframes twinkle {
      to { opacity: 0.55; }
    }

    @keyframes drift {
      to { transform: translateX(12%); }
    }

    @keyframes fall {
      to { background-position: 0 110px, 22px 120px; }
    }

    @keyframes snowfall {
      to { background-position: 30px 90px, 0 200px; }
    }

    @keyframes flash {
      0%, 90%, 93%, 100% { opacity: 0; }
      91% { opacity: 0.35; }
      92% { opacity: 0.1; }
    }

    @media (prefers-reduced-motion: reduce) {
      :host > div {
        animation: none !important;
      }
    }
  `,
  host: { 'aria-hidden': 'true', '[class.night]': 'night()' },
})
export class Sky {
  private readonly store = inject(WeatherStore);
  protected readonly scenes = SCENES;

  /** Keeps the previous sky while the next city loads, so it fades instead of flashing. */
  protected readonly scene = linkedSignal<Current | undefined, Scene>({
    source: () => this.store.forecast.value()?.current,
    computation: (current, previous) => (current ? sceneFor(current) : (previous?.value ?? 'clear-day')),
  });

  protected readonly night = linkedSignal<Current | undefined, boolean>({
    source: () => this.store.forecast.value()?.current,
    computation: (current, previous) => (current ? !current.isDay : (previous?.value ?? false)),
  });
}
