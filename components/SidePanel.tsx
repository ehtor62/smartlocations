'use client';

import React from 'react';
import { SEARCH_RADIUS_KM } from '../utils/constants';

import type { Place } from '../app/page';

export default function SidePanel({ open, onClose, onMinimize, places, minimized }: { open: boolean, onClose: () => void, onMinimize: () => void, places: Place[], minimized: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      right: open ? 0 : -360,
      top: 0,
      height: '100vh',
      width: minimized ? 0 : 360,
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1f2937' }}>Found Places ({places.length})</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={onMinimize}
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
                onClick={onClose}
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
                ✕ Close
              </button>
            </div>
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