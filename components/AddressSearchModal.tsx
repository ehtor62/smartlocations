'use client';

import React, { useState } from 'react';

// Address suggestion interface for Nominatim API
export interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
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
}

export default function AddressSearchModal({ 
  visible, 
  onClose, 
  onAddressSelect, 
  loading = false,
  keepLocation,
  setKeepLocation,
  keptAddress,
  setKeptAddress
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
      const response = await fetch(
        `/api/address-search?q=${encodeURIComponent(query)}`,
        { signal: abortControllerRef.current.signal }
      );
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`); 
      }
      
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

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      searchAddresses(query);
    }, 200); // 200ms debounce for more responsive feel
  }, []);  const handleAddressInput = (value: string) => {
    setAddressInputState(value);
    if (keepLocation) setKeptAddress(value);
    
    // Show immediate feedback for typing
    if (value.length >= 3) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
      setAddressSuggestions([]);
    }
    
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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      <div 
        className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-xl w-80 max-w-xs mx-auto max-h-[90vh] overflow-y-auto" 
        style={{ 
          maxWidth: 'calc(100vw - 2rem)', 
          maxHeight: 'calc(100vh - 2rem)',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg sm:text-2xl">Search by Address</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-lg sm:text-xl font-bold p-1"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => handleAddressInput(e.target.value)}
              placeholder="Type an address, city, or place name..."
              className={`w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg ${isSearching ? 'pr-12' : ''}`}
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          
          {isSearching && (
            <div className="text-sm text-blue-600 mb-3 flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-md mt-2">
              <div className="animate-pulse h-2 w-2 bg-blue-600 rounded-full"></div>
              Searching for addresses...
            </div>
          )}
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

        {addressInput.length >= 3 && addressSuggestions.length === 0 && !isSearching && (
          <div className="text-center text-gray-500 py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-lg">🔍</div>
            <div className="mt-1">No addresses found</div>
            <div className="text-sm mt-1">Try a different search term or check spelling</div>
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
