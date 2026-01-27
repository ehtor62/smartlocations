'use client';

import React, { useState } from 'react';
import { authenticatedFetch } from '../utils/client-auth';

// Address suggestion interface for Nominatim API
export interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class?: string;
  osm_type?: string;
  boundingbox?: string[];
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

// Helper function to determine if a location is a broad area
export function isBroadArea(suggestion: AddressSuggestion): boolean {
  const { type, class: osmClass, osm_type, address, boundingbox } = suggestion;
  
  // Countries and states are definitely broad areas
  if (type === 'country' || osmClass === 'boundary' && type === 'administrative') {
    return true;
  }
  
  // Check if it's a state/region level administrative area
  if (address) {
    // If it has a state but no city/town/village, it's likely the state itself
    const hasSettlement = address.city || address.town || address.village;
    if (address.state && !hasSettlement) {
      return true;
    }
    // If it's just the country
    if (address.country && !address.state && !hasSettlement) {
      return true;
    }
  }
  
  // Calculate area size from bounding box (rough estimate)
  if (boundingbox && boundingbox.length === 4) {
    const latDiff = Math.abs(parseFloat(boundingbox[1]) - parseFloat(boundingbox[0]));
    const lonDiff = Math.abs(parseFloat(boundingbox[3]) - parseFloat(boundingbox[2]));
    // If area is larger than ~0.5 degrees (roughly 55km), consider it broad
    if (latDiff > 0.5 || lonDiff > 0.5) {
      return true;
    }
  }
  
  return false;
}

interface AddressSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressSelect: (suggestion: AddressSuggestion) => void;
  loading?: boolean;
  keepLocation: boolean;
  setKeepLocation: (checked: boolean) => void;
  keptAddress: string;
  setKeptAddress: (value: string) => void;
  mapClickMode: boolean;
  setMapClickMode: (enabled: boolean) => void;
}

export default function AddressSearchModal({ 
  visible, 
  onClose, 
  onAddressSelect, 
  loading = false,
  keepLocation,
  setKeepLocation,
  keptAddress,
  setKeptAddress,
  mapClickMode,
  setMapClickMode
}: AddressSearchModalProps) {
  const [addressInput, setAddressInputState] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync addressInput with keptAddress if keepLocation is active
  React.useEffect(() => {
    if (keepLocation) {
      setAddressInputState(keptAddress);
    } else {
      setAddressInputState('');
    }
  }, [keepLocation, keptAddress, visible]);
  
  // When returning from map-click mode, populate with the selected address only if keepLocation is active
  React.useEffect(() => {
    if (!mapClickMode && keptAddress && visible && keepLocation) {
      setAddressInputState(keptAddress);
    }
  }, [mapClickMode, keptAddress, visible, keepLocation]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setIsSearching(false);
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    setIsSearching(true);

    try {
      // Using our API route to proxy Nominatim requests
      const response = await authenticatedFetch(
        `/api/address-search?q=${encodeURIComponent(query)}`,
        { signal: abortControllerRef.current.signal }
      );
      
      const data = await response.json();
      setAddressSuggestions(data);
    } catch (error) {
      // Don't log aborted requests as errors
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Address search failed:', error);
        setAddressSuggestions([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = React.useCallback((query: string) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Show searching indicator immediately if query is long enough
    if (query.length >= 3) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 300); // 300ms debounce
  }, []);  const handleAddressInput = (value: string) => {
    setAddressInputState(value);
    if (keepLocation) setKeptAddress(value);
    debouncedSearch(value);
  };

  const selectAddress = (suggestion: AddressSuggestion) => {
    onAddressSelect(suggestion);
    // Only reset form if keepLocation is not checked
    if (!keepLocation) {
      setAddressInputState('');
      setAddressSuggestions([]);
      setKeptAddress('');
    } else {
      setAddressInputState(suggestion.display_name);
      setKeptAddress(suggestion.display_name);
      setAddressSuggestions([]);
    }
  };

  const handleClose = () => {
    setAddressInputState('');
    setAddressSuggestions([]);
    setKeptAddress('');
    onClose();
  };

  if (!visible) return null;

  // When in map-click mode, return null to hide everything
  if (mapClickMode) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-pulse" 
        style={{ 
          animation: 'gradient 8s ease infinite',
          backgroundSize: '400% 400%',
        }}
      />
      
      {/* Main modal with glassmorphism */}
      <div 
        className="relative bg-white/70 backdrop-blur-xl p-3 sm:p-4 rounded-3xl shadow-2xl w-80 max-w-xs mx-auto max-h-[90vh] overflow-y-auto border border-white/50" 
        style={{ 
          maxWidth: 'calc(100vw - 2rem)', 
          maxHeight: 'calc(100vh - 2rem)',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          animation: 'float 6s ease-in-out infinite',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), 0 0 80px rgba(59, 130, 246, 0.2)',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg sm:text-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent" style={{ 
            animation: 'shimmer 3s ease-in-out infinite',
            backgroundSize: '200% auto',
          }}>Search by Address</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-lg sm:text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={addressInput}
            onChange={(e) => handleAddressInput(e.target.value)}
            placeholder="Type an address, city, or place name..."
            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
            autoFocus
          />
          {isSearching && (
            <div className="text-sm text-blue-600 mt-1 flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              Searching...
            </div>
          )}
          
          {/* Map click mode button */}
          <div className="mt-3 mb-2">
            <button
              onClick={() => setMapClickMode(true)}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:shadow-lg hover:scale-105 font-medium text-sm flex items-center justify-center gap-2 shadow-md"
              style={{ backdropFilter: 'blur(8px)' }}
            >
              <span className="text-xl">📍</span>
              <span>Or Click on Map to Select Location</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <label htmlFor="keep-location-constant-checkbox" className="text-xs font-medium text-gray-700">Keep the location constant</label>
            <input
              id="keep-location-constant-checkbox"
              type="checkbox"
              className="w-4 h-4"
              checked={keepLocation}
              onChange={e => setKeepLocation(e.target.checked)}
              style={{ verticalAlign: 'middle', accentColor: '#16A34A' }}
            />
          </div>
        </div>

        {/* Address Suggestions */}
        {addressSuggestions.length > 0 && (
          <div 
            className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}
          >
            {addressSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                onClick={() => selectAddress(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                  index !== addressSuggestions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                disabled={loading}
              >
                <div className="font-medium text-gray-900">{suggestion.display_name}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {suggestion.type} • {parseFloat(suggestion.lat).toFixed(4)}, {parseFloat(suggestion.lon).toFixed(4)}
                </div>
              </button>
            ))}
          </div>
        )}

        {addressInput.length >= 3 && addressSuggestions.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No addresses found. Try a different search term.
          </div>
        )}

        {addressInput.length > 0 && addressInput.length < 3 && (
          <div className="text-center text-gray-500 py-4">
            Type at least 3 characters to search for addresses.
          </div>
        )}

        {loading && (
          <div className="text-center text-blue-600 py-4">
            Searching for attractions near selected address...
          </div>
        )}
      </div>
    </div>
  );
}
