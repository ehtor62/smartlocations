import { NextResponse } from 'next/server';
import { requireAuth } from '../../../utils/server-auth';

export async function GET(req: Request) {
  // Verify authentication
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'SmartLocations/1.0'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
