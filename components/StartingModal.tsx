import React from 'react';

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
  currentAttractions = [],
  categoriesAdded = [],
  onResetAttractions,
}) => {

  if (!visible) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-xl w-80 max-w-xs mx-auto" style={{ maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
        <h2 className="font-bold text-xl sm:text-2xl text-center mb-3 sm:mb-4">Do You Know what is Around You?</h2>
        <h1 className="font-bold text-2xl sm:text-4xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6">Discover & Explore</h1>
        <div className="mt-2 flex flex-col gap-2 sm:gap-3">
          <button onClick={onButton1} className="px-3 py-2 sm:px-4 sm:py-3 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm sm:text-base">
            Near me: Find the best Attractions
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
                  className="appearance-none cursor-pointer custom-slider"
                  style={{
                    width: '140px',
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
                  className="appearance-none cursor-pointer custom-slider"
                  style={{
                    width: '140px',
                    height: '10px',
                    background: `linear-gradient(to right, rgba(59, 130, 246, 0.7) 0%, rgba(59, 130, 246, 0.7) ${((radiusKm - 1) / 19) * 100}%, #e5e7eb ${((radiusKm - 1) / 19) * 100}%, #e5e7eb 100%)`,
                    borderRadius: '5px',
                  }}
                />
              </div>
            </div>
            {/* Keep Location label and checkbox */}
            <div className="flex flex-row items-center mt-2 gap-2" style={{ minHeight: '40px' }}>
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
              <label htmlFor="keep-location-checkbox" className="text-xs font-medium text-gray-700" style={{ minWidth: 110, marginLeft: 0 }}>Keep Location</label>
              <button
                type="button"
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded border border-blue-300 transition-colors hover:opacity-100 cursor-pointer"
                onClick={onDefineAttractions}
                title="Define which tags are included as Attractions"
              >
                My Attractions
              </button>
              {onResetAttractions && (
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded border border-red-300 transition-colors hover:opacity-100 cursor-pointer"
                  onClick={() => {
                    if (window.confirm('Reset attractions to default? This will remove all custom attractions from Firebase.')) {
                      onResetAttractions();
                    }
                  }}
                  title="Reset attractions to default (removes custom attractions)"
                >
                  Reset Attractions
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartingModal;
