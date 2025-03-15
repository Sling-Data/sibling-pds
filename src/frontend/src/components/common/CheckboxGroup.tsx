import React from 'react';
import FormField from './FormField';

export interface CheckboxOption {
  value: string;
  label: string;
}

export interface CheckboxGroupProps {
  id: string;
  name: string;
  label: string;
  options: CheckboxOption[];
  selectedValues: string[];
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  className?: string;
  groupClassName?: string;
  labelClassName?: string;
  onChange: (values: string[]) => void;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  id,
  name,
  label,
  options,
  selectedValues,
  error,
  touched,
  required = false,
  helpText,
  className = '',
  groupClassName = '',
  labelClassName = '',
  onChange,
}) => {
  const handleChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(v => v !== value));
    }
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
      <div className={`checkbox-group ${groupClassName}`}>
        {options.map((option) => (
          <label key={option.value} className="flex items-center">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              checked={selectedValues.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              className={error && touched ? 'is-invalid' : ''}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </FormField>
  );
};

export default CheckboxGroup; 