// Type guard for error with message
function hasMessage(err: unknown): err is { message: string } {
  return typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string';
}

import { NextResponse } from 'next/server';
import { getSearchRadiusMeters } from '../../../utils/constants';
import { overpassCache } from '../../../utils/overpass-cache';
import { requireAuth } from '../../../utils/server-auth';

// Type for Overpass API elements
interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

// Type for API response
interface SearchResult {
  places: {
    id: number;
    type: string;
    lat: number;
    lon: number;
    tags: Record<string, string>;
    distance_m: number;
  }[];
}

// Helper: Haversine distance
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371e3; // metres
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);
  const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // meters
}

export async function POST(req: Request) {
  // Verify authentication
  const authError = await requireAuth(req);
  if (authError) return authError;

  try {
  const body = await req.json();
  const { lat, lon, tags, keyword, limit = 20, radiusKm = 5, boundingbox } = body as { 
    lat: number; 
    lon: number; 
    tags?: string[]; 
    keyword?: string; 
    limit?: number; 
    radiusKm?: number;
    boundingbox?: string[]; // [minlat, maxlat, minlon, maxlon]
  };
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: 'lat and lon required' }, { status: 400 });
    }

    // For broad areas with bounding box, skip caching for now (could add bbox to cache key later)
    if (!boundingbox) {
      // Check cache first (now includes radiusKm and limit)
      const cacheKey = keyword ? `keyword:${keyword}` : (tags || []).join(',');
      const cachedResult = overpassCache.get(lat, lon, keyword ? [cacheKey] : (tags || []), radiusKm, limit);
      if (cachedResult) {
        console.log('Returning cached result');
        return NextResponse.json(cachedResult as SearchResult);
      }
    }

    // Build Overpass QL
    const radiusMeters = getSearchRadiusMeters(radiusKm);
    
    let query: string;
    
    if (keyword) {
      // Keyword search: Use Nominatim instead of Overpass for text search (much faster)
      const searchTerm = keyword.trim();
      
      console.log('Keyword search using Nominatim for:', searchTerm);
      
      try {
        // Build viewbox based on bounding box or radius
        let viewboxParam: string;
        if (boundingbox && boundingbox.length === 4) {
          const [minlat, maxlat, minlon, maxlon] = boundingbox.map(parseFloat);
          viewboxParam = `viewbox=${minlon},${maxlat},${maxlon},${minlat}`;
          console.log('Using bounding box for keyword search:', viewboxParam);
        } else {
          // Use radius-based viewbox
          viewboxParam = `viewbox=${lon - (radiusKm * 0.015)},${lat + (radiusKm * 0.015)},${lon + (radiusKm * 0.015)},${lat - (radiusKm * 0.015)}`;
        }
        
        // Use Nominatim search API to find places by keyword
        const nominatimResp = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(searchTerm)}&` +
          `lat=${lat}&lon=${lon}&` +
          `format=json&` +
          `limit=${limit}&` +
          `bounded=1&` +
          `${viewboxParam}&` +
          `addressdetails=1&` +
          `extratags=1`,
          {
            headers: { 'User-Agent': 'SmartLocations/1.0' },
            signal: AbortSignal.timeout(10000)
          }
        );
        
        if (!nominatimResp.ok) {
          throw new Error(`Nominatim returned ${nominatimResp.status}`);
        }
        
        const nominatimResults = await nominatimResp.json();
        
        // Convert Nominatim results to our format
        const places: SearchResult['places'] = nominatimResults.map((result: any, index: number) => {
          // Extract place name from display_name (first part before comma)
          const displayName = result.display_name || searchTerm;
          const placeName = displayName.split(',')[0].trim();
          
          // Build tags object with structured address
          const tags: Record<string, string> = {
            name: placeName,
            ...result.extratags
          };
          
          // Map Nominatim address to OSM addr:* format
          if (result.address) {
            const addr = result.address;
            
            // Map house number
            if (addr.house_number) {
              tags['addr:housenumber'] = addr.house_number;
            }
            
            // Map street (try road first, then other street types)
            if (addr.road) {
              tags['addr:street'] = addr.road;
            } else if (addr.pedestrian) {
              tags['addr:street'] = addr.pedestrian;
            } else if (addr.footway) {
              tags['addr:street'] = addr.footway;
            } else if (addr.path) {
              tags['addr:street'] = addr.path;
            }
            
            // Map city (try city first, then town, village, etc.)
            if (addr.city) {
              tags['addr:city'] = addr.city;
            } else if (addr.town) {
              tags['addr:city'] = addr.town;
            } else if (addr.village) {
              tags['addr:city'] = addr.village;
            } else if (addr.municipality) {
              tags['addr:city'] = addr.municipality;
            }
            
            // Map postcode
            if (addr.postcode) {
              tags['addr:postcode'] = addr.postcode;
            }
            
            // Map country
            if (addr.country) {
              tags['addr:country'] = addr.country;
            }
            
            // Map state/region
            if (addr.state) {
              tags['addr:state'] = addr.state;
            }
          }
          
          return {
            id: parseInt(result.osm_id) || index,
            type: result.osm_type || 'node',
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            tags,
            distance_m: Math.round(haversineDistance(lat, lon, parseFloat(result.lat), parseFloat(result.lon)))
          };
        });
        
        // Sort by distance
        places.sort((a, b) => a.distance_m - b.distance_m);
        
        const result = { places: places.slice(0, limit) };
        
        // Cache the result
        const cacheKeyForStorage = `keyword:${keyword}`;
        overpassCache.set(lat, lon, [cacheKeyForStorage], radiusKm, limit, result);
        
        return NextResponse.json(result);
        
      } catch (nominatimError) {
        console.error('Nominatim search failed:', nominatimError);
        // Fall back to empty results
        return NextResponse.json({ places: [] });
      }
    } else if (tags && tags.length > 0) {
      // Tag-based search (existing Overpass logic)
      // Use bounding box for broad areas, radius for specific locations
      if (boundingbox && boundingbox.length === 4) {
        console.log('Using bounding box search for broad area');
        const [minlat, maxlat, minlon, maxlon] = boundingbox.map(parseFloat);
        
        const tagFilters = (tags || []).map((t: string) => {
          const [k, v] = t.split('=');
          return `node["${k}"="${v}"](${minlat},${minlon},${maxlat},${maxlon});way["${k}"="${v}"](${minlat},${minlon},${maxlat},${maxlon});relation["${k}"="${v}"](${minlat},${minlon},${maxlat},${maxlon});`;
        }).join('\n');

        query = `
        [out:json][timeout:45];
        (
          ${tagFilters}
        );
        out center;`;
      } else {
        // Radius-based search for specific locations
        const tagFilters = (tags || []).map((t: string) => {
          const [k, v] = t.split('=');
          return `node["${k}"="${v}"](around:${radiusMeters},${lat},${lon});way["${k}"="${v}"](around:${radiusMeters},${lat},${lon});relation["${k}"="${v}"](around:${radiusMeters},${lat},${lon});`;
        }).join('\n');

        query = `
        [out:json][timeout:45];
        (
          ${tagFilters}
        );
        out center;`;
      }
    } else {
      // No keyword and no tags provided
      return NextResponse.json({ places: [] });
    }

    // List of Overpass API endpoints for fallback (reordered by typical response time)
    const overpassEndpoints = [
      'https://overpass.kumi.systems/api/interpreter', // Usually fastest
      'https://overpass-api.de/api/interpreter',       // Official but can be slower
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter' // Backup
    ];

    let lastError: Error | null = null;
    
    // Try each endpoint until one works
    for (const endpoint of overpassEndpoints) {
      try {
        console.log(`Trying Overpass endpoint: ${endpoint}`);
        
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(50000) // 50 second timeout to allow for Overpass timeout
        });

        if (!resp.ok) {
          console.warn(`Overpass endpoint ${endpoint} returned status ${resp.status}`);
          lastError = new Error(`HTTP ${resp.status} from ${endpoint}`);
          continue;
        }

        const json = await resp.json();
        
        // Check if we got a valid response structure
        if (!json || typeof json !== 'object') {
          console.warn(`Invalid JSON response from ${endpoint}`);
          lastError = new Error(`Invalid response from ${endpoint}`);
          continue;
        }

        // Check for Overpass API errors
        if (json.remark && json.remark.includes('error')) {
          console.warn(`Overpass API error from ${endpoint}: ${json.remark}`);
          lastError = new Error(`Overpass error: ${json.remark}`);
          continue;
        }

        const elements: OverpassElement[] = json.elements || [];
        console.log(`Successfully got ${elements.length} elements from ${endpoint}`);
        
        // Process the results (same as before)
        const normalized = elements.map((el: OverpassElement) => {
          let elLat = el.lat;
          let elLon = el.lon;
          if (elLat == null || elLon == null) {
            // for ways/relations Overpass returns center
            if (el.center) {
              elLat = el.center.lat;
              elLon = el.center.lon;
            }
          }
          return {
            id: el.id,
            type: el.type,
            lat: elLat,
            lon: elLon,
            tags: el.tags || {}
          };
        }).filter((e) => e.lat != null && e.lon != null);

        // Compute distances and sort
        const withDist = normalized.map((e) => ({ ...e, distance: haversineDistance(lat, lon, e.lat!, e.lon!) }));
        withDist.sort((a, b) => a.distance - b.distance);

        // Choose up to the specified limit or all within radius
        const chosen = withDist.slice(0, limit).map((e) => ({ id: e.id, type: e.type, lat: e.lat, lon: e.lon, tags: e.tags, distance_m: Math.round(e.distance) }));

        const result = { places: chosen };
        
  // Cache the successful result (now includes radiusKm and limit)
  const cacheKeyForStorage = keyword ? `keyword:${keyword}` : (tags || []).join(',');
  overpassCache.set(lat, lon, keyword ? [cacheKeyForStorage] : (tags || []), radiusKm, limit, result);
        
        return NextResponse.json(result);
        
      } catch (fetchError: unknown) {
        console.warn(`Error with endpoint ${endpoint}:`, fetchError);
        lastError = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
        continue;
      }
    }
    
    // If all endpoints failed, return the last error
    console.error('All Overpass endpoints failed. Last error:', lastError);
    return NextResponse.json({ 
      error: 'All Overpass API endpoints unavailable', 
      details: lastError?.message || 'Unknown error'
    }, { status: 502 });

  } catch (err: unknown) {
    console.error('Search error', err);
    let message = 'Unknown error';
    if (hasMessage(err)) {
      message = err.message;
    } else if (typeof err === 'string') {
      message = err;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
