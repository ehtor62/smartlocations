'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// Basic Leaflet icon fix for Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: '/leaflet/marker-icon.png',
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    shadowUrl: '/leaflet/marker-shadow.png'
  });
}

// Create red marker icon using CSS filter
const redIcon = typeof window !== 'undefined' ? new L.Icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'red-marker'
}) : null;

// Function to create numbered marker icons
const createNumberedIcon = (number: number) => {
  if (typeof window === 'undefined') return null;
  
  return L.divIcon({
    html: `<div class="numbered-marker">
             <div class="marker-number">${number}</div>
           </div>`,
    className: 'numbered-marker-container',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
  });
};

// Add CSS for red marker and circle tooltip
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .red-marker {
      filter: hue-rotate(120deg) saturate(2) brightness(1.2);
    }
    .circle-tooltip {
      background: rgba(59, 130, 246, 0.9) !important;
      border: none !important;
      border-radius: 3px !important;
      color: white !important;
      font-size: 10px !important;
      font-weight: 500 !important;
      padding: 2px 4px !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.2) !important;
    }
    .circle-tooltip::before {
      border-top-color: rgba(59, 130, 246, 0.9) !important;
    }
    .numbered-marker-container {
      background: none !important;
      border: none !important;
    }
    .numbered-marker {
      width: 25px;
      height: 41px;
      background-image: url('/leaflet/marker-icon.png');
      background-size: contain;
      position: relative;
    }
    .marker-number {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      color: #1f2937;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      border: 1px solid #3b82f6;
    }
  `;
  if (!document.head.querySelector('style[data-red-marker]')) {
    style.setAttribute('data-red-marker', 'true');
    document.head.appendChild(style);
  }
}


function Recenter({ center }: { center: { lat: number; lon: number } }) {
  const map = useMap();
  useEffect(() => {
    // Only recenter without changing zoom - AutoZoomToCircle will handle zoom
    map.setView([center.lat, center.lon], map.getZoom(), { animate: false });
  }, [center.lat, center.lon, map]);
  return null;
}

function AutoZoomToCircle({ center, radius, showCircle }: { center: { lat: number; lon: number }, radius: number, showCircle: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (showCircle && radius > 0) {
      // Calculate the zoom level to fit the circle with 70% coverage
      // Formula: zoom = log2(circumference_earth_meters / (radius_meters * pixels_per_screen_width * coverage_factor))
      // Simplified: for 70% coverage, we want the circle diameter to be about 70% of screen width
      
      const mapContainer = map.getContainer();
      const screenWidth = mapContainer.offsetWidth;
      const screenHeight = mapContainer.offsetHeight;
      const minDimension = Math.min(screenWidth, screenHeight);
      
      // We want the circle diameter (radius * 2) to cover 70% of the smaller screen dimension
      const targetPixelRadius = (minDimension * 0.35); // 70% / 2 = 35% for radius
      
      // Calculate zoom level based on meters per pixel at current latitude
      // At zoom level z, meters per pixel = 156543.03392 * Math.cos(lat * π/180) / 2^z
      const metersPerPixelAtZoom0 = 156543.03392 * Math.cos(center.lat * Math.PI / 180);
      const targetMetersPerPixel = radius / targetPixelRadius;
      const targetZoom = Math.log2(metersPerPixelAtZoom0 / targetMetersPerPixel);
      
      // Clamp zoom between reasonable bounds (3-18)
      const clampedZoom = Math.max(3, Math.min(18, targetZoom));
      
      map.setView([center.lat, center.lon], clampedZoom);
    }
  }, [map, center.lat, center.lon, radius, showCircle]);
  
  return null;
}

import type { Place } from '../app/page';

export default function MapClient({ center, places, showCurrentLocation }: { center: { lat: number; lon: number }, places: Place[], showCurrentLocation: boolean }) {
  // Calculate the maximum distance for the circle radius
  const maxDistance = places.length > 0 ? Math.max(...places.map(p => p.distance_m)) : 0;
  
  return (
    <MapContainer center={[center.lat, center.lon] as [number, number]} zoom={13} style={{ height: '100vh', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={center} />
      <AutoZoomToCircle center={center} radius={maxDistance} showCircle={showCurrentLocation && maxDistance > 0} />

      {/* Circle showing search radius to the most distant marker */}
      {showCurrentLocation && maxDistance > 0 && (
        <Circle
          center={[center.lat, center.lon] as [number, number]}
          radius={maxDistance}
          pathOptions={{
            color: '#3b82f6',
            weight: 2,
            opacity: 0.6,
            fillColor: '#3b82f6',
            fillOpacity: 0.1
          }}
        >
          <Tooltip permanent direction="center" className="circle-tooltip">
            {maxDistance >= 1000 
              ? `${(maxDistance / 1000).toFixed(1)} km radius` 
              : `${Math.round(maxDistance)} m radius`
            }
          </Tooltip>
        </Circle>
      )}

      {/* Current location marker with red color */}
      {showCurrentLocation && (
        <Marker position={[center.lat, center.lon] as [number, number]} icon={redIcon || undefined}>
          <Popup>
            <div>
              <strong>Your Location</strong>
              <div style={{ fontSize: 12 }}>Lat: {center.lat.toFixed(6)}</div>
              <div style={{ fontSize: 12 }}>Lon: {center.lon.toFixed(6)}</div>
            </div>
          </Popup>
        </Marker>
      )}

      {places.map((p, index) => (
        <Marker 
          key={`${p.type}-${p.id}`} 
          position={[p.lat, p.lon] as [number, number]}
          icon={createNumberedIcon(index + 1) || undefined}
        >
          <Popup>
            <div>
              <strong>
                <span style={{ marginRight: 8, color: '#3b82f6' }}>{index + 1}.</span>
                {p.tags.name || `${p.tags.amenity || p.tags.tourism || p.tags['place'] || 'POI'}`}
              </strong>
              <div style={{ fontSize: 12 }}>
                {(() => {
                  const tags = Object.entries(p.tags || {});
                  const addressOrder = ['addr:postcode', 'addr:city', 'addr:street', 'addr:housenumber'];
                  
                  // Sort tags: address tags in specified order first, then other tags
                  const addressTags = addressOrder
                    .map(addrKey => tags.find(([k]) => k === addrKey))
                    .filter((tag): tag is [string, string] => tag !== undefined);
                  
                  const otherTags = tags.filter(([k]) => !k.startsWith('addr:'));
                  
                  const sortedTags = [...addressTags, ...otherTags].slice(0, 5);
                  
                  return sortedTags.map(([k, v]) => (
                    <div key={k}>
                      {k.startsWith('addr:') ? k.replace('addr:', '') : k}: {
                        (k === 'website' || k === 'url' || (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://')))) ? (
                          <a 
                            href={v.startsWith('http') ? v : `https://${v}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#3b82f6', textDecoration: 'underline' }}
                          >
                            {v}
                          </a>
                        ) : v
                      }
                    </div>
                  ));
                })()}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: '#16a34a' }}>Distance: {Math.round(p.distance_m)} m</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}