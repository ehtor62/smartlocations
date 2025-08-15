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
}

export default function AddressSearchModal({ 
  visible, 
  onClose, 
  onAddressSelect, 
  loading = false 
}: AddressSearchModalProps) {
  const [addressInput, setAddressInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      // Using Nominatim API for address search
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
        {
          headers: {
            'User-Agent': 'SmartLocations/1.0'
          }
        }
      );
      const data = await response.json();
      setAddressSuggestions(data);
    } catch (error) {
      console.error('Address search failed:', error);
      setAddressSuggestions([]);
    }
  };

  const handleAddressInput = (value: string) => {
    setAddressInput(value);
    searchAddresses(value);
  };

  const selectAddress = (suggestion: AddressSuggestion) => {
    onAddressSelect(suggestion);
    // Reset form
    setAddressInput('');
    setAddressSuggestions([]);
  };

  const handleClose = () => {
    setAddressInput('');
    setAddressSuggestions([]);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-xl w-80 max-w-xs mx-auto max-h-[90vh] overflow-y-auto" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
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
          <input
            type="text"
            value={addressInput}
            onChange={(e) => handleAddressInput(e.target.value)}
            placeholder="Type an address, city, or place name..."
            className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base sm:text-lg"
            autoFocus
          />
        </div>

        {/* Address Suggestions */}
        {addressSuggestions.length > 0 && (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
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
