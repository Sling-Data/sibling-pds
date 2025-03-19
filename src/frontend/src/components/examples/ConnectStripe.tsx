import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../contexts/UserContextOld';
import { useFetch } from '../../hooks/useFetch';
import ConnectApi from '../templates/ConnectApi';

const ConnectStripe: React.FC = () => {
  const location = useLocation();
//   const navigate = useNavigate();
  const { userId, refreshTokenIfExpired } = useUser();
  const [stripeUrl, setStripeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Setup useFetch for getting Stripe connect URL
  const { update: fetchStripeUrl } = useFetch<{ url: string }>(
    null,
    {
      method: 'GET'
    }
  );

  // Fetch Stripe connect URL from the API
  useEffect(() => {
    const getStripeUrl = async () => {
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

        const { data, error: fetchError } = await fetchStripeUrl(
          `${process.env.REACT_APP_API_URL}/api/stripe/create-connect-url?userId=${userIdFromParams}`
        );
        
        if (fetchError) {
          throw new Error(`Failed to fetch Stripe URL: ${fetchError}`);
        }
        
        if (data?.url) {
          setStripeUrl(data.url);
        } else {
          throw new Error('No Stripe URL returned from API');
        }
      } catch (err) {
        console.error('Error fetching Stripe URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch Stripe URL');
      } finally {
        setIsLoading(false);
      }
    };

    getStripeUrl();
  }, [location.search, userId, refreshTokenIfExpired, fetchStripeUrl]);

  // Handle connect button click
  const handleConnect = useCallback(() => {
    if (stripeUrl) {
      window.location.href = stripeUrl;
    }
  }, [stripeUrl]);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    // No additional logic needed here as the ConnectApi component will handle navigation
  }, []);

  return (
    <ConnectApi
      title="Connect Your Stripe Account"
      serviceName="Stripe"
      isLoading={isLoading}
      error={error}
      onConnect={handleConnect}
      onCancel={handleCancel}
      isConnectDisabled={!stripeUrl}
      loadingMessage="Initializing connection to Stripe..."
      connectButtonText="Connect Your Stripe Account"
      redirectPath="/profile"
    />
  );
};

export default ConnectStripe; 