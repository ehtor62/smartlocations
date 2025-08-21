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
}) => {
  if (!visible) return null;
  return (
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
  );
};

export default CategoryModal;
