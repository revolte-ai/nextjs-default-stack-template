'use client';

import { FormEvent, useState } from 'react';

type Location = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
};

type Weather = {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    precipitation: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
  timezone: string;
};

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Foggy',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm',
  99: 'Thunderstorm',
};

const weatherIcons: Record<number, string> = {
  0: '☀',
  1: '◒',
  2: '◒',
  3: '☁',
  45: '≋',
  48: '≋',
  51: '⌁',
  53: '⌁',
  55: '⌁',
  61: '☂',
  63: '☂',
  65: '☂',
  71: '❄',
  73: '❄',
  75: '❄',
  80: '☂',
  81: '☂',
  82: '☂',
  85: '❄',
  86: '❄',
  95: 'ϟ',
  96: 'ϟ',
  99: 'ϟ',
};

function condition(code: number) {
  return weatherDescriptions[code] ?? 'Mixed conditions';
}

function icon(code: number) {
  return weatherIcons[code] ?? '◒';
}

function dayName(date: string, index: number) {
  if (index === 0) return 'Today';
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${date}T12:00:00`));
}

export default function WeatherDashboard() {
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [selected, setSelected] = useState<Location | null>(null);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [status, setStatus] = useState<'idle' | 'searching' | 'loading' | 'ready' | 'error'>(
    'idle'
  );
  const [message, setMessage] = useState('');

  async function search(event: FormEvent) {
    event.preventDefault();
    setWeather(null);
    setSelected(null);
    setLocations([]);
    if (query.trim().length < 2) {
      setStatus('error');
      setMessage('Enter at least two characters to search.');
      return;
    }
    setStatus('searching');
    try {
      const response = await fetch(`/api/locations?name=${encodeURIComponent(query.trim())}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLocations(data.locations);
      setStatus(data.locations.length ? 'idle' : 'error');
      setMessage(data.locations.length ? '' : 'No places found. Try a nearby city or region.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Search is unavailable right now.');
    }
  }

  async function chooseLocation(location: Location) {
    setSelected(location);
    setLocations([]);
    setStatus('loading');
    try {
      const response = await fetch(
        `/api/weather?latitude=${location.latitude}&longitude=${location.longitude}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setWeather(data);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Weather data is unavailable right now.');
    }
  }

  const current = weather?.current;
  const today = weather?.daily;

  return (
    <main className="weather-shell">
      <div className="weather-grid" aria-hidden="true" />
      <header className="topbar">
        <div className="brand-mark">
          <span className="brand-dot" /> Atmos
        </div>
        <div className="topbar-note">A clearer look outside</div>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">LOCAL FORECASTS / INSTANTLY</p>
        <h1 id="page-title">
          What’s the sky
          <br />
          <em>telling you?</em>
        </h1>
        <p className="intro-copy">
          Search a city to see the weather as it is now, and the shape of the days ahead.
        </p>
      </section>

      <form className="search-form" onSubmit={search}>
        <label htmlFor="city-search">Find a city</label>
        <div className="search-row">
          <div className="input-wrap">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              id="city-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Copenhagen, Kyoto..."
              autoComplete="off"
            />
          </div>
          <button type="submit" disabled={status === 'searching'}>
            {status === 'searching' ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {locations.length > 0 && (
        <div className="location-results" role="listbox" aria-label="Matching locations">
          {locations.map((location) => (
            <button
              className="location-option"
              key={location.id}
              onClick={() => chooseLocation(location)}
              type="button"
            >
              <span>
                <strong>{location.name}</strong>
                <small>{[location.region, location.country].filter(Boolean).join(', ')}</small>
              </span>
              <span className="arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
      )}

      {status === 'error' && (
        <p className="feedback error" role="alert">
          {message}
        </p>
      )}
      {status === 'loading' && (
        <div className="loading-card" role="status">
          <span className="pulse" /> Reading the sky over {selected?.name}…
        </div>
      )}

      {weather && selected && current && today && (
        <section
          className="forecast"
          aria-live="polite"
          aria-label={`Weather for ${selected.name}`}
        >
          <div className="forecast-heading">
            <div>
              <p className="eyebrow">
                {selected.country.toUpperCase()} / {weather.timezone}
              </p>
              <h2>{selected.name}</h2>
            </div>
            <p className="updated">Updated just now</p>
          </div>
          <div className="current-card">
            <div className="horizon" aria-hidden="true" />
            <div className="current-copy">
              <p className="eyebrow light">RIGHT NOW</p>
              <div className="temperature">
                {Math.round(current.temperature_2m)}
                <span>°</span>
              </div>
              <p className="condition">{condition(current.weather_code)}</p>
              <p className="feels">Feels like {Math.round(current.apparent_temperature)}°</p>
            </div>
            <div className="weather-symbol" aria-hidden="true">
              {icon(current.weather_code)}
            </div>
          </div>
          <div className="metrics">
            <div>
              <span className="metric-label">WIND</span>
              <strong>
                {Math.round(current.wind_speed_10m)} <small>km/h</small>
              </strong>
            </div>
            <div>
              <span className="metric-label">HUMIDITY</span>
              <strong>
                {current.relative_humidity_2m}
                <small>%</small>
              </strong>
            </div>
            <div>
              <span className="metric-label">PRECIPITATION</span>
              <strong>
                {current.precipitation}
                <small>mm</small>
              </strong>
            </div>
          </div>
          <div className="week-header">
            <h3>Next five days</h3>
            <span>HIGH / LOW</span>
          </div>
          <div className="daily-list">
            {today.time.map((date, index) => {
              const code = today.weather_code[index] ?? 0;
              const precipitation = today.precipitation_probability_max[index] ?? 0;
              const high = today.temperature_2m_max[index] ?? 0;
              const low = today.temperature_2m_min[index] ?? 0;

              return (
                <div className="day-row" key={date}>
                  <span className="day-name">{dayName(date, index)}</span>
                  <span className="day-icon" aria-hidden="true">
                    {icon(code)}
                  </span>
                  <span className="day-condition">{condition(code)}</span>
                  <span className="rain">{precipitation}% rain</span>
                  <strong>
                    {Math.round(high)}° <span>{Math.round(low)}°</span>
                  </strong>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {!weather && status === 'idle' && (
        <div className="empty-state">
          <span className="empty-sun" aria-hidden="true">
            ☼
          </span>
          <p>Begin with a place you’re curious about.</p>
        </div>
      )}
      <footer>
        <span>Data by Open-Meteo</span>
        <span>Forecasts for planning, not promises.</span>
      </footer>
    </main>
  );
}
