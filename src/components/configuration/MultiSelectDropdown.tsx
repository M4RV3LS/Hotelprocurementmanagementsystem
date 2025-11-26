import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectDropdownProps {
  options: string[];
  selectedValues: string[];
  onChange: (selected: string[]) => void;
  label: string;
  placeholder?: string;
  error?: string;
}

export default function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  label,
  placeholder = 'Select options',
  error
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter(v => v !== option));
    } else {
      onChange([...selectedValues, option]);
    }
  };

  const handleSelectAll = () => {
    onChange(options);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    } else if (selectedValues.length === 1) {
      return selectedValues[0];
    } else if (selectedValues.length === 2) {
      return `${selectedValues[0]}, ${selectedValues[1]}`;
    } else {
      return `${selectedValues[0]}, +${selectedValues.length - 1} more`;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-gray-700 mb-2">{label}</label>
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border rounded-lg text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#ec2224] ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${selectedValues.length === 0 ? 'text-gray-400' : 'text-gray-900'}`}
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option}
                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 text-[#ec2224] border-gray-300 rounded focus:ring-[#ec2224] cursor-pointer"
                />
                <span className="ml-3 text-gray-900">{option}</span>
              </label>
            ))}
            {options.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                No options available
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {options.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2 flex justify-between">
              <button
                type="button"
                onClick={handleClearAll}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-[#ec2224] hover:text-[#d11f21] transition-colors"
              >
                Select All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
