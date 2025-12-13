'use client';

import React, { useEffect, useState } from 'react';
import { useFirebaseUser } from './LoginModalOnLoadWrapper';
import { getAuth, signOut } from 'firebase/auth';
import app from '../utils/firebase';
import Image from 'next/image';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Tooltip, ZoomControl } from 'react-leaflet';
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
const createNumberedIcon = (number: number, isNewlyAdded: boolean = false) => {
  if (typeof window === 'undefined') return null;
  
  const markerClass = isNewlyAdded ? 'numbered-marker new-place' : 'numbered-marker';
  
  return L.divIcon({
    html: `<div class="${markerClass}">
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
    .numbered-marker.new-place {
      filter: hue-rotate(-120deg) saturate(2) brightness(1.2);
      animation: pulse-new 2s ease-in-out infinite;
    }
    @keyframes pulse-new {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
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
  const user = useFirebaseUser();
  const [showLogout, setShowLogout] = useState(false);
  // Calculate the maximum distance for the circle radius
  const maxDistance = places.length > 0 ? Math.max(...places.map(p => p.distance_m)) : 0;
  
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* User avatar/name overlay */}
      {user && (
        <div style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 2000,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 40
        }}>
          {user.photoURL ? (
            <Image src={user.photoURL} alt="User avatar" width={32} height={32} style={{ borderRadius: '50%' }} />
          ) : (
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#3b82f6',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 14
            }}>
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span 
            style={{ 
              fontWeight: 500, 
              fontSize: 15, 
              cursor: 'pointer',
              textDecoration: showLogout ? 'underline' : 'none'
            }}
            onClick={() => setShowLogout(!showLogout)}
            title="Click to show/hide logout"
          >
            {user.displayName || user.email || 'User'}
          </span>
          {showLogout && (
            <button
              onClick={() => signOut(getAuth(app))}
              style={{
                marginLeft: 8,
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                padding: 0,
                textDecoration: 'underline',
              }}
              title="Log out"
            >
              Log out
            </button>
          )}
        </div>
      )}
  <MapContainer center={[center.lat, center.lon] as [number, number]} zoom={13} style={{ height: '100vh', width: '100%' }} zoomControl={false}>
  <ZoomControl position="bottomleft" />
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
          icon={createNumberedIcon(index + 1, p.isNewlyAdded) || undefined}
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
                  
                  // Filter out redundant tags
                  const filteredTags = tags.filter(([k]) => {
                    // Exclude basic unwanted tags
                    if (k === 'name' || k === 'wheelchair' || k.startsWith('ref:')) return false;
                    // Exclude language-specific name tags (e.g., name:en:, name:fr:)
                    if (/^name:[a-z]{2}:/.test(k)) return false;
                    return true;
                  });
                  
                  // Sort tags: address tags in specified order first, then other tags
                  const addressTags = addressOrder
                    .map(addrKey => filteredTags.find(([k]) => k === addrKey))
                    .filter((tag): tag is [string, string] => tag !== undefined);
                  
                  const otherTags = filteredTags.filter(([k]) => !k.startsWith('addr:') && !k.startsWith('contact:'));
                  
                  // Check for contact address components
                  const contactStreetTag = filteredTags.find(([k]) => k === 'contact:street');
                  const contactHouseNumberTag = filteredTags.find(([k]) => k === 'contact:housenumber');
                  const contactCityTag = filteredTags.find(([k]) => k === 'contact:city');
                  const contactPostcodeTag = filteredTags.find(([k]) => k === 'contact:postcode');
                  
                  let processedAddressTags = addressTags;
                  let combinedStreetAddress = null;
                  let combinedContactAddress = null;
                  
                  // Combine contact address if we have components
                  if (contactStreetTag || contactHouseNumberTag || contactCityTag || contactPostcodeTag) {
                    const addressParts: string[] = [];
                    
                    // Add housenumber and street
                    if (contactHouseNumberTag && contactStreetTag) {
                      addressParts.push(`${contactHouseNumberTag[1]} ${contactStreetTag[1]}`);
                    } else if (contactStreetTag) {
                      addressParts.push(contactStreetTag[1]);
                    } else if (contactHouseNumberTag) {
                      addressParts.push(contactHouseNumberTag[1]);
                    }
                    
                    // Add city and postcode
                    if (contactCityTag && contactPostcodeTag) {
                      addressParts.push(`${contactCityTag[1]} ${contactPostcodeTag[1]}`);
                    } else if (contactCityTag) {
                      addressParts.push(contactCityTag[1]);
                    } else if (contactPostcodeTag) {
                      addressParts.push(contactPostcodeTag[1]);
                    }
                    
                    if (addressParts.length > 0) {
                      combinedContactAddress = {
                        key: 'combined_contact',
                        value: addressParts.join(', ')
                      };
                      
                      // Filter out corresponding addr: fields to prevent duplication
                      processedAddressTags = processedAddressTags.filter(([k]) => {
                        if (contactStreetTag && k === 'addr:street') return false;
                        if (contactHouseNumberTag && k === 'addr:housenumber') return false;
                        if (contactCityTag && k === 'addr:city') return false;
                        if (contactPostcodeTag && k === 'addr:postcode') return false;
                        return true;
                      });
                    }
                  } else {
                    // Check for any addr: components to combine them
                    const streetTag = addressTags.find(([k]) => k === 'addr:street');
                    const houseNumberTag = addressTags.find(([k]) => k === 'addr:housenumber');
                    const cityTag = addressTags.find(([k]) => k === 'addr:city');
                    const postcodeTag = addressTags.find(([k]) => k === 'addr:postcode');
                    
                    // Create combined address if we have multiple addr components
                    if ((streetTag || houseNumberTag || cityTag || postcodeTag) && 
                        (streetTag && (houseNumberTag || cityTag || postcodeTag)) || 
                        (cityTag && postcodeTag)) {
                      
                      const addressParts: string[] = [];
                      
                      // Add housenumber and street
                      if (houseNumberTag && streetTag) {
                        addressParts.push(`${houseNumberTag[1]} ${streetTag[1]}`);
                      } else if (streetTag) {
                        addressParts.push(streetTag[1]);
                      } else if (houseNumberTag) {
                        addressParts.push(houseNumberTag[1]);
                      }
                      
                      // Add city and postcode
                      if (cityTag && postcodeTag) {
                        addressParts.push(`${cityTag[1]} ${postcodeTag[1]}`);
                      } else if (cityTag) {
                        addressParts.push(cityTag[1]);
                      } else if (postcodeTag) {
                        addressParts.push(postcodeTag[1]);
                      }
                      
                      if (addressParts.length > 0) {
                        combinedStreetAddress = {
                          key: 'combined_addr',
                          value: addressParts.join(', ')
                        };
                        
                        // Filter out the combined address components
                        processedAddressTags = processedAddressTags.filter(([k]) => {
                          if (streetTag && k === 'addr:street') return false;
                          if (houseNumberTag && k === 'addr:housenumber') return false;
                          if (cityTag && k === 'addr:city') return false;
                          if (postcodeTag && k === 'addr:postcode') return false;
                          return true;
                        });
                      }
                    } else if (streetTag && houseNumberTag) {
                      // Fallback to original simple combination
                      combinedStreetAddress = {
                        key: 'combined_street',
                        value: `${streetTag[1]} ${houseNumberTag[1]}`
                      };
                      processedAddressTags = processedAddressTags.filter(([k]) => k !== 'addr:street' && k !== 'addr:housenumber');
                    }
                  }
                  
                  const sortedTags = [...processedAddressTags, ...otherTags].slice(0, 5);
                  
                  return (
                    <>
                      {combinedStreetAddress && (
                        <div style={{ marginBottom: 2, fontWeight: 500, color: '#059669' }}>
                          📍 {combinedStreetAddress.value}
                        </div>
                      )}
                      {combinedContactAddress && (
                        <div style={{ marginBottom: 2, fontWeight: 500, color: '#059669' }}>
                          📍 {combinedContactAddress.value}
                        </div>
                      )}
                      {sortedTags.map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 2 }}>
                          {k === 'wikidata' && typeof v === 'string' ? (
                            <a 
                              href={`https://www.wikidata.org/wiki/${v}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#3b82f6', textDecoration: 'underline' }}
                            >
                              {`www.wikidata.org/wiki/${v}`}
                            </a>
                          ) : k === 'wikipedia' && typeof v === 'string' && (v.startsWith('de:') || v.startsWith('es:')) ? (
                            (() => {
                              const langCode = v.substring(0, 2);
                              const title = v.substring(3).replace(/ /g, '_');
                              return (
                                <a 
                                  href={`https://${langCode}.wikipedia.org/wiki/${title}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ color: '#3b82f6', textDecoration: 'underline' }}
                                >
                                  {`https://${langCode}.wikipedia.org/wiki/${title}`}
                                </a>
                              );
                            })()
                          ) : k.startsWith('addr:') ? (
                            <div style={{ fontWeight: 500, color: '#059669' }}>
                              📍 {k.replace('addr:', '')}: {v}
                            </div>
                          ) : (
                            <>
                              {k === 'alt_name' ? 'aka' : k === 'check_date' ? 'last checked' : k.startsWith('check_date:') ? `last checked ${k.substring(11)}` : k}: {
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
                            </>
                          )}
                        </div>
                      ))}
                    </>
                  );
                })()}
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: '#16a34a' }}>Distance: {Math.round(p.distance_m)} m</div>
            </div>
          </Popup>
        </Marker>
      ))}
      </MapContainer>
    </div>
  );
}