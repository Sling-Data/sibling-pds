import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '../../hooks';
import { useApi } from '../../hooks/useApi';
import ConnectApi from '../templates/ConnectApi';


const ConnectGmail: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useUser();
  const { refreshTokens } = useAuth();
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const popupRef = useRef<Window | null>(null);
  const popupCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Setup useApi for getting Gmail auth URL
  const { request: fetchAuthUrl } = useApi<{ authUrl: string }>();

  // Function to check if popup is closed
  const checkPopupClosed = useCallback(() => {
    if (popupRef.current && popupRef.current.closed) {
      if (popupCheckIntervalRef.current) {
        clearInterval(popupCheckIntervalRef.current);
        popupCheckIntervalRef.current = null;
      }
      // Set error but don't disable the button
      setError('Authentication window was closed');
      setIsLoading(false);
    }
  }, []);

  // Setup message listener for popup communication
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message:', event.data, 'from origin:', event.origin);
      
      // Accept messages from any origin for now, since we're validating the message structure
      // This helps with local development where origins might vary
      
      if (event.data && typeof event.data === 'object') {
        // Handle authentication success
        if (event.data.type === 'gmail-auth-success') {
          console.log('Authentication successful, navigating to profile');
          setIsLoading(false);
          
          // Close popup if it's still open
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
          
          // Clear interval
          if (popupCheckIntervalRef.current) {
            clearInterval(popupCheckIntervalRef.current);
            popupCheckIntervalRef.current = null;
          }
          
          // Navigate back to profile with success status
          navigate('/profile?status=success&message=Gmail connected successfully');
        }
        
        // Handle authentication error
        if (event.data.type === 'gmail-auth-error') {
          console.log('Authentication failed:', event.data.message);
          setError(event.data.message || 'Failed to authenticate with Gmail');
          setIsLoading(false);
          
          // Close popup if it's still open
          if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close();
          }
          
          // Clear interval
          if (popupCheckIntervalRef.current) {
            clearInterval(popupCheckIntervalRef.current);
            popupCheckIntervalRef.current = null;
          }
        }
      }
    };

    // Add event listener
    window.addEventListener('message', handleMessage);

    // Cleanup
    return () => {
      window.removeEventListener('message', handleMessage);
      if (popupCheckIntervalRef.current) {
        clearInterval(popupCheckIntervalRef.current);
      }
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
    };
  }, [navigate]);

  // Function to open the authentication popup
  const openAuthPopup = useCallback((url: string) => {
    // Close existing popup if it's open
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }

    // Clear existing interval
    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current);
    }

    // Calculate popup dimensions
    const w = 600;
    const h = 700;

    // Get the window position, with cross-browser support
    const dualScreenLeft = window.screenLeft !==  undefined ? window.screenLeft : window.screenX;
    const dualScreenTop = window.screenTop !==  undefined   ? window.screenTop  : window.screenY;

    // Get the window dimensions, with fallbacks for various browsers
    const width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : window.screen.width;
    const height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : window.screen.height;

    // Calculate the system zoom level to ensure proper positioning even when browser is zoomed
    const systemZoom = width / window.screen.availWidth;
    // Adjust the position calculations by the zoom factor to center the popup correctly
    let left = (width - w) / 2 / systemZoom + dualScreenLeft
    let top = (height - h) / 2 / systemZoom + dualScreenTop

    if (window.top != null) {
        left = window.top!.outerWidth / 2 + window.top!.screenX - ( w / 2);
        top = window.top!.outerHeight / 2 + window.top!.screenY - ( h / 2);
    }

    // Open the popup
    popupRef.current = window.open(
        url,
        'gmailAuthPopup',
        `width=${w / systemZoom},height=${h / systemZoom},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );

    // Focus the popup
    if (popupRef.current) {
      popupRef.current.focus();
      
      // Set interval to check if popup is closed
      popupCheckIntervalRef.current = setInterval(checkPopupClosed, 1000);
      
      // Keep isLoading true only while waiting for authentication
      // Don't disable the connect button
    } else {
      setError('Failed to open authentication window. Please check your popup blocker settings');
      setIsLoading(false);
    }
  }, [checkPopupClosed]);

  // Fetch Gmail auth URL on component mount
  useEffect(() => {
    const getAuthUrl = async () => {
      if (!userId) {
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

        const { data, error: fetchError } = await fetchAuthUrl(
          `api/gmail/auth-url`,
          {
            method: 'GET',
            params: { popup: 'true' }
          }
        );
        
        if (fetchError) {
          throw new Error(`Failed to fetch Gmail auth URL: ${fetchError}`);
        }
        
        if (data?.authUrl) {
          setAuthUrl(data.authUrl);
          // Automatically open popup once we have the auth URL
          openAuthPopup(data.authUrl);
        } else {
          throw new Error('No auth URL returned from API');
        }
      } catch (err) {
        console.error('Error fetching Gmail auth URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch Gmail auth URL');
      } finally {
        setIsLoading(false);
      }
    };

    getAuthUrl();
  }, [userId, refreshTokens, fetchAuthUrl, openAuthPopup]);

  // Handle connect button click
  const handleConnect = useCallback(() => {
    if (authUrl) {
      openAuthPopup(authUrl);
    }
  }, [authUrl, openAuthPopup]);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    // Close popup if it's open
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close();
    }
    
    // Clear interval
    if (popupCheckIntervalRef.current) {
      clearInterval(popupCheckIntervalRef.current);
    }
  }, []);

  // Handle success navigation
  const handleSuccess = useCallback((message: string) => {
    navigate(`/profile?status=success&message=${encodeURIComponent(message)}`);
  }, [navigate]);

  // Format error message to ensure it has the proper suffix
  const formatErrorMessage = useCallback((error: string) => {
    if (error.includes('Please try connecting to Gmail again')) {
      return error;
    }
    return `${error}. Please try connecting to Gmail again.`;
  }, []);

  return (
    <ConnectApi
      title="Connect Your Gmail Account"
      serviceName="Gmail"
      isLoading={isLoading && !error} // Don't show loading state when there's an error
      error={error}
      onConnect={handleConnect}
      onCancel={handleCancel}
      onSuccess={handleSuccess}
      isConnectDisabled={!authUrl}
      loadingMessage={authUrl ? "Waiting for Gmail authentication..." : "Initializing connection to Gmail..."}
      connectButtonText="Connect Your Gmail Account"
      redirectPath="/profile"
      successMessage="Gmail connected successfully"
      formatErrorMessage={formatErrorMessage}
    />
  );
};

export default ConnectGmail; 