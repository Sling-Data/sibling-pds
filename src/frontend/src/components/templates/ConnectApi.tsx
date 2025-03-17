import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/ConnectApi.css';

export interface ConnectApiProps {
  title: string;
  serviceName: string;
  isLoading: boolean;
  error: string | null;
  onConnect: () => void;
  onCancel: () => void;
  onSuccess?: (message: string) => void;
  isConnectDisabled?: boolean;
  loadingMessage?: string;
  connectButtonText?: string;
  cancelButtonText?: string;
  redirectPath?: string;
  showSpinner?: boolean;
  successMessage?: string;
  formatErrorMessage?: (error: string) => string;
}

const ConnectApi: React.FC<ConnectApiProps> = ({
  title,
  serviceName,
  isLoading,
  error,
  onConnect,
  onCancel,
  isConnectDisabled = false,
  loadingMessage = `Initializing connection to ${serviceName}...`,
  connectButtonText = `Connect to ${serviceName}`,
  cancelButtonText = 'Cancel',
  redirectPath = '/profile',
  showSpinner = true,
  formatErrorMessage
}) => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // Format error message if needed
  const formattedError = formatErrorMessage && error ? formatErrorMessage(error) : error;

  // Handle navigation back to specified path
  const handleCancel = useCallback(() => {
    onCancel();
    setIsRedirecting(true);
    setTimeout(() => {
      navigate(redirectPath);
    }, 500);
  }, [navigate, onCancel, redirectPath]);

  return (
    <div className="connect-api-container">
      <h2>{title}</h2>
      {isLoading && !formattedError ? (
        <div className="loading-message">
          {showSpinner && <div className="spinner"></div>}
          <p>{loadingMessage}</p>
        </div>
      ) : isRedirecting ? (
        <div className="loading-message">
          {showSpinner && <div className="spinner"></div>}
          <p>Redirecting to your profile...</p>
        </div>
      ) : (
        <div className="connect-content">
          {showSpinner && <div className="spinner"></div>}
          {formattedError && (
            <div className="error-message">
              <p><strong>Warning:</strong> {formattedError}</p>
            </div>
          )}
          
          <p>Ready to connect to {serviceName}.</p>
          <p>Click the button below to establish the connection:</p>
          <button 
            onClick={onConnect} 
            disabled={isConnectDisabled}
            className="connect-button"
          >
            {connectButtonText}
          </button>
          <button 
            onClick={handleCancel}
            className="cancel-button"
          >
            {cancelButtonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectApi; 