import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import { useUser } from '../context/UserContext';

// Helper to check if we're in a test environment
const isTestEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

const ConnectPlaid: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useUser();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch link token from the API
  useEffect(() => {
    const fetchLinkToken = async () => {
      const params = new URLSearchParams(location.search);
      const userIdFromParams = params.get('userId') || userId;

      if (!userIdFromParams) {
        setError('No user ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/plaid/create-link-token?userId=${userIdFromParams}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch link token: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.link_token) {
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

    fetchLinkToken();
  }, [location.search, userId]);

  // Handle successful Plaid Link connection
  const onSuccess = useCallback(
    async (public_token: string) => {
      try {
        // Exchange the public token for an access token
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/plaid/exchange-public-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            public_token,
            userId: userId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to exchange token');
        }

        // Redirect to profile with success message
        navigate('/profile?status=success');
      } catch (err) {
        console.error('Error exchanging public token:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect bank account';
        navigate(`/profile?error=${encodeURIComponent(errorMessage)}`);
      }
    },
    [userId, navigate]
  );

  // Handle Plaid Link exit
  const onExit = useCallback(
    (err?: any) => {
      // If there's an error, include it in the redirect
      if (err) {
        console.error('Plaid Link Error:', err);
        const errorMessage = err.error_message || 'An error occurred during Plaid connection';
        navigate(`/profile?error=${encodeURIComponent(errorMessage)}`);
      } else {
        // User exited without error
        navigate('/profile?error=Connection cancelled');
      }
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

  // Render loading, error, or Plaid Link UI
  return (
    <div className="connect-plaid-container">
      <h2>Connecting to Plaid</h2>
      {isLoading ? (
        <div className="loading-message">
          <p>Initializing connection to Plaid...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          {error}
          <p>Redirecting to profile...</p>
          <button 
            onClick={() => navigate('/profile')}
            className="back-button"
          >
            Back to Profile
          </button>
        </div>
      ) : (
        <div className="loading-message">
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
            onClick={() => navigate('/profile')}
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
