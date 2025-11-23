import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 3) {
      return NextResponse.json({ error: 'Query must be at least 3 characters' }, { status: 400 });
    }

    // Make the request to Nominatim with improved parameters for autocomplete
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` + 
      `format=json&` +
      `addressdetails=1&` +
      `limit=8&` +
      `countrycodes=&` +
      `accept-language=en&` +
      `q=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent': 'SmartLocations/1.0 (https://github.com/ehtor62/smartlocations)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Address search error:', error);
    return NextResponse.json(
      { error: 'Failed to search addresses' },
      { status: 500 }
    );
  }
}
