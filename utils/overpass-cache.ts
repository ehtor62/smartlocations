// Simple in-memory cache for Overpass API results
interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class OverpassCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes - increased for better performance

  // Generate cache key from coordinates, tags, radiusKm, and limit
  private getCacheKey(lat: number, lon: number, tags: string[], radiusKm: number, limit: number): string {
    // Round coordinates to reduce cache misses for nearby locations
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLon = Math.round(lon * 1000) / 1000;
    const sortedTags = [...tags].sort().join(',');
    return `${roundedLat},${roundedLon}:${sortedTags}:radius=${radiusKm}:limit=${limit}`;
  }

  // Get cached result if available and not expired
  get(lat: number, lon: number, tags: string[], radiusKm: number, limit: number): unknown | null {
    const key = this.getCacheKey(lat, lon, tags, radiusKm, limit);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  // Store result in cache
  set(lat: number, lon: number, tags: string[], radiusKm: number, limit: number, data: unknown, ttl?: number): void {
    const key = this.getCacheKey(lat, lon, tags, radiusKm, limit);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const overpassCache = new OverpassCache();

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    overpassCache.cleanup();
  }, 10 * 60 * 1000);
}
