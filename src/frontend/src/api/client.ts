import { getAccessToken } from "../utils/TokenManager";

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  skipAuth?: boolean;
  skipCache?: boolean;
  retryOnAuth?: boolean;
  method?: "GET" | "POST" | "PUT" | "DELETE";
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// Cache implementation
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number }>();

export const clearCache = (): void => {
  cache.clear();
};

// Helper to refresh the token
const refreshToken = async (): Promise<boolean> => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    const response = await window.fetch(
      `${process.env.REACT_APP_API_URL}/auth/refresh-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );

    if (!response.ok) return false;

    const data = await response.json();
    if (data.accessToken && data.refreshToken) {
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return false;
  }
};

// Helper to build URL with query parameters
const buildUrl = (
  url: string,
  params?: Record<string, string | number | boolean>
): string => {
  if (!params) return url;

  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });

  return `${url}${url.includes("?") ? "&" : "?"}${queryParams.toString()}`;
};

// Helper to handle the fetch operation with retry logic
const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  config: RequestConfig = {}
): Promise<Response> => {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      // Add auth header if needed
      if (!config.skipAuth) {
        const token = getAccessToken();
        if (token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          };
        }
      }

      // Execute fetch
      const response = await window.fetch(url, options);

      // Handle auth errors
      if (
        response.status === 401 &&
        config.retryOnAuth !== false &&
        attempts < maxAttempts - 1
      ) {
        const refreshed = await refreshToken();
        if (refreshed) {
          attempts++;
          continue;
        }
      }

      return response;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) throw error;
      // Wait before retrying (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, attempts))
      );
    }
  }

  throw new Error("Maximum retry attempts reached");
};

// Process the response
const processResponse = async <T>(
  response: Response
): Promise<ApiResponse<T>> => {
  const status = response.status;

  try {
    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: data.message || data.error || "An error occurred",
        status,
      };
    }

    return {
      data,
      error: null,
      status,
    };
  } catch (error) {
    return {
      data: null,
      error: response.ok
        ? "Invalid JSON response"
        : `Error: ${response.statusText}`,
      status,
    };
  }
};

// Check and use cache if available
const checkCache = <T>(
  url: string,
  config: RequestConfig
): ApiResponse<T> | null => {
  if (config.skipCache) return null;

  const cacheKey = url;
  const cachedData = cache.get(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
    return {
      data: cachedData.data,
      error: null,
      status: 200,
    };
  }

  return null;
};

// Update cache with new data
const updateCache = <T>(url: string, data: T, config: RequestConfig): void => {
  if (config.skipCache) return;

  const cacheKey = url;
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
};

// The API client
const apiClient = {
  async get<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    // Check cache first
    const cachedResponse = checkCache<T>(url, config);
    if (cachedResponse) return cachedResponse;

    // Build URL with query parameters
    const fullUrl = buildUrl(url, config.params);

    // Prepare fetch options
    const options: RequestInit = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    };

    // Execute fetch with retry
    try {
      const response = await fetchWithRetry(fullUrl, options, config);
      const result = await processResponse<T>(response);

      // Update cache if successful
      if (result.data && !result.error) {
        updateCache(url, result.data, config);
      }

      return result;
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        status: 0,
      };
    }
  },

  async post<T>(
    url: string,
    data: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    // Prepare fetch options
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify(data),
    };

    // Execute fetch with retry
    try {
      const response = await fetchWithRetry(url, options, config);
      return processResponse<T>(response);
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        status: 0,
      };
    }
  },

  async put<T>(
    url: string,
    data: any,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    // Prepare fetch options
    const options: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify(data),
    };

    // Execute fetch with retry
    try {
      const response = await fetchWithRetry(url, options, config);
      return processResponse<T>(response);
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        status: 0,
      };
    }
  },

  async delete<T>(
    url: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    // Prepare fetch options
    const options: RequestInit = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    };

    // Execute fetch with retry
    try {
      const response = await fetchWithRetry(url, options, config);
      return processResponse<T>(response);
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        status: 0,
      };
    }
  },
};

export default apiClient;
