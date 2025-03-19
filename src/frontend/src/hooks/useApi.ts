import { useState, useCallback, useEffect } from "react";
import {
  getAccessToken,
  getRefreshToken,
  shouldRefresh,
  storeTokens,
} from "../utils/TokenManager";
import { useNotificationContext } from "../contexts";
import { ApiResponse } from "../types";

// Cache management
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = new Map<string, CacheEntry<any>>();

export const clearApiCache = () => {
  cache.clear();
};

// Types
export interface ApiConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  requiresAuth?: boolean;
  skipCache?: boolean;
  cacheResult?: boolean;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  successMessage?: string;
  retryCount?: number;
  retryDelay?: number;
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  fromCache: boolean;
}

export interface ApiResult<T> extends ApiState<T> {
  refetch: () => Promise<ApiResponse<T>>;
  request: <R = T>(url: string, config?: ApiConfig) => Promise<ApiResponse<R>>;
}

// Helper function for delay in retries
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A hook for making API requests with advanced features:
 * - Loading, error, and success states
 * - Token refresh and authentication
 * - Caching
 * - Retry logic
 * - Notifications
 */
export function useApi<T = any>(
  initialUrl?: string,
  initialConfig?: ApiConfig
): ApiResult<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: initialUrl !== undefined, // Start loading if URL is provided
    error: null,
    fromCache: false,
  });

  const { addNotification } = useNotificationContext();

  // Function to refresh the auth token
  const refreshAuthToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      if (data.token && data.refreshToken) {
        storeTokens({
          token: data.token,
          refreshToken: data.refreshToken,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  }, []);

  // Check cache for a valid entry
  const getCachedData = useCallback(<R>(url: string): R | null => {
    const cacheKey = url;
    const cachedEntry = cache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_EXPIRY) {
      return cachedEntry.data as R;
    }
    return null;
  }, []);

  // Save data to cache
  const saveCacheData = useCallback(<R>(url: string, data: R): void => {
    const cacheKey = url;
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }, []);

  // Function to make an API request
  const requestApi = useCallback(
    async <R = T>(
      url: string,
      config: ApiConfig = {}
    ): Promise<ApiResponse<R>> => {
      const {
        method = "GET",
        body,
        headers = {},
        params,
        requiresAuth = true,
        skipCache = false,
        cacheResult = method === "GET",
        showSuccessNotification = false,
        showErrorNotification = true,
        successMessage = "Operation completed successfully",
        retryCount = 3,
        retryDelay = 300,
      } = config;

      // Build the full URL with query parameters
      let fullUrl = `${process.env.REACT_APP_API_URL}${url}`;
      if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          queryParams.append(key, value);
        });
        fullUrl += `?${queryParams.toString()}`;
      }

      // For GET requests, check the cache first
      if (method === "GET" && !skipCache) {
        const cachedData = getCachedData<R>(fullUrl);
        if (cachedData) {
          setState((prev) => ({
            ...prev,
            data: cachedData as unknown as T,
            loading: false,
            fromCache: true,
          }));
          return { data: cachedData, error: null };
        }
      }

      // Mark as loading
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        fromCache: false,
      }));

      // Start making the request
      try {
        // Handle authentication
        if (requiresAuth) {
          const token = getAccessToken();

          if (!token) {
            throw new Error("No authentication token found");
          }

          if (shouldRefresh()) {
            const refreshed = await refreshAuthToken();
            if (!refreshed) {
              throw new Error("Authentication expired. Please log in again.");
            }
          }

          // Add the Authorization header
          headers.Authorization = `Bearer ${getAccessToken()}`;
        }

        // Add Content-Type header if not present and we have a body
        if (body && !headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }

        // Prepare fetch options
        const fetchOptions: RequestInit = {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        };

        // Make the request with retry logic
        let response: Response | null = null;
        let attempt = 0;
        let lastError: Error | null = null;

        while (attempt < retryCount) {
          try {
            response = await fetch(fullUrl, fetchOptions);

            // Handle 401 Unauthorized - attempt to refresh token and retry
            if (response.status === 401 && requiresAuth && attempt === 0) {
              const refreshed = await refreshAuthToken();
              if (refreshed) {
                // Update authorization header with new token
                fetchOptions.headers = {
                  ...fetchOptions.headers,
                  Authorization: `Bearer ${getAccessToken()}`,
                };
                // Reset attempt to try again with new token
                attempt = 0;
                continue;
              }
            }

            // Break if we got a successful response
            if (response.ok) {
              break;
            }

            // For other errors, throw to retry
            throw new Error(
              `API error: ${response.status} ${response.statusText}`
            );
          } catch (error) {
            lastError =
              error instanceof Error
                ? error
                : new Error("Unknown error occurred");

            // If network error or 5xx server error, retry
            if (
              error instanceof TypeError || // Network error
              (response && response.status >= 500) // Server error
            ) {
              attempt++;
              if (attempt < retryCount) {
                await delay(retryDelay * Math.pow(2, attempt - 1)); // Exponential backoff
                continue;
              }
            } else {
              // For other types of errors, don't retry
              break;
            }
          }
        }

        // If we exhausted all retries or had an error
        if (!response || !response.ok) {
          throw lastError || new Error("Failed to fetch after retry attempts");
        }

        // Parse response data
        const data = await response.json();

        // Update state with success
        setState((prev) => ({
          ...prev,
          data: data as unknown as T,
          loading: false,
          error: null,
          fromCache: false,
        }));

        // Show success notification if requested
        if (showSuccessNotification) {
          addNotification(successMessage, "success");
        }

        // Cache the result if it's a GET and caching is enabled
        if (method === "GET" && cacheResult) {
          saveCacheData(fullUrl, data);
        }

        return { data, error: null };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";

        // Update state with error
        setState((prev) => ({
          ...prev,
          error: error as Error,
          loading: false,
          fromCache: false,
        }));

        // Show error notification if requested
        if (showErrorNotification) {
          addNotification(errorMessage, "error");
        }

        return { data: null, error: errorMessage };
      }
    },
    [addNotification, getCachedData, refreshAuthToken, saveCacheData]
  );

  // Function to refetch data with the initial URL and config
  const refetch = useCallback(async (): Promise<ApiResponse<T>> => {
    if (!initialUrl) {
      return { data: null, error: "No URL provided for refetch" };
    }
    return requestApi<T>(initialUrl, initialConfig);
  }, [initialUrl, initialConfig, requestApi]);

  // Initial fetch if URL is provided
  useEffect(() => {
    if (initialUrl) {
      refetch().catch(console.error);
    }
  }, [initialUrl, refetch]);

  return {
    ...state,
    refetch,
    request: requestApi,
  };
}
