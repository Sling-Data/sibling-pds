import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import { useUser } from '../context/UserContext';
import { useFetch } from '../hooks/useFetch';
import ConnectApi from './molecules/ConnectApi';

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

        // Redirect to profile with success message
        navigate('/profile?status=success&message=Bank account connected successfully');
      } catch (err) {
        console.error('Error exchanging public token:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to connect bank account';
        setError(errorMessage);
        setIsLoading(false);
      }
    },
    [userId, navigate, refreshTokenIfExpired, exchangePublicToken]
  );

  // Handle Plaid Link exit
  const onExit = useCallback(
    (err?: any) => {
      // If there's an error, include it in the error state
      if (err) {
        console.error('Plaid Link Error:', err);
        const errorMessage = err.error_message || 'An error occurred during Plaid connection';
        setError(errorMessage);
      } else {
        // User exited without error
        setError('Connection cancelled by user');
      }
      
      // Don't navigate away, just update the error state and keep the button visible
      setIsLoading(false);
    },
    []
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
    if (!isTestEnvironment() && ready && linkToken && !error) {
      open();
    }
  }, [ready, open, linkToken, error]);

  // Handle connect button click
  const handleConnect = useCallback(() => {
    open();
  }, [open]);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    // No additional cleanup needed
  }, []);

  // Handle success navigation
  const handleSuccess = useCallback((message: string) => {
    navigate(`/profile?status=success&message=${encodeURIComponent(message)}`);
  }, [navigate]);

  // Format error message to ensure it has the proper suffix
  const formatErrorMessage = useCallback((error: string) => {
    if (error.includes('Please try connecting to Plaid again')) {
      return error;
    }
    return `${error}. Please try connecting to Plaid again.`;
  }, []);

  return (
    <ConnectApi
      title="Connect Your Bank Account"
      serviceName="Plaid"
      isLoading={isLoading && !error} // Don't show loading state when there's an error
      error={error}
      onConnect={handleConnect}
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      isConnectDisabled={!ready || !linkToken}
      loadingMessage={linkToken ? "Initializing Plaid Link..." : "Initializing connection to Plaid..."}
      connectButtonText="Connect Your Bank Account"
      redirectPath="/profile"
      successMessage="Bank account connected successfully"
      formatErrorMessage={formatErrorMessage}
    />
  );
};

export default ConnectPlaid;
