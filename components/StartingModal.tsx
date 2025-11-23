import React, { useState } from 'react';

interface StartingModalProps {
  visible: boolean;
  numberOfPlaces: number;
  setNumberOfPlaces: (n: number) => void;
  radiusKm: number;
  setRadiusKm: (n: number) => void;
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
  keepLocation,
  setKeepLocation,
  onButton1,
  onButton2,
  onButton3,
  onDefineAttractions,
  onResetAttractions,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!visible) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-xl w-80 max-w-xs mx-auto" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
        <h2 className="font-bold text-xl sm:text-2xl text-center mb-3 sm:mb-4">Do You Know what is Around You?</h2>
        <h1 className="font-bold text-2xl sm:text-4xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6">Discover & Explore</h1>
        <div className="mt-2 flex flex-col gap-2 sm:gap-3">
          <button onClick={onButton1} className="px-3 py-2 sm:px-4 sm:py-3 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm sm:text-base">
            Near me: Find my Favorites
          </button>
          <button onClick={onButton2} className="px-3 py-2 sm:px-4 sm:py-3 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm sm:text-base">
            Near me: Find anything specific
          </button>
          <button onClick={onButton3} className="px-3 py-2 sm:px-4 sm:py-3 rounded bg-green-600 text-white hover:bg-green-700 transition-colors text-sm sm:text-base">
            Anywhere: Find anything specific
          </button>
          {/* Number of places slider */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex flex-col gap-5">
              {/* First horizontal slider */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap" style={{ minWidth: 110 }}>
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
              <div className="flex items-center gap-4">
                <span className="text-xs font-medium text-gray-700 whitespace-nowrap" style={{ minWidth: 110 }}>
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
            </div>
            {/* Keep Location label and checkbox */}
            <div className="flex items-center gap-4 mt-2" style={{ minHeight: '40px' }}>
              <div className="flex items-center gap-2" style={{ minWidth: 110 }}>
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
                <label htmlFor="keep-location-checkbox" className="text-xs font-medium text-gray-700">Keep Location</label>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded border border-blue-300 transition-colors hover:opacity-100 cursor-pointer"
                  onClick={onDefineAttractions}
                  title="Define which tags are included as Favorites"
                >
                  My Favorites
                </button>
                {onResetAttractions && (
                  <button
                    type="button"
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded border border-red-300 transition-colors hover:opacity-100 cursor-pointer"
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
