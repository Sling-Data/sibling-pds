import React from 'react';
import FormField from './FormField';

export interface RadioOption {
  value: string;
  label: string;
}

export interface RadioGroupProps {
  id: string;
  name: string;
  label: string;
  options: RadioOption[];
  value: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  className?: string;
  groupClassName?: string;
  labelClassName?: string;
  onChange: (value: string) => void;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  id,
  name,
  label,
  options,
  value,
  error,
  touched,
  required = false,
  helpText,
  className = '',
  groupClassName = '',
  labelClassName = '',
  onChange,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <FormField
      id={id}
      label={label}
      error={error}
      touched={touched}
      required={required}
      helpText={helpText}
      className={className}
      labelClassName={labelClassName}
    >
      <div className={`radio-group ${groupClassName}`}>
        {options.map((option) => (
          <label key={option.value} className="flex items-center">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              className={error && touched ? 'is-invalid' : ''}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </FormField>
  );
};

export default RadioGroup; 