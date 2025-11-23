import React from 'react';

interface CategoryModalProps {
  visible: boolean;
  resetAppToInitialState: () => void;
  handleMultiCategorySearch: () => void;
  selectedCategories: string[];
  loading: boolean;
  toggleCategory: (categoryName: string) => void;
  showCategoryDetails: (categoryName: string) => void;
  selectedCategoryForDetails: string;
  selectedTagsInCategory: Record<string, string[]>;
  tagGroups: Record<string, string[]>;
  editAttractionsMode?: boolean;
  categoriesAddedToAttractions?: string[];
  handleReturnToMainFromEdit?: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  visible,
  resetAppToInitialState,
  handleMultiCategorySearch,
  selectedCategories,
  loading,
  toggleCategory,
  showCategoryDetails,
  selectedCategoryForDetails,
  selectedTagsInCategory,
  tagGroups,
  editAttractionsMode,
  categoriesAddedToAttractions = [],
  handleReturnToMainFromEdit,
}) => {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] p-2 sm:p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 md:p-6 rounded-lg shadow-xl w-full max-w-xs sm:max-w-sm md:max-w-4xl max-h-[95vh] overflow-y-auto" style={{ maxWidth: 'calc(100vw - 1rem)', maxHeight: 'calc(100vh - 1rem)' }}>
        <div className="flex justify-between items-center mb-3 sm:mb-4">
          <h2 className="font-bold text-sm sm:text-lg md:text-2xl pr-2">
            {editAttractionsMode ? 'Add Categories or Tags to Favorites' : 'Choose Categories'}
          </h2>
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
            onClick={editAttractionsMode && categoriesAddedToAttractions.length > 0 ? handleReturnToMainFromEdit : handleMultiCategorySearch}
            disabled={(editAttractionsMode && categoriesAddedToAttractions.length === 0) || (!editAttractionsMode && selectedCategories.length === 0) || loading}
            className={`px-4 py-2 sm:px-8 sm:py-3 rounded-lg font-bold text-sm sm:text-lg transition-all duration-200 ${
              ((editAttractionsMode && categoriesAddedToAttractions.length === 0) || (!editAttractionsMode && selectedCategories.length === 0))
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-blue-600 text-white hover:from-green-600 hover:to-blue-700 shadow-lg'
            }`}
          >
            {loading
              ? (editAttractionsMode ? 'Adding...' : 'Searching...')
              : (editAttractionsMode
                  ? (categoriesAddedToAttractions.length > 0 
                      ? `Added ${categoriesAddedToAttractions.length} Categories`
                      : `Add ${selectedCategories.length} Categories`)
                  : `Find ${selectedCategories.length} Categories`)
            }
          </button>
          {((editAttractionsMode && categoriesAddedToAttractions.length > 0) || (!editAttractionsMode && selectedCategories.length > 0)) && (
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              {editAttractionsMode && categoriesAddedToAttractions.length > 0
                ? `Categories added to Favorites: ${categoriesAddedToAttractions.map(cat => cat.replace(/_/g, ' ')).join(', ')}`
                : `Selected: ${selectedCategories.map(cat => cat.replace(/_/g, ' ')).join(', ')}`
              }
            </p>
          )}
        </div>
        {/* Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 sm:gap-2 md:gap-3">
          {Object.keys(tagGroups).map((category) => {
            const isSelected = selectedCategories.includes(category);
            const isDetailsOpen = selectedCategoryForDetails === category;
            const hasCustomTagSelection = selectedTagsInCategory[category] && 
              selectedTagsInCategory[category].length < tagGroups[category as keyof typeof tagGroups].length;
            const showOrangeBorder = isDetailsOpen || (hasCustomTagSelection && !isDetailsOpen);
            return (
              <div
                key={category}
                className={`relative flex rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } ${
                  showOrangeBorder 
                    ? 'ring-4 ring-orange-400 ring-opacity-70 shadow-lg' 
                    : ''
                }`}
              >
                {/* + sign in edit mode, except for Attractions */}
                {editAttractionsMode && category !== 'Favorites' && (
                  <span className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 z-10 flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-white border border-red-500 sm:border-2 rounded-full shadow text-red-600 text-xs sm:text-sm md:text-base font-bold select-none pointer-events-none">
                    +
                  </span>
                )}
                {/* Left part - Toggle selection (2/3 width) */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex-grow px-1 py-1.5 sm:px-2 sm:py-2 md:px-3 md:py-3 rounded-l-lg font-medium text-[10px] xs:text-xs sm:text-sm transition-all duration-200 leading-tight"
                  disabled={loading}
                  style={{ width: '66.67%', wordBreak: 'break-word', hyphens: 'auto' }}
                >
                  <span className="block">{category.replace(/_/g, ' ')}</span>
                </button>
                {/* Right part - Show details (1/3 width) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    showCategoryDetails(category);
                  }}
                  className="flex-shrink-0 px-1 py-1.5 sm:px-2 sm:py-2 md:px-2 md:py-3 rounded-r-lg text-xs sm:text-sm border-l border-white/20 bg-black/20 hover:bg-black/30 transition-all duration-200 flex items-center justify-center"
                  disabled={loading}
                  style={{ width: '33.33%', minWidth: '32px' }}
                  title={editAttractionsMode ? (category === 'Favorites' ? `View Favorites details` : `Add tags from ${category.replace(/_/g, ' ')}`) : `View ${category.replace(/_/g, ' ')} details`}
                >
                  {editAttractionsMode
                    ? (category === 'Favorites' ? 'ℹ️' : <span className="text-red-600 text-lg font-bold">+</span>)
                    : 'ℹ️'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;
