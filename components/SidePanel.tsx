'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useFirebaseUser } from './LoginModalOnLoadWrapper';
import { authenticatedFetch } from '../utils/client-auth';

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
  const [geminiMinimized, setGeminiMinimized] = useState(false);
  
  // Track which place cards are expanded
  const [expandedPlaces, setExpandedPlaces] = useState<Set<string>>(new Set());
  
  const togglePlaceExpansion = (placeKey: string) => {
    setExpandedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeKey)) {
        newSet.delete(placeKey);
      } else {
        newSet.add(placeKey);
      }
      return newSet;
    });
  };

  // Swipe gesture handling for the border handle
  const touchStartX = React.useRef<number>(0);
  const touchStartY = React.useRef<number>(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    // Check if horizontal swipe is dominant and is swiping right
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
      onMinimize();
    }
  };

  // Define tag filtering configuration
  const tagConfig = {
    // Tags to completely exclude from display
    excludedTags: new Set([
      'name', // Already shown as title
      'wheelchair',
      'direction',
      'source',
      'panoramax',
      'ref',
      'operator:type',
      'brand:wikidata',
      'operator:wikidata',
      'building',
      'building:levels',
      'building:colour',
      'roof:shape',
      'roof:material',
      'created_by',
      'survey:date'
    ]),

    // Tag prefixes to exclude
    excludedPrefixes: [
      'addr:', // Address tags (handled separately)
      'contact:', // Contact tags (handled separately)
      'name:', // Name variations in other languages
      'old_name:',
      'short_name:',
      'alt_name:',
      'loc_name:',
      'reg_name:',
      'official_name:',
      'int_name:',
      'nat_name:',
      'sorting_name:',
      'construction:', // Construction-related tags
      'demolished:',
      'disused:',
      'abandoned:',
      'proposed:',
      'planned:',
      'layer:', // Layer-related tags
      'fixme:',
      'note:',
      'todo:',
      'FIXME:',
      'NOTE:',
      'TODO:',
      'source:',
      'ref:',
      'check_date:',
      'survey:',
      'import:',
      'tiger:',
      'gnis:',
      'nhd:',
      'massgis:',
      'mvdgis:',
      'lacounty:'
    ],

    // Special formatting rules for specific tags
    specialFormatting: {
      'tourism:viewpoint': () => ({ label: '', value: 'viewpoint' }),
      'tourism:hotel': () => ({ label: '', value: 'Hotel' }),
      'tourism:museum': () => ({ label: '', value: 'Museum' }),
      'highway:bus_stop': () => ({ label: '', value: 'Bus stop' }),
      'amenity:car_rental': () => ({ label: '', value: 'Car Rental' }),
      'amenity:restaurant': () => ({ label: '', value: 'Restaurant' }),
      'alt_name': () => ({ label: 'aka:', value: null }),
      'ele': (v: string) => ({ label: 'altitude:', value: `${v}m` }),
      'air_conditioning': () => ({ label: 'air condition:', value: null }),
      'check_date': () => ({ label: 'last checked:', value: null })
    } as Record<string, (value?: string) => { label: string; value: string | null }>
  };

  // Helper function to format museum subtypes
  const formatMuseumSubtype = (subtype: string): string => {
    // Capitalize first letter and add "Museum"
    return subtype.charAt(0).toUpperCase() + subtype.slice(1) + ' Museum';
  };

  // Calculate responsive width - ensure it never exceeds viewport
  const sidebarWidth = typeof window !== 'undefined' ? Math.min(360, window.innerWidth * 0.9, window.innerWidth - 40) : 360;

  // Helper function to check if a tag should be excluded
  const shouldExcludeTag = (key: string): boolean => {
    // Check if tag is in excluded list
    if (tagConfig.excludedTags.has(key)) return true;

    // Check if tag starts with any excluded prefix
    if (tagConfig.excludedPrefixes.some(prefix => key.startsWith(prefix))) return true;

    // Check for name: followed by two letters and colon (e.g., name:en:, name:fr:, name:de:)
    if (/^name:[a-z]{2}:/.test(key)) return true;

    return false;
  };

  // Helper function to format a tag according to rules
  const formatTag = (key: string, value: string): React.JSX.Element | null => {
    // Check for museum subtypes (e.g., museum:art -> Art Museum)
    if (key === 'museum') {
      return <span>{formatMuseumSubtype(value)}</span>;
    }

    // Check for special formatting rules
    const specialKey = `${key}:${value}`;
    const specialRule = tagConfig.specialFormatting[specialKey] || tagConfig.specialFormatting[key];

    if (specialRule) {
      const result = specialRule(value);
      if (result.label === '' && result.value) {
        // Special case like "viewpoint", "hotel" - just show the value
        return <span>{result.value}</span>;
      } else {
        // Normal case with label and value
        const displayValue = result.value || value;
        return (
          <>
            {result.label} {renderValueWithLinks(key, displayValue)}
          </>
        );
      }
    }

    // Handle wikidata links
    if (key.endsWith(':wikidata') && typeof value === 'string' && value.startsWith('Q')) {
      return (
        <>
          {`${key.replace(':wikidata', '')}:`} {' '}
          <a
            href={`https://www.wikidata.org/wiki/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#3b82f6', textDecoration: 'underline' }}
          >
            {`wikidata.org/wiki/${value}`}
          </a>
        </>
      );
    }

    // Handle check_date variations
    if (key.startsWith('check_date:')) {
      return (
        <>
          {`last checked ${key.substring(11)}:`} {value}
        </>
      );
    }

    // Handle special link cases
    if (key === 'wikidata' && typeof value === 'string') {
      return (
        <a
          href={`https://www.wikidata.org/wiki/${value}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'underline' }}
        >
          {`wikidata.org/wiki/${value}`}
        </a>
      );
    }

    if (key === 'wikipedia' && typeof value === 'string' && value.startsWith('de:')) {
      return (
        <a
          href={`https://de.wikipedia.org/wiki/${value.substring(3).replace(/ /g, '_')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'underline' }}
        >
          {`https://de.wikipedia.org/wiki/${value.substring(3).replace(/ /g, '_')}`}
        </a>
      );
    }

    // Default formatting
    return (
      <>
        {`${key}:`} {renderValueWithLinks(key, value)}
      </>
    );
  };

  // Helper function to render values with proper link handling
  const renderValueWithLinks = (key: string, value: string): React.JSX.Element | string => {
    // Handle URL cases
    if (key === 'website' || key === 'url' || (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')))) {
      return (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#3b82f6', textDecoration: 'underline' }}
        >
          {value}
        </a>
      );
    }

    return value;
  };

  // Function to convert URLs in text to clickable links
  const renderTextWithLinks = (text: string) => {
    if (!text) return null;

    // Process the text line by line
    const lines = text.split('\n');
    const processedLines = lines.map((line, lineIndex) => {
      // Handle headings
      if (line.startsWith('####')) {
        const headingText = line.replace(/^####\s*/, '');
        return (
          <h4 key={lineIndex} style={{
            fontSize: '16px',
            fontWeight: 'bold',
            margin: '16px 0 8px 0',
            color: '#1f2937'
          }}>
            {processInlineText(headingText)}
          </h4>
        );
      }
      if (line.startsWith('###')) {
        const headingText = line.replace(/^###\s*/, '');
        return (
          <h3 key={lineIndex} style={{
            fontSize: '18px',
            fontWeight: 'bold',
            margin: '16px 0 8px 0',
            color: '#1f2937'
          }}>
            {processInlineText(headingText)}
          </h3>
        );
      }
      if (line.startsWith('##')) {
        const headingText = line.replace(/^##\s*/, '');
        return (
          <h2 key={lineIndex} style={{
            fontSize: '20px',
            fontWeight: 'bold',
            margin: '16px 0 8px 0',
            color: '#1f2937'
          }}>
            {processInlineText(headingText)}
          </h2>
        );
      }

      // Handle numbered lists
      if (line.match(/^\d+\.\s/)) {
        const listText = line.replace(/^\d+\.\s*/, '');
        const number = line.match(/^\d+/)?.[0];
        return (
          <div key={lineIndex} style={{
            marginLeft: '20px',
            marginBottom: '6px',
            display: 'flex'
          }}>
            <span style={{ fontWeight: 'bold', marginRight: '8px', minWidth: '20px' }}>
              {number}.
            </span>
            <span>{processInlineText(listText)}</span>
          </div>
        );
      }

      // Handle bullet points
      if (line.match(/^\s*\*\s/)) {
        const listText = line.replace(/^\s*\*\s*/, '');
        const indentLevel = Math.floor((line.match(/^\s*/)?.[0].length || 0) / 4);
        return (
          <div key={lineIndex} style={{
            marginLeft: `${20 + indentLevel * 20}px`,
            marginBottom: '6px',
            display: 'flex'
          }}>
            <span style={{ marginRight: '8px', color: '#6b7280' }}>•</span>
            <span>{processInlineText(listText)}</span>
          </div>
        );
      }

      // Handle regular paragraphs
      if (line.trim()) {
        return (
          <div key={lineIndex} style={{ marginBottom: '8px' }}>
            {processInlineText(line)}
          </div>
        );
      }

      // Empty line
      return <div key={lineIndex} style={{ height: '8px' }} />;
    });

    return <div>{processedLines}</div>;
  };

  // Function to process inline formatting (bold, links)
  const processInlineText = (text: string) => {
    // Split by bold markers first
    const boldPattern = /(\*\*.*?\*\*)/g;
    const parts = text.split(boldPattern);

    return parts.map((part, index) => {
      // If this part is bold (starts and ends with **)
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2); // Remove ** from both ends
        return (
          <strong key={`bold-${index}`} style={{ fontWeight: 'bold' }}>
            {processLinks(boldText)}
          </strong>
        );
      }

      // Process links in non-bold parts
      return <span key={`text-${index}`}>{processLinks(part)}</span>;
    });
  };

  // Function to process links
  const processLinks = (text: string) => {
    // First, handle markdown-style links [text](url) and convert to just the URL
    const processedText = text.replace(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, '$2');

    // Then handle standalone URLs, being more precise about URL boundaries
    const urlRegex = /(https?:\/\/[^\s<>\"'`,;{}|\^\[\]\\]+[^\s<>\"'`,;{}|\^\[\]\\.,!?*"';:)])/g;
    const parts = processedText.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={`url-${index}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3b82f6',
              textDecoration: 'underline',
              cursor: 'pointer',
              marginRight: '4px'
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Function to extract city, state, country from location string
  const extractLocationContext = (location: string) => {
    if (!location || location === 'Current Location') return '';

    // Split by comma and take the last 2-3 parts (usually city, state/region, country)
    const parts = location.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      // Take last 2-3 parts, skip street addresses (first parts usually contain numbers/street names)
      const relevantParts = parts.slice(-3).filter(part =>
        // Filter out parts that look like street addresses (contain numbers at start)
        !/^\d/.test(part) && part.length > 1
      );
      return relevantParts.join(', ');
    }
    return location;
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
      paddingLeft: minimized ? 0 : 60,
      overflowY: minimized ? 'hidden' : 'auto',
      borderLeft: minimized ? 'none' : '2px solid #3b82f6',
      overflowX: 'hidden'
    }}>
      {/* Clickable Border Handle */}
      {!minimized && open && (
        <div
          onClick={onMinimize}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'fixed',
            left: `calc(100vw - ${sidebarWidth}px)`,
            top: 0,
            height: '100vh',
            width: '30px',
            background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.3))',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1002,
            borderTopLeftRadius: '8px',
            borderBottomLeftRadius: '8px',
            transition: 'background 200ms ease, width 200ms ease',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.4))';
            e.currentTarget.style.width = '35px';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.3))';
            e.currentTarget.style.width = '30px';
          }}
          title="Click or swipe to hide panel"
        >
          <div style={{
            fontSize: '20px',
            color: '#3b82f6',
            fontWeight: 'bold',
            transform: 'rotate(0deg)',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            «
          </div>
        </div>
      )}
      
      {!minimized && (
        <>
          {/* Gemini AI Panel */}
          {geminiPanelVisible && !geminiMinimized && (
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setGeminiMinimized(true)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    − Minimize
                  </button>
                  <button
                    onClick={() => setGeminiPanelVisible(false)}
                    style={{
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {geminiLoading ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                  <div>🤖 AI is thinking...</div>
                </div>
              ) : (
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  color: '#1f2937',
                  fontSize: 15,
                  padding: '16px 20px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  margin: '0 -4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
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
              {/* Minimized Gemini AI button */}
              {geminiPanelVisible && geminiMinimized && (
                <button
                  onClick={() => setGeminiMinimized(false)}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    padding: sidebarWidth < 300 ? '4px 8px' : '6px 12px',
                    cursor: 'pointer',
                    fontSize: sidebarWidth < 300 ? 10 : 12,
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
                  }}
                  title="Restore AI Information panel"
                >
                  ✨ AI Info
                </button>
              )}
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
                onClick={() => {
                  setGeminiPanelVisible(false);
                  setGeminiMinimized(false);
                  onClose();
                }}
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
                ✕
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
            {places.map((p, index) => {
              const placeKey = `${p.type}-${p.id}`;
              const isExpanded = expandedPlaces.has(placeKey);
              
              // Check if there are additional details to show
              const priorityTags = new Set(['name', 'tourism', 'amenity', 'leisure', 'shop', 'craft', 
                'cuisine', 'opening_hours', 'phone', 'website', 'addr:postcode', 'addr:city', 
                'addr:street', 'addr:housenumber']);
              
              const hasAdditionalDetails = p.tags && Object.entries(p.tags).some(([k]) => 
                !priorityTags.has(k) && !shouldExcludeTag(k)
              );
              
              return (
              <li key={placeKey} style={{
                padding: 12,
                borderBottom: '1px solid #e5e7eb',
                background: index % 2 === 0 ? '#f9fafb' : 'white',
                marginBottom: 4,
                borderRadius: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}>
                {/* Header Section - Always Visible */}
                <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>
                  <span style={{ marginRight: 8, color: '#3b82f6' }}>{index + 1}.</span>
                  {p.isNewlyAdded && (
                    <span style={{
                      marginRight: 8,
                      background: '#10b981',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      NEW
                    </span>
                  )}
                  {p.tags?.name || (p.tags?.amenity || p.tags?.tourism || p.tags?.leisure) || 'Unnamed Place'}
                  <span
                    onClick={async () => {
                      setGeminiLoading(true);
                      setGeminiPanelVisible(true);

                      try {
                        // Collect place information excluding distance
                        const title = p.tags?.name || (p.tags?.amenity || p.tags?.tourism || p.tags?.leisure) || 'Unnamed Place';

                        // Extract location context (city, state, country only)
                        const locationContext = extractLocationContext(searchLocation || '');

                        const promptParts = [`Please provide interesting and helpful information about this place: ${title}${locationContext ? ` in ${locationContext}` : ''}`];

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
                              promptParts.push('Type: Viewpoint');
                              return;
                            }
                            if (k === 'tourism' && v === 'hotel') {
                              promptParts.push('Type: Hotel');
                              return;
                            }
                            if (k === 'highway' && v === 'bus_stop') {
                              promptParts.push('Type: Bus stop');
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
                        const response = await authenticatedFetch('/api/gemini', {
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
                
                {/* Quick Info - Always Visible */}
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>
                  {(() => {
                    if (!p.tags) return '';

                    const tags = Object.entries(p.tags);
                    
                    // Get primary type/category
                    const primaryType = p.tags?.tourism || p.tags?.amenity || p.tags?.leisure || p.tags?.shop || p.tags?.craft;
                    
                    // Get address if available
                    const addressComponents = {
                      postcode: p.tags['addr:postcode'],
                      city: p.tags['addr:city'],
                      street: p.tags['addr:street'],
                      housenumber: p.tags['addr:housenumber']
                    };
                    
                    const hasCompleteAddress = Object.values(addressComponents).every(v => v && v.trim());
                    
                    return (
                      <div>
                        {primaryType && (
                          <div style={{ marginBottom: 4, fontSize: 14, color: '#3b82f6', fontWeight: 500 }}>
                            {primaryType.charAt(0).toUpperCase() + primaryType.slice(1).replace(/_/g, ' ')}
                          </div>
                        )}
                        {hasCompleteAddress && (
                          <div style={{ marginBottom: 4, fontWeight: 500, color: '#059669' }}>
                            📍 {addressComponents.street} {addressComponents.housenumber}, {addressComponents.postcode} {addressComponents.city}
                          </div>
                        )}
                        {/* Show 2-3 most important tags */}
                        {p.tags?.cuisine && (
                          <div style={{ marginBottom: 2 }}>🍴 {p.tags.cuisine}</div>
                        )}
                        {p.tags?.opening_hours && (
                          <div style={{ marginBottom: 2 }}>🕒 {p.tags.opening_hours}</div>
                        )}
                        {p.tags?.phone && (
                          <div style={{ marginBottom: 2 }}>📞 {p.tags.phone}</div>
                        )}
                        {p.tags?.website && !isExpanded && (
                          <div style={{ marginBottom: 2 }}>
                            🌐 <a
                              href={p.tags.website.startsWith('http') ? p.tags.website : `https://${p.tags.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#3b82f6', textDecoration: 'underline' }}
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                
                <div style={{
                  fontSize: 12,
                  color: '#16a34a',
                  fontWeight: 500,
                  background: '#f0fdf4',
                  padding: '2px 6px',
                  borderRadius: 4,
                  display: 'inline-block',
                  marginBottom: 8
                }}>
                  📏 {Math.round(p.distance_m)} m
                </div>
                
                {/* Expandable Details Section */}
                {isExpanded && (
                  <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid #e5e7eb',
                    fontSize: 13,
                    color: '#4b5563'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#1f2937' }}>
                      Additional Details
                    </div>
                    {(() => {
                      if (!p.tags) return null;

                      const tags = Object.entries(p.tags);
                      
                      // Priority tags already shown
                      const priorityTags = new Set(['name', 'tourism', 'amenity', 'leisure', 'shop', 'craft', 
                        'cuisine', 'opening_hours', 'phone', 'addr:postcode', 'addr:city', 
                        'addr:street', 'addr:housenumber']);
                      
                      // Get remaining tags, filtered
                      const detailedTags = tags.filter(([k]) => 
                        !priorityTags.has(k) && !shouldExcludeTag(k)
                      );
                      
                      if (detailedTags.length === 0) {
                        return <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No additional details available</div>;
                      }
                      
                      return detailedTags.map(([k, v]) => {
                        const formatted = formatTag(k, v);
                        if (!formatted) return null;

                        return (
                          <div key={k} style={{ marginBottom: 4, lineHeight: 1.5 }}>
                            {formatted}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
                
                {/* Toggle Button - Only show if there are additional details */}
                {hasAdditionalDetails && (
                  <button
                    onClick={() => togglePlaceExpansion(placeKey)}
                    style={{
                      marginTop: 8,
                      background: isExpanded ? '#f3f4f6' : '#3b82f6',
                      color: isExpanded ? '#374151' : 'white',
                      border: 'none',
                      borderRadius: 4,
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 500,
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                  >
                    {isExpanded ? '▲ Show Less' : '▼ Show More Details'}
                  </button>
                )}
              </li>
            )})}
          </ul>
        </>
      )}
    </div>
  );
}