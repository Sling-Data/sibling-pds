import { useState, useEffect, useCallback } from "react";

interface FetchResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refetch: () => Promise<void>;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Cache with 5-minute expiry
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds
export const cache = new Map<string, CacheEntry<any>>();

export const clearCache = () => {
  cache.clear();
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string): Promise<Response> => {
  let attempt = 1;
  const maxAttempts = 3;

  while (attempt <= maxAttempts) {
    console.log(`Attempting fetch for ${url} (attempt ${attempt})`);
    try {
      const response = await fetch(url);

      // Check for server errors (5xx) or rate limiting (429)
      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxAttempts) {
          const delayTime = response.status === 429 ? 1000 : 100 * attempt;
          console.log(
            `Retrying after ${delayTime}ms due to status ${response.status}`
          );
          await delay(delayTime);
          attempt++;
          continue;
        }
      }

      console.log("Fetch successful");
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
  deps: any = undefined
): FetchResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);

  const fetchData = useCallback(
    async (skipCache = false) => {
      if (!url) {
        setData(null);
        setLoading(false);
        setError(null);
        setFromCache(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Check cache first unless skipCache is true
      if (!skipCache) {
        const cachedEntry = cache.get(url);
        if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_EXPIRY) {
          console.log(`Cache hit for ${url}`);
          setData(cachedEntry.data);
          setLoading(false);
          setFromCache(true);
          return;
        }
      }

      console.log(`Cache miss for ${url}`);
      setFromCache(false);

      try {
        const response = await fetchWithRetry(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        console.log(`Updating cache for ${url}`);
        cache.set(url, { data: jsonData, timestamp: Date.now() });
        setData(jsonData);
      } catch (err) {
        console.log(`Error: ${err.message}`);
        if (err instanceof SyntaxError) {
          setError("Invalid JSON response from server");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

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
    refetch: () => fetchData(true),
  };
}
