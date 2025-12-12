import React, { useState } from 'react';

interface StartingModalProps {
  visible: boolean;
  numberOfPlaces: number;
  setNumberOfPlaces: (n: number) => void;
  radiusKm: number;
  setRadiusKm: (n: number) => void;
  trackingDistance: number;
  setTrackingDistance: (n: number) => void;
  keepLocation: boolean;
  setKeepLocation: (v: boolean) => void;
  onButton1: () => void;
  onButton2: () => void;
  onButton3: () => void;
  onDefineAttractions: () => void;
  currentAttractions?: string[]; // Add this to see current attractions
  categoriesAdded?: string[]; // Add this to see which categories were added
  onResetAttractions?: () => void; // Add reset function
}

const StartingModal: React.FC<StartingModalProps> = ({
  visible,
  numberOfPlaces,
  setNumberOfPlaces,
  radiusKm,
  setRadiusKm,
  trackingDistance,
  setTrackingDistance,
  keepLocation,
  setKeepLocation,
  onButton1,
  onButton2,
  onButton3,
  onDefineAttractions,
  onResetAttractions,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Tracking distance values in meters
  const trackingDistanceValues = [10, 50, 100, 250, 500, 1000, 2000, 5000, 10000];
  
  // Helper function to format distance text
  const formatTrackingDistance = (distance: number) => {
    if (distance >= 1000) {
      return distance / 1000 + ' km';
    }
    return distance + ' m';
  };

  // Get current tracking distance value from array
  const currentTrackingDistance = trackingDistanceValues[trackingDistance - 1];

  if (!visible) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 lg:p-6 rounded-lg shadow-xl w-80 sm:w-[30rem] lg:w-[28rem] max-w-[90vw] mx-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 2rem)' }}>
        <h2 className="font-bold text-lg sm:text-xl lg:text-2xl text-center mb-2 sm:mb-3 lg:mb-4">Do You Know what is Around You?</h2>
        <h1 className="font-bold text-xl sm:text-2xl lg:text-4xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 sm:mb-4 lg:mb-6">Find Places</h1>
        <div className="mt-2 flex flex-col gap-2 sm:gap-3">
          <button onClick={onButton1} className="px-3 py-2 sm:px-4 sm:py-2.5 lg:py-3 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm sm:text-base flex items-center justify-start gap-2 sm:gap-3">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-10 lg:h-10 flex-shrink-0" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="pinMask1">
                  <rect width="200" height="200" fill="white"/>
                  <circle cx="100.332" cy="84.8" r="15.1" fill="black"/>
                </mask>
              </defs>
              <path fill="white" mask="url(#pinMask1)" d="M100.232 149.198c-2.8 0-5.4-1.8-7.2-5.2-22.2-41-22.4-41.4-22.4-41.6-3.2-5.1-4.9-11.3-4.9-17.6 0-19.1 15.5-34.6 34.6-34.6s34.6 15.5 34.6 34.6c0 6.5-1.8 12.8-5.2 18.2 0 0-1.2 2.4-22.2 41-1.9 3.4-4.4 5.2-7.3 5.2z"/>
            </svg>
            <span className="flex-1 text-center">Near me: Favorites</span>
          </button>
          <button onClick={onButton2} className="px-3 py-2 sm:px-4 sm:py-2.5 lg:py-3 rounded bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all text-sm sm:text-base flex items-center justify-start gap-2 sm:gap-3">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-10 lg:h-10 flex-shrink-0" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="pinMask2">
                  <rect width="200" height="200" fill="white"/>
                  <circle cx="100.332" cy="84.8" r="15.1" fill="black"/>
                </mask>
              </defs>
              <path fill="white" mask="url(#pinMask2)" d="M100.232 149.198c-2.8 0-5.4-1.8-7.2-5.2-22.2-41-22.4-41.4-22.4-41.6-3.2-5.1-4.9-11.3-4.9-17.6 0-19.1 15.5-34.6 34.6-34.6s34.6 15.5 34.6 34.6c0 6.5-1.8 12.8-5.2 18.2 0 0-1.2 2.4-22.2 41-1.9 3.4-4.4 5.2-7.3 5.2z"/>
            </svg>
            <span className="flex-1 text-center">Near me: Specifics</span>
          </button>
          <button onClick={onButton3} className="px-3 py-2 sm:px-4 sm:py-2.5 lg:py-3 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm sm:text-base flex items-center justify-start gap-2 sm:gap-3">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex-shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0C22.415 0 0 22.415 0 50s22.415 50 50 50c27.504 0 49.857-22.287 49.988-49.76A2.5 2.5 0 0 0 100 50a2.5 2.5 0 0 0-.014-.254a2.5 2.5 0 0 0 0-.012C99.841 22.274 77.495 0 50 0zm-2.5 5.27v21.566c-6.033-.18-11.744-1.004-16.906-2.328c.915-2.493 1.954-4.805 3.101-6.889c3.85-6.99 8.706-11.284 13.805-12.35zm5 0c5.1 1.065 9.956 5.36 13.805 12.35c1.147 2.083 2.186 4.395 3.101 6.888c-5.162 1.324-10.873 2.149-16.906 2.328V5.27zM34.588 7.7c-1.954 2.156-3.723 4.69-5.274 7.506c-1.326 2.41-2.505 5.05-3.529 7.871c-2.986-1.02-5.73-2.213-8.166-3.555c-.167-.091-.323-.186-.486-.279A44.975 44.975 0 0 1 34.588 7.701zm30.824 0a44.975 44.975 0 0 1 17.455 11.543c-.163.093-.32.188-.486.28c-2.436 1.34-5.181 2.536-8.168 3.556c-1.022-2.822-2.2-5.463-3.527-7.873c-1.551-2.816-3.32-5.35-5.274-7.506zM13.885 23.135c.435.26.87.52 1.322.77c2.74 1.509 5.775 2.83 9.043 3.943c-1.674 5.982-2.678 12.627-2.871 19.652H5.072a44.79 44.79 0 0 1 8.813-24.365zm72.23 0A44.79 44.79 0 0 1 94.928 47.5H78.604c-.193-7.023-1.193-13.668-2.862-19.65c3.271-1.113 6.308-2.435 9.051-3.946c.451-.248.887-.51 1.322-.77zm-57.058 6.148c5.665 1.476 11.887 2.361 18.443 2.541V47.5H26.383c.194-6.547 1.146-12.72 2.674-18.217zm41.886 0c1.528 5.497 2.48 11.67 2.674 18.217H52.5V31.822c6.555-.18 12.779-1.064 18.443-2.539zM5.073 52.5h16.306c.193 7.025 1.197 13.669 2.871 19.65c-3.267 1.115-6.302 2.437-9.043 3.946c-.451.248-.887.51-1.322.77A44.79 44.79 0 0 1 5.072 52.5zm21.31 0H47.5v15.66c-6.558.18-12.78 1.07-18.445 2.549c-1.527-5.495-2.478-11.665-2.672-18.209zm26.117 0h21.117c-.194 6.544-1.145 12.714-2.672 18.209C65.28 69.23 59.058 68.341 52.5 68.16V52.5zm26.105 0h16.323a44.79 44.79 0 0 1-8.813 24.365c-.435-.26-.87-.52-1.322-.77c-2.742-1.51-5.78-2.832-9.049-3.947c1.67-5.981 2.669-12.625 2.861-19.648zM47.5 73.164V94.73c-5.1-1.065-9.956-5.36-13.805-12.35c-1.147-2.083-2.186-4.395-3.101-6.888c5.162-1.324 10.873-2.149 16.906-2.328zm5 0c6.033.18 11.744 1.004 16.906 2.328c-.915 2.493-1.954 4.805-3.101 6.889c-3.85 6.99-8.706 11.284-13.805 12.35V73.163zm21.713 3.756c2.987 1.02 5.732 2.215 8.168 3.557c.167.091.323.186.486.279a44.975 44.975 0 0 1-17.455 11.543c1.954-2.156 3.723-4.69 5.274-7.506c1.326-2.41 2.504-5.05 3.527-7.873zm-48.428.002c1.024 2.821 2.203 5.461 3.53 7.871c1.55 2.816 3.319 5.35 5.273 7.506a44.975 44.975 0 0 1-17.455-11.543c.163-.093.32-.188.486-.28c2.436-1.34 5.18-2.534 8.166-3.554z" fill="white"/>
            </svg>
            <span className="flex-1 text-center">Anywhere: Specifics</span>
          </button>
          {/* Number of places slider */}
          <div className="mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 lg:pt-4 border-t border-gray-200">
            <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
              {/* First horizontal slider */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap w-32 text-left">
                  Find {numberOfPlaces} Places
                </span>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={numberOfPlaces}
                  onChange={(e) => setNumberOfPlaces(parseInt(e.target.value))}
                  className="appearance-none cursor-pointer custom-slider flex-1"
                  style={{
                    height: '10px',
                    background: `linear-gradient(to right, rgba(59, 130, 246, 0.7) 0%, rgba(59, 130, 246, 0.7) ${((numberOfPlaces - 1) / 39) * 100}%, #e5e7eb ${((numberOfPlaces - 1) / 39) * 100}%, #e5e7eb 100%)`,
                    borderRadius: '5px',
                  }}
                />
              </div>
              {/* Second horizontal slider */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap w-32 text-left">
                  Search within {radiusKm} km
                </span>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                  className="appearance-none cursor-pointer custom-slider flex-1"
                  style={{
                    height: '10px',
                    background: `linear-gradient(to right, rgba(59, 130, 246, 0.7) 0%, rgba(59, 130, 246, 0.7) ${((radiusKm - 1) / 19) * 100}%, #e5e7eb ${((radiusKm - 1) / 19) * 100}%, #e5e7eb 100%)`,
                    borderRadius: '5px',
                  }}
                />
              </div>
              {/* Third horizontal slider - Tracking Distance */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap w-32 text-left">
                  Tracking every {formatTrackingDistance(currentTrackingDistance)}
                </span>
                <input
                  type="range"
                  min="1"
                  max="9"
                  value={trackingDistance}
                  onChange={(e) => setTrackingDistance(parseInt(e.target.value))}
                  className="appearance-none cursor-pointer custom-slider flex-1"
                  style={{
                    height: '10px',
                    background: `linear-gradient(to right, rgba(59, 130, 246, 0.7) 0%, rgba(59, 130, 246, 0.7) ${((trackingDistance - 1) / 8) * 100}%, #e5e7eb ${((trackingDistance - 1) / 8) * 100}%, #e5e7eb 100%)`,
                    borderRadius: '5px',
                  }}
                />
              </div>
            </div>
            {/* Keep Location label and checkbox */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 mt-3 sm:mt-2" style={{ minHeight: '40px' }}>
              <div className="flex items-center gap-2 w-32">
                <input
                  id="keep-location-checkbox"
                  type="checkbox"
                  className="w-4 h-4"
                  checked={keepLocation}
                  onChange={e => {
                    setKeepLocation(e.target.checked);
                  }}
                  style={{ verticalAlign: 'middle', accentColor: '#16A34A' }}
                />
                <label htmlFor="keep-location-checkbox" className="text-xs sm:text-sm font-medium text-gray-700">Keep Location</label>
              </div>
              <div className="flex justify-between items-center gap-4 flex-1">
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded border border-blue-300 transition-colors hover:opacity-100 cursor-pointer whitespace-nowrap"
                  onClick={onDefineAttractions}
                  title="Define which tags are included as Favorites"
                >
                  My Favorites
                </button>
                {onResetAttractions && (
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded border border-red-300 transition-colors hover:opacity-100 cursor-pointer whitespace-nowrap"
                    onClick={() => setShowResetConfirm(true)}
                    title="Reset attractions to default (removes custom attractions)"
                  >
                    Reset Favorites
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Beautiful Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-[2000] p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-lg">⚠️</span>
                </div>
                <h3 className="text-xl font-bold text-white">Reset Favorites</h3>
              </div>
            </div>
            
            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-gray-700 text-base leading-relaxed mb-2">
                Are you sure you want to reset your Favorites to default?
              </p>
              <p className="text-sm text-gray-500">
                This will remove all your custom favorites and restore the original tourism attractions setting.
              </p>
            </div>
            
            {/* Buttons */}
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  if (onResetAttractions) {
                    onResetAttractions();
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Reset Favorites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartingModal;
