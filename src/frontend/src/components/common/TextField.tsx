import React from 'react';
import FormField from './FormField';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  helpText?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  id,
  name,
  label,
  error,
  touched,
  required = false,
  helpText,
  className = '',
  inputClassName = '',
  labelClassName = '',
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
      <input
        id={id}
        name={name}
        className={`form-control ${error && touched ? 'is-invalid' : ''} ${inputClassName}`}
        aria-invalid={error && touched ? 'true' : 'false'}
        aria-describedby={error && touched ? `${id}-error` : undefined}
        {...rest}
      />
    </FormField>
  );
};

export default TextField; 