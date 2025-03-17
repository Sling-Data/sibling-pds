import { ApiResponse } from "../types";
import { ApiConfig, clearApiCache } from "../hooks/useApi";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

/**
 * Options for API requests
 */
export type ApiRequestOptions = Omit<ApiConfig, "method" | "body">;

/**
 * Base API service for handling API requests
 * This service provides methods for making API requests
 */
export class ApiService {
  /**
   * Format the API URL
   * @param endpoint The API endpoint
   * @returns The full API URL
   */
  protected static formatUrl(endpoint: string): string {
    // Remove any leading slash to prevent double slashes
    const formattedEndpoint = endpoint.startsWith("/")
      ? endpoint.substring(1)
      : endpoint;

    return formattedEndpoint;
  }

  /**
   * Clear the API cache
   */
  public static clearCache(): void {
    clearApiCache();
  }

  /**
   * Make a GET request
   * @param endpoint The API endpoint
   * @param options The options for the request
   * @returns A promise that resolves to the response data
   */
  protected static async get<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "GET",
      ...options,
    });
  }

  /**
   * Make a POST request
   * @param endpoint The API endpoint
   * @param body The request body
   * @param options The options for the request
   * @returns A promise that resolves to the response data
   */
  protected static async post<T>(
    endpoint: string,
    body: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body,
      ...options,
    });
  }

  /**
   * Make a PUT request
   * @param endpoint The API endpoint
   * @param body The request body
   * @param options The options for the request
   * @returns A promise that resolves to the response data
   */
  protected static async put<T>(
    endpoint: string,
    body: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body,
      ...options,
    });
  }

  /**
   * Make a DELETE request
   * @param endpoint The API endpoint
   * @param options The options for the request
   * @returns A promise that resolves to the response data
   */
  protected static async delete<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      ...options,
    });
  }

  /**
   * Make a request to the API
   * This is a wrapper that will be implemented by components using the useApi hook
   * It provides a consistent interface for service methods
   *
   * @param endpoint The API endpoint
   * @param config The request config
   * @returns A promise that resolves to the response data
   */
  protected static async request<T>(
    endpoint: string,
    config: ApiConfig
  ): Promise<ApiResponse<T>> {
    const url = this.formatUrl(endpoint);

    // This is a placeholder implementation that will be replaced by the hook-based approach
    // In real components, the request will be made using the useApi hook
    try {
      const response = await fetch(`${API_URL}/${url}`, {
        method: config.method,
        headers: {
          ...(config.body && { "Content-Type": "application/json" }),
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return { data: null, error: errorMessage };
    }
  }
}
