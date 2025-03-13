import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  getAccessToken,
  getRefreshToken,
  shouldRefresh,
  storeTokens,
} from "../utils/TokenManager";

interface FetchResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refetch: () => Promise<void>;
  update: (overrideUrl?: string | null, overrideConfig?: FetchConfig) => Promise<{ data: T | null; error: string | null }>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
export const cache = new Map<string, CacheEntry<any>>();

export const clearCache = () => {
  cache.clear();
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FetchConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  accessToken?: string;
  retryOnAuth?: boolean;
  skipAuth?: boolean;
  skipCache?: boolean;
  cacheResult?: boolean;
}

const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (data.accessToken && data.refreshToken) {
      storeTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

const fetchWithRetry = async (url: string, config: FetchConfig = {}): Promise<Response> => {
  let attempt = 1;
  const maxAttempts = 3;
  let authRetried = false;

  const fetchOptions: RequestInit = {
    method: config.method || "GET",
    headers: {
      ...config.headers,
    },
  };

  if (!config.skipAuth) {
    const token = config.accessToken || getAccessToken();
    if (token) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  if (config.body) {
    if (typeof config.body === "object") {
      fetchOptions.body = JSON.stringify(config.body);
      fetchOptions.headers = {
        ...fetchOptions.headers,
        "Content-Type": "application/json",
      };
    } else {
      fetchOptions.body = config.body;
    }
  }

  let finalUrl = url;
  if (config.params && Object.keys(config.params).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(config.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    finalUrl = `${url}${url.includes("?") ? "&" : "?"}${queryParams.toString()}`;
  }

  while (attempt <= maxAttempts) {
    console.log(`Attempting fetch for ${finalUrl} (attempt ${attempt})`);
    try {
      if (!config.skipAuth && shouldRefresh() && !authRetried) {
        console.log("Token needs refresh, attempting refresh before request");
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          const newToken = getAccessToken();
          if (newToken) {
            fetchOptions.headers = {
              ...fetchOptions.headers,
              Authorization: `Bearer ${newToken}`,
            };
            authRetried = true;
          }
        }
      }

      const response = await fetch(finalUrl, fetchOptions);

      if (response.status === 401 && config.retryOnAuth && !authRetried) {
        console.log("Received 401, attempting to refresh token");
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          const newToken = getAccessToken();
          if (newToken) {
            fetchOptions.headers = {
              ...fetchOptions.headers,
              Authorization: `Bearer ${newToken}`,
            };
            authRetried = true;
            console.log("Token refreshed, retrying request");
            continue; // Retry with new token
          }
        }
      }

      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxAttempts) {
          const delayTime = response.status === 429 ? 1000 : 100 * attempt;
          console.log(`Retrying after ${delayTime}ms due to status ${response.status}`);
          await delay(delayTime);
          attempt++;
          continue;
        }
      }

      return response;
    } catch (err) {
      if (err instanceof TypeError && attempt < maxAttempts) {
        console.log(`Network error, retrying (attempt ${attempt})`);
        await delay(100 * attempt);
        attempt++;
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retry attempts reached");
};

export function useFetch<T>(
  url: string | null,
  config: FetchConfig = {},
  deps: any = undefined
): FetchResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);

  // We need to memoize the config to ensure consistent behavior
  // The JSON.stringify is necessary to detect changes in the config object
  const configString = JSON.stringify(config);
  const memoizedConfig = useMemo(() => JSON.parse(configString), [configString]);

  const fetchData = useCallback(
    async (
      overrideUrl?: string | null,
      overrideConfig?: FetchConfig
    ): Promise<{ data: T | null; error: string | null }> => {
      setLoading(true);
      setError(null);

      const targetUrl = overrideUrl ?? url;
      if (!targetUrl) {
        setLoading(false);
        return { data: null, error: null };
      }

      const finalConfig = {
        ...memoizedConfig,
        ...overrideConfig,
      };

      // Prepare cache key - include relevant parts of config that affect the response
      const cacheKey = `${targetUrl}${finalConfig.params ? JSON.stringify(finalConfig.params) : ""}${finalConfig.method || "GET"}`;

      // Check cache first unless skipCache is true or not a GET request
      if (!finalConfig.skipCache && (!finalConfig.method || finalConfig.method === "GET")) {
        const cachedEntry = cache.get(cacheKey);
        if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_EXPIRY) {
          console.log(`Cache hit for ${cacheKey}`);
          setData(cachedEntry.data);
          setLoading(false);
          setFromCache(true);
          return { data: cachedEntry.data, error: null };
        }
      }

      console.log(`Cache miss for ${cacheKey}`);
      setFromCache(false);

      try {
        const response = await fetchWithRetry(targetUrl, finalConfig);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let jsonData;
        try {
          jsonData = await response.json();
        } catch (jsonError) {
          if (jsonError instanceof SyntaxError) {
            throw new Error('Invalid JSON response from server');
          }
          throw jsonError;
        }

        // Only cache GET requests or if cacheResult is true
        if ((!finalConfig.method || finalConfig.method === "GET" || finalConfig.cacheResult)) {
          console.log(`Updating cache for ${cacheKey}`);
          cache.set(cacheKey, { data: jsonData, timestamp: Date.now() });
        }

        setData(jsonData);
        return { data: jsonData, error: null };
      } catch (err) {
        console.error(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return { data: null, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [url, memoizedConfig]
  );

  const refetchData = useCallback(async () => {
    // Always skip cache when refetching
    await fetchData(undefined, { ...memoizedConfig, skipCache: true });
  }, [fetchData, memoizedConfig]);

  useEffect(() => {
    let ignore = false;

    const doFetch = async () => {
      if (!ignore) {
        await fetchData();
      }
    };

    doFetch();

    return () => {
      ignore = true;
    };
  }, [fetchData, deps]);

  return {
    data,
    loading,
    error,
    fromCache,
    refetch: refetchData,
    update: fetchData,
  };
}
