import {
  getAccessToken,
  shouldRefresh,
  getRefreshToken,
  storeTokens,
} from "../utils/TokenManager";
import { ApiResponse } from "../types";
import { useFetch } from "../hooks/useFetch";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

interface RequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  skipAuth?: boolean;
}

/**
 * Base API service for handling API requests
 * This service provides methods for making API requests using the useFetch hook
 */
export class ApiService {
  /**
   * Format the API URL
   * @param endpoint The API endpoint
   * @returns The full API URL
   */
  protected static formatUrl(endpoint: string): string {
    return `${API_URL}${endpoint}`;
  }

  /**
   * Refresh the access token
   * @returns A promise that resolves to a boolean indicating if the refresh was successful
   */
  protected static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      console.error("Error refreshing token:", error);
      return false;
    }
  }

  /**
   * Make a GET request
   * @param endpoint The API endpoint
   * @param config Additional configuration for the request
   * @returns A promise that resolves to the API response
   */
  protected static async get<T>(
    endpoint: string,
    config: {
      params?: Record<string, string>;
      skipAuth?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Use the update method of useFetch to make a one-time request
      const { data, error } = await useFetch<T>(null, {
        skipAuth: config.skipAuth,
        skipCache: config.skipCache,
        params: config.params,
      }).update(this.formatUrl(endpoint));

      return { data, error };
    } catch (error) {
      console.error(`API GET request error for ${endpoint}:`, error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Make a POST request
   * @param endpoint The API endpoint
   * @param data The request body
   * @param config Additional configuration for the request
   * @returns A promise that resolves to the API response
   */
  protected static async post<T>(
    endpoint: string,
    data: any,
    config: {
      skipAuth?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Use the update method of useFetch to make a one-time request
      const { data: responseData, error } = await useFetch<T>(null, {
        method: "POST",
        body: data,
        skipAuth: config.skipAuth,
        skipCache: config.skipCache,
      }).update(this.formatUrl(endpoint));

      return { data: responseData, error };
    } catch (error) {
      console.error(`API POST request error for ${endpoint}:`, error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Make a PUT request
   * @param endpoint The API endpoint
   * @param data The request body
   * @param config Additional configuration for the request
   * @returns A promise that resolves to the API response
   */
  protected static async put<T>(
    endpoint: string,
    data: any,
    config: {
      skipAuth?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Use the update method of useFetch to make a one-time request
      const { data: responseData, error } = await useFetch<T>(null, {
        method: "PUT",
        body: data,
        skipAuth: config.skipAuth,
        skipCache: config.skipCache,
      }).update(this.formatUrl(endpoint));

      return { data: responseData, error };
    } catch (error) {
      console.error(`API PUT request error for ${endpoint}:`, error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Make a DELETE request
   * @param endpoint The API endpoint
   * @param config Additional configuration for the request
   * @returns A promise that resolves to the API response
   */
  protected static async delete<T>(
    endpoint: string,
    config: {
      skipAuth?: boolean;
      skipCache?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Use the update method of useFetch to make a one-time request
      const { data, error } = await useFetch<T>(null, {
        method: "DELETE",
        skipAuth: config.skipAuth,
        skipCache: config.skipCache,
      }).update(this.formatUrl(endpoint));

      return { data, error };
    } catch (error) {
      console.error(`API DELETE request error for ${endpoint}:`, error);
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
