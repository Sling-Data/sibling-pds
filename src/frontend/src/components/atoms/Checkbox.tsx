import React from 'react';
import { CheckboxProps } from '../../types';

/**
 * Checkbox component for form inputs
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  label,
  checked,
  onChange,
  disabled = false,
  error,
  className = '',
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
          error ? 'border-red-500' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      />
      <label 
        htmlFor={id} 
        className={`ml-2 font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'} ${
          error ? 'text-red-500' : ''
        }`}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 