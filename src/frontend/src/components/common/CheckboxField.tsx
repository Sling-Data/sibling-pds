import React from 'react';

export interface CheckboxFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  error?: string;
  touched?: boolean;
  className?: string;
  labelClassName?: string;
  onChange: (checked: boolean) => void;
}

export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  id,
  name,
  label,
  checked,
  error,
  touched,
  className = '',
  labelClassName = '',
  onChange,
  ...rest
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className={`form-group ${className}`}>
      <div className="flex items-center">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={handleChange}
          className={`mr-2 ${error && touched ? 'is-invalid' : ''}`}
          aria-invalid={error && touched ? 'true' : 'false'}
          aria-describedby={error && touched ? `${id}-error` : undefined}
          {...rest}
        />
        <label 
          htmlFor={id}
          className={`cursor-pointer ${labelClassName}`}
        >
          {label}
        </label>
      </div>
      
      {error && touched && (
        <div id={`${id}-error`} className="error-message mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default CheckboxField; 