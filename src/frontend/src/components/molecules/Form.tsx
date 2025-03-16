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
}) => {
  return (
    <form onSubmit={onSubmit} className="form">
      {title && (
        <h2 className="form-title">{title}</h2>
      )}
      
      {error && (
        <div className="form-error">
          <div className="form-error-content">
            <div className="form-error-icon-wrapper">
              <ErrorIcon className="form-error-icon" />
            </div>
            <div className="form-error-message">
              <p className="form-error-text">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {children}
      
      <div className="form-submit">
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
    </form>
  );
}; 