'use client';

import React, { useState } from 'react';


import dynamic from 'next/dynamic';
const MapClient = dynamic(() => import('../components/MapClient'), { ssr: false });
import SidePanel from '../components/SidePanel';
import { tagGroups } from '../utils/allowedtags';

// Place type matches the structure returned from the API
export interface Place {
  id: number;
  type: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  distance_m: number;
}

// Address suggestion interface for Nominatim API
interface AddressSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
}

export default function Page() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [center, setCenter] = useState<{ lat: number; lon: number }>({ lat: 47.3769, lon: 8.5417 }); // Zurich
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [searchMode, setSearchMode] = useState<'current' | 'address'>('current');
  const [categoryDetailsVisible, setCategoryDetailsVisible] = useState(false);
  const [selectedCategoryForDetails, setSelectedCategoryForDetails] = useState<string>('');
  const [selectedTagsInCategory, setSelectedTagsInCategory] = useState<Record<string, string[]>>({});
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [numberOfPlaces, setNumberOfPlaces] = useState(20);
  const [secondSliderValue, setSecondSliderValue] = useState(5);
  const [isSearching, setIsSearching] = useState(false); // Prevent multiple simultaneous searches
  const [reportVisible, setReportVisible] = useState(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [reportMinimized, setReportMinimized] = useState(false);

  const showReport = (report: string) => {
    console.log('showReport called with:', report);
    setReportContent(report);
    setReportVisible(true);
    setReportMinimized(false);
    console.log('Report state set to visible');
  };

  const hideReport = () => {
    setReportVisible(false);
    setReportContent('');
    setReportMinimized(false);
  };

  const minimizeReport = () => {
    setReportMinimized(true);
  };

  const maximizeReport = () => {
    setReportMinimized(false);
  };

  const resetAppToInitialState = () => {
    setPlaces([]);
    setCenter({ lat: 47.3769, lon: 8.5417 }); // Reset to Zurich
    setPanelOpen(false);
    setSidebarMinimized(false);
    setLoading(false);
    setIsSearching(false); // Reset search state
    setHasSearched(false);
    setModalVisible(true);
    setCategoryModalVisible(false);
    setSelectedCategories([]);
    setAddressModalVisible(false);
    setAddressInput('');
    setAddressSuggestions([]);
    setSearchMode('current');
    setCategoryDetailsVisible(false);
    setSelectedCategoryForDetails('');
    setSelectedTagsInCategory({});
    setReportVisible(false);
    setReportContent('');
    setReportMinimized(false);
  };

  const minimizeSidePanel = () => {
    setSidebarMinimized(true);
  };

  const reopenSidePanel = () => {
    setSidebarMinimized(false);
  };

  const handleButton1 = async () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation not available');
      return;
    }
    
    if (isSearching) {
      alert('A search is already in progress. Please wait.');
      return;
    }
    
    setLoading(true);
    setIsSearching(true);
    setModalVisible(false); // Hide modal when Button 1 is clicked
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setCenter({ lat, lon });
      setHasSearched(true); // Mark that user has searched for their location

      // send to server
      try {
        // Use Nature and Culture tags from allowedtags.ts
        const tags = [
          ...tagGroups.Nature.map(tag => tag.replace(':', '=')),
          ...tagGroups.Entertainment.map(tag => tag.replace(':', '=')),
          ...tagGroups.Culture.map(tag => tag.replace(':', '='))
        ];

        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lon, tags, limit: numberOfPlaces }),
          signal: AbortSignal.timeout(60000) // 60 second timeout for frontend
        });
        const data = await res.json();
        setPlaces(data.places || []);
        setPanelOpen(true);
      } catch (err) {
        console.error(err);
        if (err instanceof Error && err.name === 'TimeoutError') {
          alert('Search timed out. The server might be busy. Please try again.');
        } else if (err instanceof Error && err.message.includes('timeout')) {
          alert('Search timed out. Please try again or search for fewer categories.');
        } else {
          alert('Search failed. Please try again.');
        }
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }, (err) => {
      setLoading(false);
      setIsSearching(false);
      alert('Geolocation permission denied or error: ' + err.message);
    }, { enableHighAccuracy: true });
  };

  const handleButton3 = () => {
    setModalVisible(false);
    setAddressInput('');
    setAddressSuggestions([]);
    setAddressModalVisible(true);
  };

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

  const selectAddress = async (suggestion: AddressSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    setCenter({ lat, lon });
    setHasSearched(true);
    setAddressModalVisible(false);
    
    // Open category modal and set to search at address location
    setSelectedCategories([]); // Reset category selections
    setSearchMode('address'); // Set to search at address location
    setCategoryModalVisible(true);
  };

  const showCategoryDetails = (categoryName: string) => {
    setSelectedCategoryForDetails(categoryName);
    // Initialize all tags as selected for this category if not already set
    if (!selectedTagsInCategory[categoryName]) {
      const allTags = tagGroups[categoryName as keyof typeof tagGroups] || [];
      setSelectedTagsInCategory(prev => ({
        ...prev,
        [categoryName]: [...allTags]
      }));
    }
    setCategoryDetailsVisible(true);
  };

  const toggleTagInCategory = (categoryName: string, tag: string) => {
    setSelectedTagsInCategory(prev => {
      const currentTags = prev[categoryName] || [];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter(t => t !== tag)
        : [...currentTags, tag];
      
      return {
        ...prev,
        [categoryName]: newTags
      };
    });
  };

  const deselectAllTagsInCategory = (categoryName: string) => {
    setSelectedTagsInCategory(prev => ({
      ...prev,
      [categoryName]: []
    }));
  };

  const closeCategoryDetailsAndActivate = () => {
    if (selectedCategoryForDetails) {
      // Add the category to selected categories if not already selected
      if (!selectedCategories.includes(selectedCategoryForDetails)) {
        setSelectedCategories(prev => [...prev, selectedCategoryForDetails]);
      }
    }
    setCategoryDetailsVisible(false);
    setSelectedCategoryForDetails('');
  };

  const handleButton2 = () => {
    setModalVisible(false);
    setSelectedCategories([]); // Reset selections when opening modal
    setSearchMode('current'); // Set to search at current location
    setCategoryModalVisible(true);
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(cat => cat !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleMultiCategorySearch = async () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }
    
    if (isSearching) {
      alert('A search is already in progress. Please wait.');
      return;
    }
    
    setLoading(true);
    setIsSearching(true);
    setCategoryModalVisible(false);

    if (searchMode === 'current') {
      // Search at current location - need to get geolocation
      if (!('geolocation' in navigator)) {
        alert('Geolocation not available');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCenter({ lat, lon });
        setHasSearched(true);

        try {
          // Get tags for all selected categories with performance optimization
          const allTags: string[] = [];
          selectedCategories.forEach(categoryName => {
            // Use selected tags for this category, or fall back to all tags if none selected
            const categoryTags = selectedTagsInCategory[categoryName] || tagGroups[categoryName as keyof typeof tagGroups];
            allTags.push(...categoryTags.map(tag => tag.replace(':', '=')));
          });

          // Limit to maximum 30 tags to prevent overly complex queries that slow down the API
          const limitedTags = allTags.slice(0, 30);
          if (allTags.length > 30) {
            console.log(`Limited search from ${allTags.length} to 30 tags for better performance`);
          }

          const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lon, tags: limitedTags, limit: numberOfPlaces }),
            signal: AbortSignal.timeout(60000) // 60 second timeout for frontend
          });
          const data = await res.json();
          setPlaces(data.places || []);
          setPanelOpen(true);
        } catch (err) {
          console.error(err);
          if (err instanceof Error && err.name === 'TimeoutError') {
            alert('Search timed out. The server might be busy. Please try again.');
          } else if (err instanceof Error && err.message.includes('timeout')) {
            alert('Search timed out. Please try again or search for fewer categories.');
          } else {
            alert('Search failed. Please try again.');
          }
        } finally {
          setLoading(false);
        }
      }, (err) => {
        setLoading(false);
        alert('Geolocation permission denied or error: ' + err.message);
      }, { enableHighAccuracy: true });
    } else {
      // Search at address location - use existing center coordinates
      try {
        const lat = center.lat;
        const lon = center.lon;

        // Get tags for all selected categories with performance optimization
        const allTags: string[] = [];
        selectedCategories.forEach(categoryName => {
          // Use selected tags for this category, or fall back to all tags if none selected
          const categoryTags = selectedTagsInCategory[categoryName] || tagGroups[categoryName as keyof typeof tagGroups];
          allTags.push(...categoryTags.map(tag => tag.replace(':', '=')));
        });

        // Limit to maximum 30 tags to prevent overly complex queries that slow down the API
        const limitedTags = allTags.slice(0, 30);
        if (allTags.length > 30) {
          console.log(`Limited search from ${allTags.length} to 30 tags for better performance`);
        }

        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lon, tags: limitedTags, limit: numberOfPlaces }),
          signal: AbortSignal.timeout(60000) // 60 second timeout for frontend
        });
        const data = await res.json();
        setPlaces(data.places || []);
        setPanelOpen(true);
      } catch (err) {
        console.error(err);
        if (err instanceof Error && err.name === 'TimeoutError') {
          alert('Search timed out. The server might be busy. Please try again.');
        } else if (err instanceof Error && err.message.includes('timeout')) {
          alert('Search timed out. Please try again or search for fewer categories.');
        } else {
          alert('Search failed. Please try again.');
        }
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden relative">
      <MapClient center={center} places={places} showCurrentLocation={hasSearched} />

      {/* modal */}
      {modalVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
          <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-xl w-80 max-w-xs mx-auto" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
            <h2 className="font-bold text-xl sm:text-2xl text-center mb-3 sm:mb-4">Do You Know what is Around You?</h2>
            <h1 className="font-bold text-2xl sm:text-4xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6">Discover & Explore</h1>
            <div className="mt-2 flex flex-col gap-2 sm:gap-3">
              <button onClick={handleButton1} className="px-3 py-2 sm:px-4 sm:py-3 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm sm:text-base">
                Near me: Find the best Attractions
              </button>
              <button onClick={handleButton2} className="px-3 py-2 sm:px-4 sm:py-3 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm sm:text-base">
                Near me: Find anything specific
              </button>
              <button onClick={handleButton3} className="px-3 py-2 sm:px-4 sm:py-3 rounded bg-green-600 text-white hover:bg-green-700 transition-colors text-sm sm:text-base">
                Anywhere: Find anything specific
              </button>
              
              {/* Number of places slider */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={numberOfPlaces}
                    onChange={(e) => setNumberOfPlaces(parseInt(e.target.value))}
                    className="w-full h-6 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgba(59, 130, 246, 0.7) 0%, rgba(59, 130, 246, 0.7) ${((numberOfPlaces - 1) / 39) * 100}%, #e5e7eb ${((numberOfPlaces - 1) / 39) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none w-full">
                    <span className="text-xs font-thin text-blue-900 ml-2 whitespace-nowrap">
                      Find {numberOfPlaces} Places
                    </span>
                  </div>
                </div>
                {/* Second slider */}
                <div className="relative mt-6">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={secondSliderValue}
                    onChange={(e) => setSecondSliderValue(parseInt(e.target.value))}
                    className="w-full h-6 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgba(59, 130, 246, 0.7) 0%, rgba(59, 130, 246, 0.7) ${((secondSliderValue - 1) / 9) * 100}%, #e5e7eb ${((secondSliderValue - 1) / 9) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none w-full">
                    <span className="text-xs font-thin text-blue-900 ml-2 whitespace-nowrap">
                      Search within {secondSliderValue} km
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {categoryModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
          <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-xl w-full max-w-sm sm:max-w-4xl max-h-[90vh] overflow-y-auto" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
            <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg sm:text-2xl">Choose Categories</h2>
            <button 
              onClick={resetAppToInitialState}
              className="text-gray-500 hover:text-gray-700 text-lg sm:text-xl font-bold p-1"
            >
              ✕
            </button>
          </div>
          
          {/* Search Button */}
          <div className="mb-4 sm:mb-6 text-center">
            <button
              onClick={handleMultiCategorySearch}
              disabled={selectedCategories.length === 0 || loading}
              className={`px-4 py-2 sm:px-8 sm:py-3 rounded-lg font-bold text-sm sm:text-lg transition-all duration-200 ${
                selectedCategories.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-lg'
              }`}
            >
              {loading ? 'Searching...' : `Find ${selectedCategories.length} Categories`}
            </button>
            {selectedCategories.length > 0 && (
              <p className="text-xs sm:text-sm text-gray-600 mt-2">
                Selected: {selectedCategories.map(cat => cat.replace(/_/g, ' ')).join(', ')}
              </p>
            )}
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {Object.keys(tagGroups).map((category) => {
              const isSelected = selectedCategories.includes(category);
              const isDetailsOpen = selectedCategoryForDetails === category;
              const hasCustomTagSelection = selectedTagsInCategory[category] && 
                selectedTagsInCategory[category].length < tagGroups[category as keyof typeof tagGroups].length;
              const showOrangeBorder = isDetailsOpen || (hasCustomTagSelection && !isDetailsOpen);
              return (
                <div
                  key={category}
                  className={`flex rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } ${
                    showOrangeBorder 
                      ? 'ring-4 ring-orange-400 ring-opacity-70 shadow-lg' 
                      : ''
                  }`}
                >
                  {/* Left part - Toggle selection (2/3 width) */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex-grow px-1 py-2 sm:px-2 md:px-3 md:py-3 rounded-l-lg font-medium text-xs sm:text-sm transition-all duration-200"
                    disabled={loading}
                    style={{ width: '66.67%' }}
                  >
                    {category.replace(/_/g, ' ')}
                  </button>
                  
                  {/* Right part - Show details (1/3 width) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showCategoryDetails(category);
                    }}
                    className="px-1 py-2 md:px-2 md:py-3 rounded-r-lg text-xs sm:text-sm border-l border-white/20 bg-black/20 hover:bg-black/30 transition-all duration-200"
                    disabled={loading}
                    style={{ width: '33.33%' }}
                    title={`View ${category.replace(/_/g, ' ')} details`}
                  >
                    ℹ️
                  </button>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* Address Search Modal */}
      {addressModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
          <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-xl w-80 max-w-xs mx-auto max-h-[90vh] overflow-y-auto" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg sm:text-2xl">Search by Address</h2>
            <button 
              onClick={resetAppToInitialState}
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
      )}

      {/* Category Details Modal */}
      {categoryDetailsVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-[1002] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
          <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-xl w-80 max-w-xs mx-auto max-h-[90vh] overflow-y-auto" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg sm:text-xl">
              {selectedCategoryForDetails.replace(/_/g, ' ')} Details
            </h2>
            <div className="flex gap-2">
              
              <button 
                onClick={closeCategoryDetailsAndActivate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition-colors"
              >
                Select
              </button>
              <button 
                onClick={() => {
                  setCategoryDetailsVisible(false);
                  setSelectedCategoryForDetails('');
                }}
                className="text-gray-500 hover:text-gray-700 text-lg sm:text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600 mb-4">
              This category includes the following options:
            </p>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Click options to select/de-select:</span>
              <button
                onClick={() => deselectAllTagsInCategory(selectedCategoryForDetails)}
                className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300 transition-colors"
              >
                De-select All
              </button>
            </div>
            
            <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded border">
              {selectedCategoryForDetails && tagGroups[selectedCategoryForDetails as keyof typeof tagGroups] ? 
                tagGroups[selectedCategoryForDetails as keyof typeof tagGroups]
                  .map((tag) => {
                    const [key, value] = tag.split(':');
                    return { key, value, original: tag };
                  })
                  .sort((a, b) => a.value.localeCompare(b.value))
                  .map((tagObj, index) => {
                    const isSelected = selectedTagsInCategory[selectedCategoryForDetails]?.includes(tagObj.original) ?? true;
                    return (
                      <div 
                        key={index} 
                        onClick={() => toggleTagInCategory(selectedCategoryForDetails, tagObj.original)}
                        className={`flex justify-between py-2 px-2 border-b border-gray-200 last:border-b-0 cursor-pointer rounded transition-all duration-200 ${
                          isSelected 
                            ? 'bg-blue-100 hover:bg-blue-200' 
                            : 'bg-white hover:bg-gray-100 opacity-50'
                        }`}
                      >
                        <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                          {isSelected ? '✓ ' : '○ '}{tagObj.key}
                        </span>
                        <span className={isSelected ? 'text-gray-800' : 'text-gray-600'}>
                          {tagObj.value}
                        </span>
                      </div>
                    );
                  }) : null
              }
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              Selected: {selectedCategoryForDetails && selectedTagsInCategory[selectedCategoryForDetails] ? 
                selectedTagsInCategory[selectedCategoryForDetails].length : 
                (selectedCategoryForDetails && tagGroups[selectedCategoryForDetails as keyof typeof tagGroups] ? 
                  tagGroups[selectedCategoryForDetails as keyof typeof tagGroups].length : 0)
              } / Total: {selectedCategoryForDetails && tagGroups[selectedCategoryForDetails as keyof typeof tagGroups] ? 
                tagGroups[selectedCategoryForDetails as keyof typeof tagGroups].length : 0} tags
            </p>
          </div>
          </div>
        </div>
      )}

      {/* Floating button to reopen side panel when minimized */}
      {sidebarMinimized && panelOpen && (
        <button
          onClick={reopenSidePanel}
          className="absolute top-4 right-4 z-[1002] bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
          title="Show Results Panel"
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM4 12a1 1 0 100 2h12a1 1 0 100-2H4z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Report Panel */}
      {reportVisible && !reportMinimized && (
        <div className="absolute top-0 left-0 right-0 z-[1003] bg-white/95 backdrop-blur-sm border-b-2 border-blue-500 shadow-lg max-h-[50vh] overflow-y-auto transition-all duration-300">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Local Expert Report</h2>
              <div className="flex gap-2">
                <button 
                  onClick={minimizeReport}
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
                  onClick={hideReport}
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
            <div 
              className="prose prose-sm max-w-none text-gray-800"
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: reportContent.replace(/\n/g, '<br>') }}
            />
          </div>
        </div>
      )}

      {/* Floating button to restore minimized report */}
      {reportVisible && reportMinimized && (
        <button
          onClick={maximizeReport}
          className="absolute top-4 left-4 z-[1004] bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-lg transition-all duration-200 text-sm font-medium"
          title="Show Report"
        >
          📄 Show Report
        </button>
      )}

  <SidePanel open={panelOpen} onClose={resetAppToInitialState} onMinimize={minimizeSidePanel} minimized={sidebarMinimized} places={places} onShowReport={showReport} />
    </div>
  );
}