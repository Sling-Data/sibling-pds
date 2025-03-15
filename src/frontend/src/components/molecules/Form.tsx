import React from 'react';
import { Button } from '../atoms/Button';

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
    <form onSubmit={onSubmit} className="space-y-6">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {children}
      
      <div className="pt-4">
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