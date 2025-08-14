'use client';

import React, { useState } from 'react';
import { SEARCH_RADIUS_KM } from '../utils/constants';

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
  
  return (
    <div style={{
      position: 'absolute',
      right: open ? 0 : -sidebarWidth,
      top: 0,
      height: '100vh',
      width: minimized ? 0 : sidebarWidth,
      maxWidth: '100vw',
      background: 'white',
      boxShadow: minimized ? 'none' : '-4px 0 12px rgba(0,0,0,0.2)',
      transition: 'width 300ms ease-in-out, box-shadow 300ms ease-in-out',
      zIndex: 1001,
      padding: minimized ? 0 : 16,
      overflowY: minimized ? 'hidden' : 'auto',
      borderLeft: minimized ? 'none' : '2px solid #3b82f6',
      overflowX: 'hidden'
    }}>
      {!minimized && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 8 }}>
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
                − Minimize
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
          No places found {SEARCH_RADIUS_KM}km around the red marker. Try a different location!
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
                
                // Sort tags: address tags in specified order first, then other tags
                const addressTags = addressOrder
                  .map(addrKey => tags.find(([k]) => k === addrKey))
                  .filter((tag): tag is [string, string] => tag !== undefined);
                
                const otherTags = tags.filter(([k]) => !k.startsWith('addr:'));
                
                const sortedTags = [...addressTags, ...otherTags].slice(0, 5);
                
                return sortedTags.map(([k, v]) => (
                  <div key={k} style={{ marginBottom: 2 }}>
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