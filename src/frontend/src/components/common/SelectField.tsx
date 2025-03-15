import React from 'react';
import FormField from './FormField';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  id: string;
  name: string;
  label: string;
  options: SelectOption[];
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  className?: string;
  selectClassName?: string;
  labelClassName?: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  id,
  name,
  label,
  options,
  error,
  touched,
  required = false,
  helpText,
  placeholder = 'Select an option',
  className = '',
  selectClassName = '',
  labelClassName = '',
  onChange,
  ...rest
}) => {
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
      <select
        id={id}
        name={name}
        className={`form-control ${error && touched ? 'is-invalid' : ''} ${selectClassName}`}
        onChange={onChange}
        aria-invalid={error && touched ? 'true' : 'false'}
        aria-describedby={error && touched ? `${id}-error` : undefined}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

export default SelectField; 