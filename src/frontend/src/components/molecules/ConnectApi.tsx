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
  isConnectDisabled?: boolean;
  loadingMessage?: string;
  connectButtonText?: string;
  cancelButtonText?: string;
  redirectPath?: string;
  showSpinner?: boolean;
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
  showSpinner = true
}) => {
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

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
      {isLoading ? (
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
          {error && (
            <div className="error-message">
              <p><strong>Warning:</strong> {error}</p>
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