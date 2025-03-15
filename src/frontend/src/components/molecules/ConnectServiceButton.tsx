import React from 'react';
import { Button } from '../atoms/Button';
import { ConnectServiceButtonProps } from '../../types';

/**
 * ConnectServiceButton component for connecting external services
 */
export const ConnectServiceButton: React.FC<ConnectServiceButtonProps> = ({
  serviceName,
  serviceIcon,
  onClick,
  isConnected = false,
  isLoading = false,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center">
        <Button
          onClick={onClick}
          disabled={isLoading || isConnected}
          isLoading={isLoading}
          variant={isConnected ? 'success' : 'primary'}
        >
          {serviceIcon && <span className="mr-2">{serviceIcon}</span>}
          {isConnected ? `${serviceName} Connected` : `Connect ${serviceName}`}
        </Button>
      </div>
      
      {isConnected && (
        <span className="text-sm text-green-600 mt-2 flex items-center">
          <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Connected
        </span>
      )}
    </div>
  );
}; 