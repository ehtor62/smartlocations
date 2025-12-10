import React from 'react';

interface CategoryDetailsModalProps {
  visible: boolean;
  categoryName: string;
  tagGroups: Record<string, string[]>;
  selectedTags: string[];
  onToggleTag: (categoryName: string, tag: string) => void;
  onDeselectAll: (categoryName: string) => void;
  onClose: () => void;
  onSelect: () => void;
}

const CategoryDetailsModal: React.FC<CategoryDetailsModalProps> = ({
  visible,
  categoryName,
  tagGroups,
  selectedTags,
  onToggleTag,
  onDeselectAll,
  onClose,
  onSelect,
}) => {
  if (!visible || !categoryName) return null;
  const tags = tagGroups[categoryName] || [];
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1002] p-4" style={{ maxWidth: '100vw', maxHeight: '100vh' }}>
      <div className="backdrop-blur-sm p-3 sm:p-4 rounded-lg shadow-xl w-80 max-w-xs mx-auto max-h-[90vh] overflow-y-auto" style={{ background: 'rgba(220, 252, 231, 0.95)', maxWidth: 'calc(100vw - 2rem)', maxHeight: 'calc(100vh - 2rem)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg sm:text-xl">
            {categoryName.replace(/_/g, ' ')} Details
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={onSelect}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded transition-colors"
            >
              Select
            </button>
            <button 
              onClick={onClose}
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
              onClick={() => onDeselectAll(categoryName)}
              className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-300 transition-colors"
            >
              De-select All
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto bg-gray-50 p-3 rounded border">
            {tags
              .map((tag) => {
                const [key, value] = tag.split(':');
                return { key, value, original: tag };
              })
              .sort((a, b) => a.value.localeCompare(b.value))
              .map((tagObj, index) => {
                const isSelected = selectedTags?.includes(tagObj.original) ?? true;
                return (
                  <div 
                    key={index} 
                    onClick={() => onToggleTag(categoryName, tagObj.original)}
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
              })
            }
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Selected: {selectedTags ? selectedTags.length : tags.length} / Total: {tags.length} tags
          </p>
        </div>
      </div>
    </div>
  );
};

export default CategoryDetailsModal;
