'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

import dynamic from 'next/dynamic';
const MapClient = dynamic(() => import('../components/MapClient'), { ssr: false });
import SidePanel from '../components/SidePanel';
import CategoryModal from '../components/CategoryModal';
import CategoryDetailsModal from '../components/CategoryDetailsModal';
import AddressSearchModal, { type AddressSuggestion } from '../components/AddressSearchModal';
import StartingModal from '../components/StartingModal';
import { tagGroups as initialTagGroups } from '../utils/allowedtags';
import { saveUserAttractions, loadUserAttractions, resetUserAttractions } from '../utils/user-attractions';
import { useFirebaseUser } from '../components/LoginModalOnLoadWrapper';

// CSS for custom slider handles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .custom-slider::-webkit-slider-thumb {
      appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      border: 2px solid #3b82f6;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .custom-slider::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: white;
      border: 2px solid #3b82f6;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `;
  if (!document.head.querySelector('style[data-custom-slider]')) {
    style.setAttribute('data-custom-slider', 'true');
    document.head.appendChild(style);
  }
}

// Place type matches the structure returned from the API
export interface Place {
  id: number;
  type: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
  distance_m: number;
  isNewlyAdded?: boolean; // Flag to mark newly discovered places during live tracking
}

export default function Page() {
  // Get the current user from Firebase context
  const user = useFirebaseUser();
  
  // Debug: Log user info
  useEffect(() => {
    if (user) {
      console.log('Current user ID:', user.uid);
      console.log('User email:', user.email);
    }
  }, [user]);
  
  // State to track if CategoryModal is in Attractions edit mode
  const [editAttractionsMode, setEditAttractionsMode] = useState(false);
  // Handler for Define Attractions button
  const handleDefineAttractions = () => {
    setEditAttractionsMode(true);
    setCategoryModalVisible(true);
    setModalVisible(false);
    
    // Also open the Favorites details modal
    setSelectedCategoryForDetails('Favorites');
    // Initialize all Favorites tags as selected if not already set
    if (!selectedTagsInCategory['Favorites']) {
      const allTags = tagGroups.Favorites || [];
      setSelectedTagsInCategory(prev => ({
        ...prev,
        Favorites: [...allTags]
      }));
    }
    setCategoryDetailsVisible(true);
  };
  // Spinner for 'Near me - find the best attractions'
  const [showGlobeSpinner, setShowGlobeSpinner] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [center, setCenter] = useState<{ lat: number; lon: number }>({ lat: 47.3769, lon: 8.5417 }); // Zurich
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(true);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [searchMode, setSearchMode] = useState<'current' | 'address'>('current');
  const [categoryDetailsVisible, setCategoryDetailsVisible] = useState(false);
  const [selectedCategoryForDetails, setSelectedCategoryForDetails] = useState<string>('');
  const [selectedTagsInCategory, setSelectedTagsInCategory] = useState<Record<string, string[]>>({});
  const [tagGroups, setTagGroups] = useState(initialTagGroups);
  const [categoriesAddedToAttractions, setCategoriesAddedToAttractions] = useState<string[]>([]);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [numberOfPlaces, setNumberOfPlaces] = useState(20);
  // Second slider: 1-20 km, default 5
  const [radiusKm, setRadiusKm] = useState(5);
  // Keep Location checkbox state (shared)
  const [keepLocation, setKeepLocation] = useState(false);
  // Store address input if keepLocation is active
  const [keptAddress, setKeptAddress] = useState('');
  // Store the display name of the selected address
  const [selectedLocationName, setSelectedLocationName] = useState('');
  // Track if the current search is from the "Favorites" button
  const [isFavoritesSearch, setIsFavoritesSearch] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // Prevent multiple simultaneous searches
  const [reportVisible, setReportVisible] = useState(false);
  const [reportContent, setReportContent] = useState<string>('');
  const [reportMinimized, setReportMinimized] = useState(false);
  // Live tracking toggle state
  const [liveTracking, setLiveTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [lastSearchLocation, setLastSearchLocation] = useState<{lat: number, lon: number} | null>(null);
  // Tracking distance (1-9, maps to [10, 50, 100, 250, 500, 1000, 2000, 5000, 10000] meters)
  const [trackingDistance, setTrackingDistance] = useState(6); // Default to 1000m (index 6)
  // Track previous search results to identify new places during live tracking
  const [previousPlaces, setPreviousPlaces] = useState<Place[]>([]);

  // Load user's custom attractions when user logs in
  useEffect(() => {
    if (user?.uid) {
      console.log('Loading attractions for user:', user.uid); // Debug log
      // Add a small delay to ensure Firebase is ready
      const timer = setTimeout(() => {
        loadUserAttractions(user.uid)
          .then(({ tags, customCategories }) => {
            console.log('Loaded attractions from Firebase:', { 
              totalTags: tags.length, 
              customCategories,
              firstFewTags: tags.slice(0, 5),
              allTags: tags 
            });
            setTagGroups(prev => ({
              ...prev,
              Favorites: tags
            }));
            setCategoriesAddedToAttractions(customCategories);
          })
          .catch((error) => {
            console.error('Failed to load user attractions:', error);
            // Continue with defaults - don't block the UI
          });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user?.uid]);

  // Handle live tracking
  useEffect(() => {
    if (liveTracking && 'geolocation' in navigator) {
      console.log('Starting live tracking...');
      
      // Tracking distance values in meters
      const trackingDistanceValues = [10, 50, 100, 250, 500, 1000, 2000, 5000, 10000];
      const currentTrackingDistanceM = trackingDistanceValues[trackingDistance - 1];
      
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;
          
          // Always update the red marker position to current location
          setCenter({ lat: currentLat, lon: currentLon });
          
          // Check if we have a last search location and if user moved significantly
          if (lastSearchLocation) {
            const distance = haversineDistance(
              lastSearchLocation.lat, 
              lastSearchLocation.lon, 
              currentLat, 
              currentLon
            );
            
            // If user moved more than the configured tracking distance, trigger new search
            if (distance > currentTrackingDistanceM) {
              console.log(`User moved ${Math.round(distance)}m (threshold: ${currentTrackingDistanceM}m) - triggering new search`);
              
              // Only auto-search if we have an active search (panel is open)
              if (panelOpen && !isSearching) {
                performLiveSearch(currentLat, currentLon);
              }
            }
          }
        },
        (error) => {
          console.error('Live tracking error:', error);
          // Don't alert for minor errors, just log them
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000 // Accept cached location up to 5 seconds old
        }
      );
      
      setWatchId(id);
      
      return () => {
        if (id !== null) {
          navigator.geolocation.clearWatch(id);
        }
      };
    } else if (!liveTracking && watchId !== null) {
      console.log('Stopping live tracking...');
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [liveTracking, lastSearchLocation, panelOpen, isSearching, trackingDistance]);

  // Haversine distance calculation function
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Perform live search when user moves
  const performLiveSearch = async (lat: number, lon: number) => {
    if (isSearching) return; // Prevent multiple simultaneous searches
    
    setIsSearching(true);
    setShowGlobeSpinner(true);
    
    try {
      let tags: string[] = [];
      
      if (isFavoritesSearch) {
        // Use Favorites tags
        tags = tagGroups.Favorites.map(tag => tag.replace(':', '='));
      } else if (selectedCategories.length > 0) {
        // Use selected categories tags
        selectedCategories.forEach(categoryName => {
          const categoryTags = selectedTagsInCategory[categoryName] || tagGroups[categoryName as keyof typeof tagGroups];
          tags.push(...categoryTags.map(tag => tag.replace(':', '=')));
        });
      } else {
        // No active search to repeat
        setIsSearching(false);
        setShowGlobeSpinner(false);
        return;
      }
      
      // Limit tags to prevent API overload
      const limitedTags = tags.slice(0, 30);
      
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon, tags: limitedTags, limit: numberOfPlaces, radiusKm }),
        signal: AbortSignal.timeout(30000) // Shorter timeout for live updates
      });
      
      const data = await res.json();
      const newPlaces = data.places || [];
      
      // Identify newly added places by comparing with previous results
      const newlyAddedPlaces = identifyNewPlaces(newPlaces, previousPlaces);
      
      // Store current places as previous for next comparison
      setPreviousPlaces(places);
      
      // Mark newly added places with a flag
      const placesWithNewFlag = newPlaces.map((place: Place) => ({
        ...place,
        isNewlyAdded: newlyAddedPlaces.some(newPlace => 
          newPlace.id === place.id && newPlace.type === place.type
        )
      }));
      
      setPlaces(placesWithNewFlag);
      setLastSearchLocation({ lat, lon }); // Update last search location
      
      // Log newly found places
      if (newlyAddedPlaces.length > 0) {
        console.log(`Live tracking found ${newlyAddedPlaces.length} new places:`, 
          newlyAddedPlaces.map(p => p.tags.name || 'Unnamed place')
        );
      }
      
      // Update location name via reverse geocoding (optional, for better UX)
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`
        );
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.display_name) {
            setSelectedLocationName(geocodeData.display_name);
          }
        }
      } catch (geocodeError) {
        console.log('Geocoding failed during live tracking:', geocodeError);
      }
      
    } catch (err) {
      console.error('Live search failed:', err);
      // Don't show alert for live search failures, just log them
    } finally {
      setIsSearching(false);
      setShowGlobeSpinner(false);
    }
  };

  // Function to identify newly added places
  const identifyNewPlaces = (newPlaces: Place[], oldPlaces: Place[]): Place[] => {
    if (oldPlaces.length === 0) {
      // First search, all places are new
      return newPlaces;
    }
    
    return newPlaces.filter(newPlace => {
      // Check if this place existed in previous results
      return !oldPlaces.some(oldPlace => 
        oldPlace.id === newPlace.id && 
        oldPlace.type === newPlace.type
      );
    });
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

  // Function to convert URLs in text to clickable links
  const formatReportWithLinks = (text: string) => {
    // Replace newlines with <br> tags
    let formatted = text.replace(/\n/g, '<br>');
    
    // First, handle markdown-style links [text](url) and replace with just the URL
    const markdownLinkRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    formatted = formatted.replace(markdownLinkRegex, '$2');
    
    // URL regex pattern to match http/https URLs (avoiding already processed <a> tags)
    const urlRegex = /(?<!<a[^>]*>)(https?:\/\/[^\s<>"{}|\\^`[\]]+)(?![^<]*<\/a>)/g;
    
    // Replace URLs with clickable links
    formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">$1</a>');
    
    return formatted;
  };

  const resetAppToInitialState = () => {
    setPlaces([]);
    setCenter({ lat: 47.3769, lon: 8.5417 }); // Reset to Zurich
    setPanelOpen(false);
    setSidebarMinimized(false);
    setLoading(false);
    setIsSearching(false); // Reset search state
    setModalVisible(true);
    setCategoryModalVisible(false);
    setSelectedCategories([]);
    setAddressModalVisible(false);
    setSearchMode('current');
    setIsFavoritesSearch(false); // Reset favorites search flag
    setCategoryDetailsVisible(false);
    setSelectedCategoryForDetails('');
    setSelectedTagsInCategory({});
    setCategoriesAddedToAttractions([]);
    // DO NOT reset tagGroups or Firebase data here - this is just a UI reset
    setReportVisible(false);
    setReportContent('');
    setReportMinimized(false);
    setLastSearchLocation(null); // Reset live tracking location
    setLiveTracking(false); // Turn off live tracking when panel is closed
    setPreviousPlaces([]); // Reset previous places tracking
    setPreviousPlaces([]); // Reset previous places tracking
  };

  const resetAttractionsToDefault = () => {
    // This function specifically resets attractions - only call when user explicitly wants this
    setCategoriesAddedToAttractions([]);
    setTagGroups(initialTagGroups); // Reset tagGroups to initial state
    setSelectedTagsInCategory({}); // Clear all selected/highlighted tags in categories
    setSelectedCategories([]); // Clear category selection highlighting (blue-purple color)
    
    // Reset user attractions in Firebase if user is logged in (non-blocking)
    if (user?.uid) {
      setTimeout(() => {
        resetUserAttractions(user.uid)
          .catch(error => {
            console.warn('Failed to reset attractions in Firebase (continuing with local reset):', error);
          });
      }, 0);
    }
  };

  const handleReturnToMainFromEdit = () => {
    setCategoryModalVisible(false);
    setEditAttractionsMode(false);
    setModalVisible(true);
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
    setSelectedLocationName(''); // Clear any previously selected address
    setIsFavoritesSearch(true); // Mark this as a favorites search
    setModalVisible(false); // Hide modal when Button 1 is clicked
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setCenter({ lat, lon });
      setShowGlobeSpinner(true); // Show globe spinner only after location is found

      // Reverse geocode to get the address of current location
      try {
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`
        );
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.display_name) {
            setSelectedLocationName(geocodeData.display_name);
          }
        }
      } catch (error) {
        console.error('Reverse geocoding failed:', error);
        // Keep default "Current Location" if geocoding fails
      }

      // send to server
      try {
        // Use Nature and Culture tags from allowedtags.ts
        const tags = [
          ...tagGroups.Favorites.map(tag => tag.replace(':', '=')),
          
        ];

        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lon, tags, limit: numberOfPlaces, radiusKm }),
          signal: AbortSignal.timeout(60000) // 60 second timeout for frontend
        });
        const data = await res.json();
        setPlaces(data.places || []);
        setLastSearchLocation({ lat, lon }); // Track search location for live tracking
        setPanelOpen(true);
        setShowGlobeSpinner(false); // Hide spinner when panel opens
      } catch (err) {
        setShowGlobeSpinner(false);
        console.error(err);
        if (err instanceof Error && err.name === 'TimeoutError') {
          alert('Search timed out. The server might be busy. Please try again.');
          resetAppToInitialState();
        } else if (err instanceof Error && err.message.includes('timeout')) {
          alert('Search timed out. Please try again or search for fewer categories.');
          resetAppToInitialState();
        } else {
          alert('Search failed. Please try again.');
        }
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }, (err) => {
      setShowGlobeSpinner(false);
      setLoading(false);
      setIsSearching(false);
      alert('Geolocation permission denied or error: ' + err.message);
    }, { enableHighAccuracy: true });
  };

  const handleButton3 = () => {
    if (keepLocation && keptAddress.trim() !== '') {
      setModalVisible(false);
      setAddressModalVisible(false);
      setCategoryModalVisible(true);
      setSearchMode('address');
    } else {
      setModalVisible(false);
      setAddressModalVisible(true);
    }
  };

  const handleAddressSelect = async (suggestion: AddressSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    
    setCenter({ lat, lon });
    setSelectedLocationName(suggestion.display_name);
    setAddressModalVisible(false);
    
    // Open category modal and set to search at address location
    setSelectedCategories([]); // Reset category selections
    setSearchMode('address'); // Set to search at address location
    setCategoryModalVisible(true);
  };

  const showCategoryDetails = (categoryName: string) => {
    setSelectedCategoryForDetails(categoryName);
    // Initialize all tags as deselected for this category if not already set
    if (!selectedTagsInCategory[categoryName]) {
      setSelectedTagsInCategory(prev => ({
        ...prev,
        [categoryName]: []
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
      
      // Special handling for Attractions in edit mode
      if (editAttractionsMode && categoryName === 'Favorites') {
        const isDeselecting = currentTags.includes(tag);
        
        if (isDeselecting) {
          // Remove tag from Favorites tagGroups
          setTagGroups(prevGroups => ({
            ...prevGroups,
            Favorites: prevGroups.Favorites.filter(t => t !== tag)
          }));
          
          // Update categoriesAddedToAttractions - remove categories that no longer have tags
          setCategoriesAddedToAttractions(prevCategories => {
            const updatedAttractionsTags = tagGroups.Favorites.filter(t => t !== tag);
            const remainingCategories = prevCategories.filter(cat => {
              const categoryTags = initialTagGroups[cat as keyof typeof initialTagGroups] || [];
              return categoryTags.some(catTag => updatedAttractionsTags.includes(catTag));
            });
            return remainingCategories;
          });
          
          // Save to Firebase (non-blocking)
          if (user?.uid) {
            setTimeout(() => {
              const updatedAttractionsTags = tagGroups.Favorites.filter(t => t !== tag);
              const remainingCategories = categoriesAddedToAttractions.filter(cat => {
                const categoryTags = initialTagGroups[cat as keyof typeof initialTagGroups] || [];
                return categoryTags.some(catTag => updatedAttractionsTags.includes(catTag));
              });
              
              saveUserAttractions(user.uid, updatedAttractionsTags, remainingCategories)
                .catch(error => {
                  console.warn('Failed to save updated attractions to Firebase:', error);
                });
            }, 0);
          }
        }
      }
      
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
      
      // If in edit attractions mode and not selecting from Attractions category itself
      if (editAttractionsMode && selectedCategoryForDetails !== 'Favorites') {
        const selectedTags = selectedTagsInCategory[selectedCategoryForDetails] || tagGroups[selectedCategoryForDetails as keyof typeof tagGroups] || [];
        
        // Add selected tags to Favorites category
        setTagGroups(prev => {
          const currentAttractionsTags = prev.Favorites || [];
          const newTags = selectedTags.filter(tag => !currentAttractionsTags.includes(tag));
          
          // Remove default tourism:attraction tag if we're adding the first custom tag
          let updatedAttractionsTags = [...currentAttractionsTags, ...newTags];
          if (newTags.length > 0 && currentAttractionsTags.includes('tourism:attraction') && currentAttractionsTags.length === 1) {
            updatedAttractionsTags = newTags; // Replace default with new tags
          }
          
          // Save to Firebase if user is logged in (non-blocking)
          if (user?.uid && newTags.length > 0) {
            const updatedCategories = categoriesAddedToAttractions.includes(selectedCategoryForDetails) 
              ? categoriesAddedToAttractions 
              : [...categoriesAddedToAttractions, selectedCategoryForDetails];
            
            // Use setTimeout to make this non-blocking
            setTimeout(() => {
              saveUserAttractions(user.uid, updatedAttractionsTags, updatedCategories)
                .catch(error => {
                  console.warn('Failed to save attractions to Firebase (continuing with local state):', error);
                });
            }, 0);
          }
          
          return {
            ...prev,
            Favorites: updatedAttractionsTags
          };
        });
        
        // Also make the new tags active/selected in the Favorites category
        setSelectedTagsInCategory(prev => {
          const currentAttractionsSelected = prev.Favorites || [];
          const newTagsToSelect = selectedTags.filter(tag => !currentAttractionsSelected.includes(tag));
          
          return {
            ...prev,
            Favorites: [...currentAttractionsSelected, ...newTagsToSelect]
          };
        });
        
        // Track that this category has contributed to Attractions
        setCategoriesAddedToAttractions(prev => 
          prev.includes(selectedCategoryForDetails) 
            ? prev 
            : [...prev, selectedCategoryForDetails]
        );
      }
    }
    setCategoryDetailsVisible(false);
    setSelectedCategoryForDetails('');
  };

  const handleButton2 = () => {
    if (keepLocation) {
      setKeepLocation(false);
    }
    setModalVisible(false);
    setSelectedCategories([]); // Reset selections when opening modal
    setSearchMode('current'); // Set to search at current location
    setCategoryModalVisible(true);
  };

  const toggleCategory = (categoryName: string) => {
    // If in edit attractions mode and not selecting Attractions itself
    if (editAttractionsMode && categoryName !== 'Favorites') {
      // Add ALL tags from this category to Attractions
      const allCategoryTags = tagGroups[categoryName as keyof typeof tagGroups] || [];
      
      setTagGroups(prev => {
        const currentAttractionsTags = prev.Favorites || [];
        const newTags = allCategoryTags.filter(tag => !currentAttractionsTags.includes(tag));
        
        // Remove default tourism:attraction tag if we're adding the first custom tag
        let updatedAttractionsTags = [...currentAttractionsTags, ...newTags];
        if (newTags.length > 0 && currentAttractionsTags.includes('tourism:attraction') && currentAttractionsTags.length === 1) {
          updatedAttractionsTags = newTags; // Replace default with new tags
        }
        
        // Save to Firebase if user is logged in (non-blocking)
        if (user?.uid && newTags.length > 0) {
          const updatedCategories = categoriesAddedToAttractions.includes(categoryName) 
            ? categoriesAddedToAttractions 
            : [...categoriesAddedToAttractions, categoryName];
          
          // Use setTimeout to make this non-blocking
          setTimeout(() => {
            saveUserAttractions(user.uid, updatedAttractionsTags, updatedCategories)
              .catch(error => {
                console.warn('Failed to save attractions to Firebase (continuing with local state):', error);
              });
          }, 0);
        }
        
        return {
          ...prev,
          Favorites: updatedAttractionsTags
        };
      });
      
      // Also make ALL the new tags active/selected in the Favorites category
      setSelectedTagsInCategory(prev => {
        const currentAttractionsSelected = prev.Favorites || [];
        const newTagsToSelect = allCategoryTags.filter(tag => !currentAttractionsSelected.includes(tag));
        
        return {
          ...prev,
          Favorites: [...currentAttractionsSelected, ...newTagsToSelect]
        };
      });
      
      // Track that this category has contributed to Attractions
      setCategoriesAddedToAttractions(prev => 
        prev.includes(categoryName) 
          ? prev 
          : [...prev, categoryName]
      );
      
      // Still toggle the category selection for visual feedback
      setSelectedCategories(prev => 
        prev.includes(categoryName)
          ? prev.filter(cat => cat !== categoryName)
          : [...prev, categoryName]
      );
    } else {
      // Normal toggle behavior when not in edit mode
      setSelectedCategories(prev => 
        prev.includes(categoryName)
          ? prev.filter(cat => cat !== categoryName)
          : [...prev, categoryName]
      );
    }
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
    setIsFavoritesSearch(false); // Clear favorites search flag for category searches
    setCategoryModalVisible(false);

    // If keepLocation is active and keptAddress is set, geocode the address and use its coordinates
    if (keepLocation && keptAddress.trim() !== '') {
      try {
        // Geocode the keptAddress using the address-search API
        const response = await fetch(`/api/address-search?q=${encodeURIComponent(keptAddress)}`);
        if (!response.ok) throw new Error('Failed to geocode address');
        const data = await response.json();
        if (!data || !Array.isArray(data) || data.length === 0) throw new Error('No results for address');
        const { lat, lon } = data[0];

        // Move the map to the address in the center
        setCenter({ lat: parseFloat(lat), lon: parseFloat(lon) });
        setShowGlobeSpinner(true); // Show spinner after location is found

        // Get tags for all selected categories with performance optimization
        const allTags = selectedCategories.flatMap(categoryName => {
          const categoryTags = selectedTagsInCategory[categoryName] || tagGroups[categoryName as keyof typeof tagGroups];
          return categoryTags.map(tag => tag.replace(':', '='));
        });
        const limitedTags = allTags.slice(0, 30);
        if (allTags.length > 30) {
          console.log(`Limited search from ${allTags.length} to 30 tags for better performance`);
        }

        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: parseFloat(lat), lon: parseFloat(lon), tags: limitedTags, limit: numberOfPlaces, radiusKm }),
          signal: AbortSignal.timeout(60000)
        });
        const searchData = await res.json();
        setPlaces(searchData.places || []);
        setPanelOpen(true);
        setShowGlobeSpinner(false); // Hide spinner when panel opens
      } catch (err) {
        setShowGlobeSpinner(false);
        console.error(err);
        alert('Failed to search by address. Please try again.');
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
      return;
    }

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
        setShowGlobeSpinner(true); // Show spinner after location is found

        // Reverse geocode to get the address of current location
        try {
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`
          );
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.display_name) {
              setSelectedLocationName(geocodeData.display_name);
            }
          }
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Keep default if geocoding fails
        }

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
            body: JSON.stringify({ lat, lon, tags: limitedTags, limit: numberOfPlaces, radiusKm }),
            signal: AbortSignal.timeout(60000) // 60 second timeout for frontend
          });
          const data = await res.json();
          setPlaces(data.places || []);
          setLastSearchLocation({ lat, lon }); // Track search location for live tracking
          setPanelOpen(true);
          setShowGlobeSpinner(false); // Hide spinner when panel opens
        } catch (err) {
          setShowGlobeSpinner(false);
          console.error(err);
          if (err instanceof Error && err.name === 'TimeoutError') {
            alert('Search timed out. The server might be busy. Please try again.');
            resetAppToInitialState();
          } else if (err instanceof Error && err.message.includes('timeout')) {
            alert('Search timed out. Please try again or search for fewer categories.');
            resetAppToInitialState();
          } else {
            alert('Search failed. Please try again.');
          }
        } finally {
          setLoading(false);
        }
      }, (err) => {
        setShowGlobeSpinner(false);
        setLoading(false);
        alert('Geolocation permission denied or error: ' + err.message);
      }, { enableHighAccuracy: true });
    } else {
      // Search at address location - use existing center coordinates
      try {
        setShowGlobeSpinner(true); // Show spinner before fetch
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
          body: JSON.stringify({ lat, lon, tags: limitedTags, limit: numberOfPlaces, radiusKm }),
          signal: AbortSignal.timeout(60000) // 60 second timeout for frontend
        });
        const data = await res.json();
        setPlaces(data.places || []);
        setLastSearchLocation({ lat, lon }); // Track search location for live tracking
        setPanelOpen(true);
        setShowGlobeSpinner(false); // Hide spinner when panel opens
      } catch (err) {
        setShowGlobeSpinner(false);
        console.error(err);
        if (err instanceof Error && err.name === 'TimeoutError') {
          alert('Search timed out. The server might be busy. Please try again.');
          resetAppToInitialState();
        } else if (err instanceof Error && err.message.includes('timeout')) {
          alert('Search timed out. Please try again or search for fewer categories.');
          resetAppToInitialState();
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
      <MapClient center={center} places={places} showCurrentLocation={true} />

      {/* Globe Spinner Overlay */}
      {showGlobeSpinner && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center pointer-events-none">
          <Image
            src="/globe.svg"
            alt="Loading..."
            width={96}
            height={96}
            className="animate-spin-slow w-24 h-24 pointer-events-auto"
            style={{ animation: 'spin 2s linear infinite', filter: 'brightness(0) invert(1)' }}
            priority
          />
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .animate-spin-slow { animation: spin 2s linear infinite; }
          `}</style>
        </div>
      )}

      <StartingModal
        visible={modalVisible}
        numberOfPlaces={numberOfPlaces}
        setNumberOfPlaces={setNumberOfPlaces}
        radiusKm={radiusKm}
        setRadiusKm={setRadiusKm}
        trackingDistance={trackingDistance}
        setTrackingDistance={setTrackingDistance}
        keepLocation={keepLocation}
        setKeepLocation={setKeepLocation}
        onButton1={handleButton1}
        onButton2={handleButton2}
        onButton3={handleButton3}
        onDefineAttractions={handleDefineAttractions}
        currentAttractions={tagGroups.Favorites}
        categoriesAdded={categoriesAddedToAttractions}
        onResetAttractions={resetAttractionsToDefault}
      />

      <CategoryModal
        visible={categoryModalVisible}
        resetAppToInitialState={() => {
          setEditAttractionsMode(false);
          resetAppToInitialState();
        }}
        handleMultiCategorySearch={handleMultiCategorySearch}
        selectedCategories={selectedCategories}
        loading={loading}
        toggleCategory={toggleCategory}
        showCategoryDetails={showCategoryDetails}
        selectedCategoryForDetails={selectedCategoryForDetails}
        selectedTagsInCategory={selectedTagsInCategory}
        tagGroups={tagGroups}
        editAttractionsMode={editAttractionsMode}
        categoriesAddedToAttractions={categoriesAddedToAttractions}
        handleReturnToMainFromEdit={handleReturnToMainFromEdit}
      />

      {/* Address Search Modal */}
      <AddressSearchModal 
        visible={addressModalVisible}
        onClose={() => {
          setAddressModalVisible(false);
          setModalVisible(true);
        }}
        onAddressSelect={handleAddressSelect}
        loading={loading}
        keepLocation={keepLocation}
        setKeepLocation={setKeepLocation}
        keptAddress={keptAddress}
        setKeptAddress={setKeptAddress}
      />

      <CategoryDetailsModal
        visible={categoryDetailsVisible}
        categoryName={selectedCategoryForDetails}
        tagGroups={tagGroups}
        selectedTags={selectedTagsInCategory[selectedCategoryForDetails] || (selectedCategoryForDetails && tagGroups[selectedCategoryForDetails as keyof typeof tagGroups]) || []}
        onToggleTag={toggleTagInCategory}
        onDeselectAll={deselectAllTagsInCategory}
        onClose={() => {
          setCategoryDetailsVisible(false);
          setSelectedCategoryForDetails('');
        }}
        onSelect={closeCategoryDetailsAndActivate}
      />

      {/* Floating button to reopen side panel when minimized */}
      {sidebarMinimized && panelOpen && (
        <div className="absolute top-4 right-4 z-[1002] flex gap-2">
          <button
            onClick={reopenSidePanel}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 flex flex-col items-center justify-center min-w-[60px] h-[60px]"
            title="Show Results Panel"
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" className="mb-1">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM4 12a1 1 0 100 2h12a1 1 0 100-2H4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium leading-none">
              List
            </span>
          </button>
          
          {/* Live Tracking Toggle */}
          <button
            onClick={() => setLiveTracking(!liveTracking)}
            className={`p-2 rounded-full shadow-lg transition-all duration-200 flex flex-col items-center justify-center min-w-[60px] h-[60px] ${
              liveTracking 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            title={liveTracking ? "Live Tracking: ON" : "Live Tracking: OFF"}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" className="mb-1">
              {liveTracking ? (
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              ) : (
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm5 9h-1.26c-.19 1.73-1.73 3.27-3.46 3.46V16h-2v-1.54c-1.73-.19-3.27-1.73-3.46-3.46H4v-2h1.54c.19-1.73 1.73-3.27 3.46-3.46V4h2v1.54c1.73.19 3.27 1.73 3.46 3.46H15v2z"/>
              )}
            </svg>
            <span className="text-xs font-medium leading-none">
              {liveTracking ? "Live" : "Static"}
            </span>
          </button>
        </div>
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
              dangerouslySetInnerHTML={{ __html: formatReportWithLinks(reportContent) }}
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

  <SidePanel 
    open={panelOpen} 
    onClose={resetAppToInitialState} 
    onMinimize={minimizeSidePanel} 
    minimized={sidebarMinimized} 
    places={places} 
    searchLocation={selectedLocationName || 'Current Location'}
    selectedCategories={selectedCategories}
    isFavoritesSearch={isFavoritesSearch}
  />
    </div>
  );
}