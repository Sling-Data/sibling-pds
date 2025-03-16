import React from 'react';
import { TextInputProps } from '../../types';
import './TextInput.css';

/**
 * TextInput component for form inputs
 */
export const TextInput: React.FC<TextInputProps> = ({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  error,
  label,
  className = '',
}) => {
  const inputClasses = [
    'text-input',
    error ? 'text-input-error' : '',
    disabled ? 'text-input-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="text-input-container">
      {label && (
        <label 
          htmlFor={id} 
          className="text-input-label"
        >
          {label}
          {required && <span className="text-input-required">*</span>}
        </label>
      )}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={inputClasses}
      />
      {error && (
        <p className="text-input-error-message">{error}</p>
      )}
    </div>
  );
}; 