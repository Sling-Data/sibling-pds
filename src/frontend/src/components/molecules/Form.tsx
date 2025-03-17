import React from 'react';
import { Button } from '../atoms/Button';
import { ErrorIcon } from '../atoms/Icons';
import './Form.css';

interface FormProps {
  onSubmit: (e: React.FormEvent) => void;
  title?: string;
  submitText?: string;
  isSubmitting?: boolean;
  error?: string | null;
  children: React.ReactNode;
  noValidate?: boolean;
  hideSubmitButton?: boolean;
}

/**
 * Form component for handling form submissions
 */
export const Form: React.FC<FormProps> = ({
  onSubmit,
  title,
  submitText = 'Submit',
  isSubmitting = false,
  error,
  children,
  noValidate = true,
  hideSubmitButton = false
}) => {
  return (
    <div className="form-wrapper">
      {title && <h2 className="form-title">{title}</h2>}
      
      <form onSubmit={onSubmit} className="form" noValidate={noValidate}>
        {children}
        
        {error && (
          <div className="error-container">
            <div className="error-message">
              <ErrorIcon className="error-icon" />
              {error}
            </div>
          </div>
        )}
        
        {!hideSubmitButton && (
          <div className="form-actions">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              isLoading={isSubmitting}
              variant="primary"
              fullWidth
            >
              {submitText}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}; 