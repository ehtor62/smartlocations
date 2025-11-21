'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useFirebaseUser } from './LoginModalOnLoadWrapper';


import type { Place } from '../app/page';

export default function SidePanel({ open, onClose, onMinimize, places, minimized, onShowReport }: { 
  open: boolean, 
  onClose: () => void, 
  onMinimize: () => void, 
  places: Place[], 
  minimized: boolean,
  onShowReport?: (report: string) => void
}) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Calculate responsive width - ensure it never exceeds viewport
  const sidebarWidth = typeof window !== 'undefined' ? Math.min(360, window.innerWidth * 0.9, window.innerWidth - 40) : 360;

  const handleGenerateReport = async () => {
    console.log('handleGenerateReport called', { onShowReport, placesLength: places.length });
    if (!onShowReport || places.length === 0) {
      console.log('Early return:', { onShowReport: !!onShowReport, placesLength: places.length });
      return;
    }
    
    setIsGeneratingReport(true);
    try {
      console.log('Making API call with places:', places);
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ elements: places }),
      });

      console.log('API response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      console.log('API response data:', data);
      onShowReport(data.report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
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
          {/* User info section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {user.photoURL ? (
                  <Image src={user.photoURL} alt="User avatar" width={32} height={32} style={{ borderRadius: '50%' }} />
                ) : (
                  <span style={{ fontSize: 24, marginRight: 4 }}>👤</span>
                )}
                <span style={{ fontWeight: 500 }}>{user.displayName || user.email || 'User'}</span>
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
          
          <button 
            onClick={() => {
              console.log('Button clicked!');
              handleGenerateReport();
            }}
            disabled={isGeneratingReport || places.length === 0}
            style={{ 
              margin: '0 0 16px 0', 
              fontSize: sidebarWidth < 300 ? 16 : 18, 
              fontWeight: 600, 
              color: isGeneratingReport ? '#6b7280' : '#1f2937',
              background: isGeneratingReport ? '#e5e7eb' : '#f3f4f6',
              border: 'none',
              cursor: isGeneratingReport || places.length === 0 ? 'not-allowed' : 'pointer',
              padding: '8px 12px',
              textAlign: 'left',
              width: '100%',
              borderRadius: '6px'
            }}
          >
            {isGeneratingReport ? 'Generating Report...' : `Found Places (${places.length}). Get more info`}
          </button>

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
                  const otherTags = tags.filter(([k]) => !k.startsWith('addr:') && k !== 'name' && k !== 'wheelchair').slice(0, 4); // Limit to 4 since we have address
                  
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
                              {`www.wikidata.org/wiki/${v}`}
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
                } else {
                  // Fall back to original format if incomplete address
                  const addressTags = addressOrder
                    .map(addrKey => tags.find(([k]) => k === addrKey))
                    .filter((tag): tag is [string, string] => tag !== undefined);
                  
                  const otherTags = tags.filter(([k]) => !k.startsWith('addr:') && !k.startsWith('contact:') && k !== 'name' && k !== 'wheelchair');
                  
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
                  } else if (streetTag && houseNumberTag) {
                    // Only create combined street address if we don't have contact address
                    combinedStreetAddress = {
                      key: 'combined_street',
                      value: `${streetTag[1]} ${houseNumberTag[1]}`
                    };
                    processedAddressTags = addressTags.filter(([k]) => k !== 'addr:street' && k !== 'addr:housenumber');
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
                          ) : k === 'wikipedia' && typeof v === 'string' && v.startsWith('de:') ? (
                            <a 
                              href={`https://de.wikipedia.org/wiki/${v.substring(3).replace(/ /g, '_')}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#3b82f6', textDecoration: 'underline' }}
                            >
                              {`https://de.wikipedia.org/wiki/${v.substring(3).replace(/ /g, '_')}`}
                            </a>
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