import { useState, useCallback } from "react";
import {
  getAccessToken,
  getRefreshToken,
  shouldRefresh,
} from "../utils/TokenManager";
import { useNotificationContext } from "../contexts";

interface ApiRequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  successMessage?: string;
}

interface ApiRequestState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useApiRequest<T = any>() {
  const [state, setState] = useState<ApiRequestState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const { addNotification } = useNotificationContext();

  // Function to refresh the token
  const refreshToken = async (): Promise<boolean> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();

      // Store the new tokens
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("refreshToken", data.refreshToken);

      return true;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };

  const request = useCallback(
    async <R = T>({
      url,
      method = "GET",
      body,
      headers = {},
      requiresAuth = true,
      showSuccessNotification = false,
      showErrorNotification = true,
      successMessage = "Operation completed successfully",
    }: ApiRequestOptions): Promise<R> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Check if token needs refreshing
        if (requiresAuth) {
          const token = getAccessToken();

          if (!token) {
            throw new Error("No authentication token found");
          }

          if (shouldRefresh()) {
            const refreshed = await refreshToken();
            if (!refreshed) {
              throw new Error("Authentication expired. Please log in again.");
            }
          }

          // Add the Authorization header with the token
          headers = {
            ...headers,
            Authorization: `Bearer ${getAccessToken()}`,
          };
        }

        // Add Content-Type header if not present and we have a body
        if (body && !headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }

        const response = await fetch(`${process.env.REACT_APP_API_URL}${url}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });

        // Handle 401 Unauthorized - attempt to refresh token and retry
        if (response.status === 401 && requiresAuth) {
          const refreshed = await refreshToken();

          if (refreshed) {
            // Retry the request with the new token
            const retryResponse = await fetch(
              `${process.env.REACT_APP_API_URL}${url}`,
              {
                method,
                headers: {
                  ...headers,
                  Authorization: `Bearer ${getAccessToken()}`,
                },
                body: body ? JSON.stringify(body) : undefined,
              }
            );

            if (!retryResponse.ok) {
              throw new Error(
                `API error: ${retryResponse.status} ${retryResponse.statusText}`
              );
            }

            const data = await retryResponse.json();
            setState((prev) => ({ ...prev, data, loading: false }));

            if (showSuccessNotification) {
              addNotification(successMessage, "success");
            }

            return data as R;
          } else {
            throw new Error("Authentication expired. Please log in again.");
          }
        }

        if (!response.ok) {
          throw new Error(
            `API error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setState((prev) => ({ ...prev, data, loading: false }));

        if (showSuccessNotification) {
          addNotification(successMessage, "success");
        }

        return data as R;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        setState((prev) => ({
          ...prev,
          error: error as Error,
          loading: false,
        }));

        if (showErrorNotification) {
          addNotification(errorMessage, "error");
        }

        throw error;
      }
    },
    [addNotification]
  );

  return {
    ...state,
    request,
  };
}
