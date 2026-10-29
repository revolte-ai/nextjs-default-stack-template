import { z } from 'zod';

const querySchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ name: url.searchParams.get('name') ?? '' });

  if (!parsed.success) {
    return Response.json({ error: 'Enter at least two characters to search.' }, { status: 400 });
  }

  const params = new URLSearchParams({
    name: parsed.data.name,
    count: '5',
    language: 'en',
    format: 'json',
  });

  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return Response.json({ error: 'Location search is unavailable right now.' }, { status: 502 });
    }

    const data = await response.json();
    return Response.json({
      locations: (data.results ?? []).map(
        (location: {
          id: number;
          name: string;
          latitude: number;
          longitude: number;
          country?: string;
          admin1?: string;
        }) => ({
          id: location.id,
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
          country: location.country ?? '',
          region: location.admin1 ?? '',
        })
      ),
    });
  } catch (error) {
    console.error('Location search failed', error);
    return Response.json({ error: 'Location search is unavailable right now.' }, { status: 502 });
  }
}
