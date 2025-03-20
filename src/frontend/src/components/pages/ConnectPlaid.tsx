import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import ConnectApi from '../templates/ConnectApi';
import '../../styles/pages/ConnectPlaid.css';

const ConnectPlaid: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userId } = useUser();
  const { refreshTokens } = useAuth();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Setup useApi for getting link token
  const { request: fetchLinkToken } = useApi<{ link_token: string }>();

  // Setup useApi for exchanging public token
  const { request: exchangePublicToken } = useApi<{ success: boolean }>();

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
        const refreshSuccessful = await refreshTokens();
        if (!refreshSuccessful) {
          throw new Error('Authentication failed. Please log in again.');
        }

        const { data, error: fetchError } = await fetchLinkToken(
          `api/plaid/create-link-token`,
          {
            method: 'GET',
            params: { userId: userIdFromParams }
          }
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
  }, [location.search, userId, refreshTokens, fetchLinkToken]);

  // Handle successful Plaid Link connection
  const onSuccess = useCallback(
    async (public_token: string) => {
      try {
        setIsLoading(true);
        
        // Refresh token if needed before making the API call
        const refreshSuccessful = await refreshTokens();
        if (!refreshSuccessful) {
          throw new Error('Authentication failed. Please log in again.');
        }

        // Exchange the public token for an access token
        const { error: exchangeError } = await exchangePublicToken(
          `api/plaid/exchange-public-token`,
          {
            method: 'POST',
            body: {
              public_token,
              userId: userId || ''
            }
          }
        );

        if (exchangeError) {
          throw new Error(`Failed to exchange public token: ${exchangeError}`);
        }

        // Navigate back to profile page with success status
        navigate('/profile?status=success&message=Bank account connected successfully');
      } catch (err) {
        console.error('Error exchanging public token:', err);
        setError(err instanceof Error ? err.message : 'Failed to connect bank account');
        setIsLoading(false);
      }
    },
    [exchangePublicToken, navigate, refreshTokens, userId]
  );

  // Initialize Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess,
    onExit: () => {
      setIsLoading(false);
    },
    onEvent: (eventName, metadata) => {
      console.log('Plaid event:', eventName, metadata);
    },
  });

  // Open Plaid Link automatically when it's ready and we have a token
  useEffect(() => {
    if (ready && linkToken && !error) {
      open();
    }
  }, [ready, linkToken, open, error]);

  // Handle connect button click
  const handleConnect = useCallback(() => {
    if (ready && linkToken) {
      open();
    }
  }, [ready, linkToken, open]);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    navigate('/profile');
  }, [navigate]);

  // Handle success navigation
  const handleSuccess = useCallback((message: string) => {
    navigate(`/profile?status=success&message=${encodeURIComponent(message)}`);
  }, [navigate]);

  // Format error message to ensure it has proper context
  const formatErrorMessage = useCallback((error: string) => {
    if (error.includes('Please try connecting your bank account again')) {
      return error;
    }
    return `${error}. Please try connecting your bank account again.`;
  }, []);

  return (
    <ConnectApi
      title="Connect Your Bank Account"
      serviceName="Plaid"
      isLoading={isLoading}
      error={error}
      onConnect={handleConnect}
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      isConnectDisabled={!linkToken || !ready}
      loadingMessage="Connecting to your bank account..."
      connectButtonText="Connect Your Bank Account"
      redirectPath="/profile"
      successMessage="Bank account connected successfully"
      formatErrorMessage={formatErrorMessage}
    />
  );
};

export default ConnectPlaid;
