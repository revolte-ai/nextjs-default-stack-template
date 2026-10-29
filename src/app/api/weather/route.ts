import { z } from 'zod';

const querySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    latitude: url.searchParams.get('latitude'),
    longitude: url.searchParams.get('longitude'),
  });

  if (!parsed.success) {
    return Response.json({ error: 'That location could not be loaded.' }, { status: 400 });
  }

  const params = new URLSearchParams({
    latitude: String(parsed.data.latitude),
    longitude: String(parsed.data.longitude),
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    forecast_days: '5',
    timezone: 'auto',
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      next: { revalidate: 900 },
    });

    if (!response.ok) {
      return Response.json({ error: 'Weather data is unavailable right now.' }, { status: 502 });
    }

    return Response.json(await response.json());
  } catch (error) {
    console.error('Weather request failed', error);
    return Response.json({ error: 'Weather data is unavailable right now.' }, { status: 502 });
  }
}
