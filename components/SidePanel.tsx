'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useFirebaseUser } from './LoginModalOnLoadWrapper';


import type { Place } from '../app/page';

export default function SidePanel({ open, onClose, onMinimize, places, minimized, searchLocation, selectedCategories, isFavoritesSearch }: { 
  open: boolean, 
  onClose: () => void, 
  onMinimize: () => void, 
  places: Place[], 
  minimized: boolean,
  searchLocation?: string,
  selectedCategories: string[],
  isFavoritesSearch?: boolean
}) {
  const [geminiPanelVisible, setGeminiPanelVisible] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  
  // Calculate responsive width - ensure it never exceeds viewport
  const sidebarWidth = typeof window !== 'undefined' ? Math.min(360, window.innerWidth * 0.9, window.innerWidth - 40) : 360;

  // Function to convert URLs in text to clickable links
  const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    
    // URL regex pattern that matches http/https URLs but excludes trailing punctuation
    const urlRegex = /(https?:\/\/[^\s]*[^\s.,!?*"';:)])/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3b82f6',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const user = useFirebaseUser();

  return (
    <div style={{
      position: 'absolute',
      right: open ? 0 : -Math.max(sidebarWidth, 400), // Ensure it's completely off-screen
      top: 0,
      height: '100vh',
      width: minimized ? 0 : sidebarWidth,
      maxWidth: '100vw',
      background: 'white',
      boxShadow: minimized ? 'none' : '-4px 0 12px rgba(0,0,0,0.2)',
      transition: 'right 300ms ease-in-out, width 300ms ease-in-out, box-shadow 300ms ease-in-out',
      zIndex: 1001,
      padding: minimized ? 0 : 16,
      overflowY: minimized ? 'hidden' : 'auto',
      borderLeft: minimized ? 'none' : '2px solid #3b82f6',
      overflowX: 'hidden'
    }}>
      {!minimized && (
        <>
          {/* Gemini AI Panel */}
          {geminiPanelVisible && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '40vh',
              backgroundColor: 'white',
              borderBottom: '2px solid #3b82f6',
              zIndex: 1002,
              padding: 16,
              overflowY: 'auto',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: '#1f2937', fontSize: 18, fontWeight: 600 }}>✨ AI Information</h3>
                <button
                  onClick={() => setGeminiPanelVisible(false)}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  ✕
                </button>
              </div>
              {geminiLoading ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                  <div>🤖 AI is thinking...</div>
                </div>
              ) : (
                <div style={{ 
                  whiteSpace: 'pre-wrap', 
                  lineHeight: 1.5, 
                  color: '#374151',
                  fontSize: 14 
                }}>
                  {renderTextWithLinks(geminiResponse)}
                </div>
              )}
            </div>
          )}
          
          {/* User info section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {user.photoURL ? (
                  <Image src={user.photoURL} alt="User avatar" width={32} height={32} style={{ borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: 24, marginRight: 4 }}>👤</span>
                )}
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: sidebarWidth < 300 ? 4 : 8, flexDirection: sidebarWidth < 300 ? 'column' : 'row' }}>
              <button 
                onClick={onMinimize}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: sidebarWidth < 300 ? '4px 8px' : '6px 12px',
                  cursor: 'pointer',
                  fontSize: sidebarWidth < 300 ? 10 : 12
                }}
              >
                View Map
              </button>
              <button 
                onClick={onClose}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: sidebarWidth < 300 ? '4px 8px' : '6px 12px',
                  cursor: 'pointer',
                  fontSize: sidebarWidth < 300 ? 10 : 12
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
          
          <div
            style={{ 
              margin: '0 0 16px 0', 
              fontSize: sidebarWidth < 300 ? 16 : 18, 
              fontWeight: 600, 
              color: '#1f2937',
              background: '#f3f4f6',
              border: 'none',
              padding: '8px 12px',
              textAlign: 'left',
              width: '100%',
              borderRadius: '6px'
            }}
          >
            {`Found ${places.length} Places${isFavoritesSearch ? ' for Favorites' : (selectedCategories.length > 0 ? ` for ${selectedCategories.join(', ')}` : '')}${searchLocation ? ` in ${searchLocation}` : ''}.`}
          </div>

          {places.length === 0 && (
        <div style={{ 
          marginTop: 24, 
          padding: 16, 
          background: '#f3f4f6', 
          borderRadius: 8, 
          textAlign: 'center',
          color: '#6b7280'
        }}>
          No places found in the selected radius around the red marker. Try a different location!
        </div>
      )}

      <ul style={{ marginTop: 0, padding: 0, listStyle: 'none' }}>
        {places.map((p, index) => (
          <li key={`${p.type}-${p.id}`} style={{ 
            padding: 12, 
            borderBottom: '1px solid #e5e7eb',
            background: index % 2 === 0 ? '#f9fafb' : 'white',
            marginBottom: 4,
            borderRadius: 6
          }}>
            <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
              <span style={{ marginRight: 8, color: '#3b82f6' }}>{index + 1}.</span>
              {p.tags?.name || (p.tags?.amenity || p.tags?.tourism || p.tags?.leisure) || 'Unnamed Place'}
              <span 
                onClick={async () => {
                  setGeminiLoading(true);
                  setGeminiPanelVisible(true);
                  
                  try {
                    // Collect place information excluding distance
                    const title = p.tags?.name || (p.tags?.amenity || p.tags?.tourism || p.tags?.leisure) || 'Unnamed Place';
                    
                    const promptParts = [`Please provide interesting and helpful information about this place: ${title}`];
                    
                    if (p.tags) {
                      const tags = Object.entries(p.tags);
                      
                      // Add address information
                      const addressComponents = {
                        postcode: p.tags['addr:postcode'],
                        city: p.tags['addr:city'],
                        street: p.tags['addr:street'],
                        housenumber: p.tags['addr:housenumber']
                      };
                      
                      const hasCompleteAddress = Object.values(addressComponents).every(v => v && v.trim());
                      if (hasCompleteAddress) {
                        const formattedAddress = `${addressComponents.street} ${addressComponents.housenumber}, ${addressComponents.postcode} ${addressComponents.city}`;
                        promptParts.push(`Address: ${formattedAddress}`);
                      }
                      
                      // Add other relevant tags (excluding internal/technical ones)
                      const relevantTags = tags.filter(([k]) => 
                        !k.startsWith('addr:') && 
                        !k.startsWith('contact:') && 
                        !k.startsWith('ref:') && 
                        k !== 'name' && 
                        k !== 'wheelchair' && 
                        k !== 'direction' && 
                        k !== 'source' && 
                        k !== 'panoramax'
                      );
                      
                      relevantTags.forEach(([k, v]) => {
                        let displayKey = k;
                        let displayValue = v;
                        
                        // Apply transformations
                        if (k === 'tourism' && v === 'viewpoint') {
                          promptParts.push('Type: viewpoint');
                          return;
                        }
                        if (k === 'tourism' && v === 'hotel') {
                          promptParts.push('Type: hotel');
                          return;
                        }
                        if (k === 'highway' && v === 'bus_stop') {
                          promptParts.push('Type: bus stop');
                          return;
                        }
                        if (k === 'alt_name') displayKey = 'Also known as';
                        if (k === 'ele') {
                          promptParts.push(`Altitude: ${v}m`);
                          return;
                        }
                        if (k === 'air_conditioning') displayKey = 'Air condition';
                        if (k.endsWith(':wikidata')) {
                          displayKey = k.replace(':wikidata', '');
                          displayValue = `wikidata.org/wiki/${v}`;
                        }
                        if (k === 'check_date') displayKey = 'Last checked';
                        if (k.startsWith('check_date:')) displayKey = `Last checked ${k.substring(11)}`;
                        
                        promptParts.push(`${displayKey}: ${displayValue}`);
                      });
                    }
                    
                    const prompt = promptParts.join('\n');
                    
                    // Call our API instead of opening website
                    const response = await fetch('/api/gemini', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ prompt }),
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                      setGeminiResponse(data.response);
                    } else {
                      setGeminiResponse(`Error: ${data.error || 'Failed to get response'}`);
                    }
                  } catch {
                    setGeminiResponse(`Error: Failed to connect to AI service`);
                  } finally {
                    setGeminiLoading(false);
                  }
                }}
                style={{ 
                marginLeft: 8, 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                borderRadius: '50%', 
                width: '20px', 
                height: '20px', 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '12px',
                cursor: 'pointer'
              }}>?</span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
              {(() => {
                if (!p.tags) return '';
                
                const tags = Object.entries(p.tags);
                const addressOrder = ['addr:postcode', 'addr:city', 'addr:street', 'addr:housenumber'];
                
                // Check if we have all address components for formatted address
                const addressComponents = {
                  postcode: p.tags['addr:postcode'],
                  city: p.tags['addr:city'],
                  street: p.tags['addr:street'],
                  housenumber: p.tags['addr:housenumber']
                };
                
                const hasCompleteAddress = Object.values(addressComponents).every(v => v && v.trim());
                
                if (hasCompleteAddress) {
                  // Format as "Main Street 42, 12345 Berlin"
                  const formattedAddress = `${addressComponents.street} ${addressComponents.housenumber}, ${addressComponents.postcode} ${addressComponents.city}`;
                  
                  // Get other non-address tags (exclude 'name' since it's already shown as title, exclude 'wheelchair')
                  const otherTags = tags.filter(([k]) => !k.startsWith('addr:') && !k.startsWith('contact:') && k !== 'name' && k !== 'wheelchair' && k !== 'direction' && k !== 'source' && k !== 'panoramax').slice(0, 4); // Limit to 4 since we have address
                  
                  return (
                    <>
                      <div style={{ marginBottom: 2, fontWeight: 500, color: '#059669' }}>
                        📍 {formattedAddress}
                      </div>
                      {otherTags.map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 2 }}>
                          {k === 'wikidata' && typeof v === 'string' ? (
                            <a 
                              href={`https://www.wikidata.org/wiki/${v}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#3b82f6', textDecoration: 'underline' }}
                            >
                              {`wikidata.org/wiki/${v}`}
                            </a>
                          ) : k === 'wikipedia' && typeof v === 'string' && v.startsWith('de:') ? (
                            <a 
                              href={`https://de.wikipedia.org/wiki/${v.substring(3).replace(/ /g, '_')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#3b82f6', textDecoration: 'underline' }}
                            >
                              {`https://de.wikipedia.org/wiki/${v.substring(3).replace(/ /g, '_')}`}
                            </a>
                          ) : (
                            <>
                              {k === 'tourism' && v === 'viewpoint' ? 'viewpoint' : k === 'tourism' && v === 'hotel' ? 'hotel' : k === 'highway' && v === 'bus_stop' ? 'bus stop' : k === 'alt_name' ? 'aka:' : k === 'ele' ? 'altitude:' : k === 'air_conditioning' ? 'air condition:' : k.endsWith(':wikidata') ? `${k.replace(':wikidata', '')}:` : k === 'check_date' ? 'last checked:' : k.startsWith('check_date:') ? `last checked ${k.substring(11)}:` : `${k}:`} {
                                k === 'tourism' && v === 'viewpoint' ? '' : k === 'tourism' && v === 'hotel' ? '' : k === 'highway' && v === 'bus_stop' ? '' : k === 'ele' ? `${v}m` : (k === 'website' || k === 'url' || (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://')))) ? (
                                  <a 
                                    href={v.startsWith('http') ? v : `https://${v}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                                  >
                                    {v}
                                  </a>
                                ) : k.endsWith(':wikidata') && typeof v === 'string' && v.startsWith('Q') ? (
                                  <a 
                                    href={`https://www.wikidata.org/wiki/${v}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                                  >
                                    {`wikidata.org/wiki/${v}`}
                                  </a>
                                ) : v
                              }
                            </>
                          )}
                        </div>
                      ))}
                    </>
                  );
                } else {
                  // Fall back to original format if incomplete address
                  const addressTags = addressOrder
                    .map(addrKey => tags.find(([k]) => k === addrKey))
                    .filter((tag): tag is [string, string] => tag !== undefined);
                  
                  const otherTags = tags.filter(([k]) => !k.startsWith('addr:') && !k.startsWith('contact:') && !k.startsWith('ref:') && k !== 'name' && k !== 'wheelchair' && k !== 'direction' && k !== 'source' && k !== 'panoramax');
                  
                  // Check if we have both street and housenumber to combine them
                  const streetTag = addressTags.find(([k]) => k === 'addr:street');
                  const houseNumberTag = addressTags.find(([k]) => k === 'addr:housenumber');
                  
                  // Check for contact address components
                  const contactStreetTag = tags.find(([k]) => k === 'contact:street');
                  const contactHouseNumberTag = tags.find(([k]) => k === 'contact:housenumber');
                  const contactCityTag = tags.find(([k]) => k === 'contact:city');
                  const contactPostcodeTag = tags.find(([k]) => k === 'contact:postcode');
                  
                  let processedAddressTags = addressTags;
                  let combinedStreetAddress = null;
                  let combinedContactAddress = null;
                  
                  // Combine contact address if we have components AND we don't have any other address display
                  const hasCompleteAddr = p.tags['addr:postcode'] && p.tags['addr:city'] && p.tags['addr:street'] && p.tags['addr:housenumber'];
                  const willHaveCombinedStreet = (streetTag && houseNumberTag) || (streetTag || houseNumberTag || addressTags.length > 0);
                  if (!hasCompleteAddr && !willHaveCombinedStreet && (contactStreetTag || contactHouseNumberTag || contactCityTag || contactPostcodeTag)) {
                    const addressParts: string[] = [];
                    
                    // Add housenumber and street
                    if (contactHouseNumberTag && contactStreetTag) {
                      addressParts.push(`${contactStreetTag[1]} ${contactHouseNumberTag[1]}`);
                    } else if (contactStreetTag) {
                      addressParts.push(contactStreetTag[1]);
                    } else if (contactHouseNumberTag) {
                      addressParts.push(contactHouseNumberTag[1]);
                    }
                    
                    // Add city and postcode
                    if (contactCityTag && contactPostcodeTag) {
                      addressParts.push(`${contactPostcodeTag[1]} ${contactCityTag[1]}`);
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
                    const cityTag = addressTags.find(([k]) => k === 'addr:city');
                    const postcodeTag = addressTags.find(([k]) => k === 'addr:postcode');
                    
                    // Create combined address if we have multiple addr components
                    if ((streetTag || houseNumberTag || cityTag || postcodeTag) && 
                        (streetTag && (houseNumberTag || cityTag || postcodeTag)) || 
                        (cityTag && postcodeTag)) {
                      
                      const addressParts: string[] = [];
                      
                      // Add housenumber and street
                      if (houseNumberTag && streetTag) {
                        addressParts.push(`${streetTag[1]} ${houseNumberTag[1]}`);
                      } else if (streetTag) {
                        addressParts.push(streetTag[1]);
                      } else if (houseNumberTag) {
                        addressParts.push(houseNumberTag[1]);
                      }
                      
                      // Add city and postcode
                      if (cityTag && postcodeTag) {
                        addressParts.push(`${postcodeTag[1]} ${cityTag[1]}`);
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
                      processedAddressTags = addressTags.filter(([k]) => k !== 'addr:street' && k !== 'addr:housenumber');
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
                              {`wikidata.org/wiki/${v}`}
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
                              {k === 'tourism' && v === 'viewpoint' ? 'viewpoint' : k === 'tourism' && v === 'hotel' ? 'hotel' : k === 'highway' && v === 'bus_stop' ? 'bus stop' : k === 'alt_name' ? 'aka:' : k === 'ele' ? 'altitude:' : k === 'air_conditioning' ? 'air condition:' : k.endsWith(':wikidata') ? `${k.replace(':wikidata', '')}:` : k === 'check_date' ? 'last checked:' : k.startsWith('check_date:') ? `last checked ${k.substring(11)}:` : `${k}:`} {
                                k === 'tourism' && v === 'viewpoint' ? '' : k === 'tourism' && v === 'hotel' ? '' : k === 'highway' && v === 'bus_stop' ? '' : (k === 'website' || k === 'url' || (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://')))) ? (
                                  <a 
                                    href={v.startsWith('http') ? v : `https://${v}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                                  >
                                    {v}
                                  </a>
                                ) : k.endsWith(':wikidata') && typeof v === 'string' && v.startsWith('Q') ? (
                                  <a 
                                    href={`https://www.wikidata.org/wiki/${v}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                                  >
                                    {`wikidata.org/wiki/${v}`}
                                  </a>
                                ) : k === 'ele' ? `${v}m` : v
                              }
                            </>
                          )}
                        </div>
                      ))}
                    </>
                  );
                }
              })()}
            </div>
            <div style={{ 
              fontSize: 12, 
              color: '#16a34a', 
              fontWeight: 500,
              background: '#f0fdf4',
              padding: '2px 6px',
              borderRadius: 4,
              display: 'inline-block'
            }}>
              Distance: {Math.round(p.distance_m)} m
            </div>
          </li>
        ))}
      </ul>
        </>
      )}
    </div>
  );
}