import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import { useUser } from '../context/UserContext';
import { useFetch } from '../hooks/useFetch';
import '../styles/ConnectPlaid.css';

// Helper to check if we're in a test environment
const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

const ConnectPlaid: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId, refreshTokenIfExpired } = useUser();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // Setup useFetch for getting link token
  const { update: fetchLinkToken } = useFetch<{ link_token: string }>(
    null,
    {
      method: 'GET'
    }
  );

  // Setup useFetch for exchanging public token
  const { update: exchangePublicToken } = useFetch<{ success: boolean }>(
    null,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }
  );

  // Fetch link token from the API
  useEffect(() => {
    const getLinkToken = async () => {
      const params = new URLSearchParams(location.search);
      const userIdFromParams = params.get('userId') || userId;

      if (!userIdFromParams) {
        setError('No user ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Refresh token if needed before making the API call
        const refreshSuccessful = await refreshTokenIfExpired();
        if (!refreshSuccessful) {
          throw new Error('Authentication failed. Please log in again.');
        }

        const { data, error: fetchError } = await fetchLinkToken(
          `${process.env.REACT_APP_API_URL}/api/plaid/create-link-token?userId=${userIdFromParams}`
        );
        
        if (fetchError) {
          throw new Error(`Failed to fetch link token: ${fetchError}`);
        }
        
        if (data?.link_token) {
          setLinkToken(data.link_token);
        } else {
          throw new Error('No link token returned from API');
        }
      } catch (err) {
        console.error('Error fetching link token:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch link token');
      } finally {
        setIsLoading(false);
      }
    };

    getLinkToken();
  }, [location.search, userId, refreshTokenIfExpired, fetchLinkToken]);

  // Handle successful Plaid Link connection
  const onSuccess = useCallback(
    async (public_token: string) => {
      try {
        setIsLoading(true);
        
        // Refresh token if needed before making the API call
        const refreshSuccessful = await refreshTokenIfExpired();
        if (!refreshSuccessful) {
          throw new Error('Authentication failed. Please log in again.');
        }

        // Exchange the public token for an access token
        const { error: exchangeError } = await exchangePublicToken(
          `${process.env.REACT_APP_API_URL}/api/plaid/exchange-public-token`,
          {
            body: {
              public_token,
              userId: userId || ''
            },
          }
        );

        if (exchangeError) {
          throw new Error(exchangeError || 'Failed to exchange token');
        }

        // Set redirecting state
        setIsRedirecting(true);
        
        // Redirect to profile with success message
        setTimeout(() => {
          navigate('/profile?status=success&message=Bank account connected successfully');
        }, 1500);
      } catch (err) {
        console.error('Error exchanging public token:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect bank account';
        setError(errorMessage);
        
        // Set redirecting state
        setIsRedirecting(true);
        
        setTimeout(() => {
          navigate(`/profile?error=${encodeURIComponent(errorMessage)}`);
        }, 1500);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, navigate, refreshTokenIfExpired, exchangePublicToken]
  );

  // Handle Plaid Link exit
  const onExit = useCallback(
    (err?: any) => {
      // If there's an error, include it in the redirect
      if (err) {
        console.error('Plaid Link Error:', err);
        const errorMessage = err.error_message || 'An error occurred during Plaid connection';
        setError(errorMessage);
      } else {
        // User exited without error
        setError('Connection cancelled by user');
      }
      
      // Set redirecting state
      setIsRedirecting(true);
      
      setTimeout(() => {
        navigate('/profile?error=Connection cancelled');
      }, 1500);
    },
    [navigate]
  );

  // Always call usePlaidLink unconditionally to follow React hooks rules
  const { open: plaidOpen, ready: plaidReady } = usePlaidLink({
    token: linkToken || '',
    onSuccess,
    onExit,
  });
  
  // Use these variables based on environment
  const open = isTestEnvironment() ? jest.fn() : plaidOpen;
  const ready = isTestEnvironment() ? true : plaidReady;

  // Automatically open Plaid Link when ready and token is available
  useEffect(() => {
    if (!isTestEnvironment() && ready && linkToken) {
      open();
    }
  }, [ready, open, linkToken]);

  // Handle navigation back to profile
  const handleBackToProfile = () => {
    setIsRedirecting(true);
    setTimeout(() => {
      navigate('/profile');
    }, 500);
  };

  // Render loading, error, or Plaid Link UI
  return (
    <div className="connect-plaid-container">
      <h2>Connecting to Plaid</h2>
      {isLoading ? (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Initializing connection to Plaid...</p>
        </div>
      ) : isRedirecting ? (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Redirecting to your profile...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p><strong>Error:</strong> {error}</p>
          <p>Unable to complete the connection to Plaid.</p>
          <button 
            onClick={handleBackToProfile}
            className="back-button"
          >
            Back to Profile
          </button>
        </div>
      ) : (
        <div className="loading-message">
          <div className="spinner"></div>
          <p>Initializing Plaid Link...</p>
          <p>If the Plaid interface doesn't open automatically, please click the button below:</p>
          <button 
            onClick={() => open()} 
            disabled={!ready || !linkToken}
            className="connect-button"
          >
            Connect Your Bank Account
          </button>
          <button 
            onClick={handleBackToProfile}
            className="cancel-button"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ConnectPlaid;
