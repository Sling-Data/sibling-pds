import React from 'react';

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
  helpText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  error,
  touched,
  required = false,
  className = '',
  labelClassName = '',
  children,
  helpText,
}) => {
  const showError = error && touched;
  
  return (
    <div className={`form-group ${className}`}>
      <label 
        htmlFor={id} 
        className={labelClassName}
      >
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      
      {children}
      
      {helpText && !showError && (
        <div className="text-sm text-secondary mt-1">{helpText}</div>
      )}
      
      {showError && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
};

export default FormField; 