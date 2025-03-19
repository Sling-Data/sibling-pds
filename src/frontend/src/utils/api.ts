import { useUser } from "../contexts/UserContextOld";

/**
 * Utility function to make authenticated API calls with automatic token refresh
 * @param fetchCallback - The fetch function to execute after token refresh
 * @returns The result of the fetch operation
 */
export const withTokenRefresh = async <T>(
  fetchCallback: () => Promise<T>
): Promise<T> => {
  const { refreshTokenIfExpired } = useUser();

  // First, try to refresh the token if needed
  const refreshSuccessful = await refreshTokenIfExpired();

  // If refresh was successful or not needed, proceed with the fetch
  if (refreshSuccessful) {
    return fetchCallback();
  } else {
    // If token refresh failed, throw an error
    throw new Error("Authentication failed. Please log in again.");
  }
};

/**
 * Wrapper around fetch API that can be used in tests
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The fetch response
 */
export const fetch = (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  return window.fetch(url, options);
};

export default {
  withTokenRefresh,
  fetch,
};
