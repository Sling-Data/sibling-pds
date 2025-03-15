import React from 'react';
import { CheckboxGroupProps } from '../../types';

/**
 * CheckboxGroup component for multiple selections
 */
export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  name,
  label,
  options,
  selectedValues,
  onChange,
  disabled = false,
  error,
  required = false,
  className = '',
}) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(val => val !== value));
    }
  };

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <div className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </div>
      )}
      
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${name}-${option.value}`}
              name={name}
              type="checkbox"
              value={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={handleCheckboxChange}
              disabled={disabled}
              className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            />
            <label
              htmlFor={`${name}-${option.value}`}
              className={`ml-3 block text-sm font-medium ${
                disabled ? 'text-gray-400' : 'text-gray-700'
              }`}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 