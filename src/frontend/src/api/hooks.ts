import { useState, useCallback, useEffect } from "react";
import apiClient, { ApiResponse, RequestConfig } from "./client";

// Generic hook for data fetching
export function useApiQuery<T>(
  url: string | null,
  config: RequestConfig = {},
  dependencies: any[] = []
) {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
    status: number;
  }>({
    data: null,
    error: null,
    loading: !!url,
    status: 0,
  });

  const fetchData = useCallback(async () => {
    if (!url) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await apiClient.get<T>(url, config);
      setState({
        data: response.data,
        error: response.error,
        loading: false,
        status: response.status,
      });
    } catch (error) {
      setState({
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
        loading: false,
        status: 0,
      });
    }
  }, [url, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

// Generic hook for data mutations
export function useApiMutation<T, D = any>(
  initialUrl: string | null = null,
  initialConfig: RequestConfig = {}
) {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
    status: number;
  }>({
    data: null,
    error: null,
    loading: false,
    status: 0,
  });

  const mutate = useCallback(
    async (url: string = initialUrl!, data?: D, config: RequestConfig = {}) => {
      if (!url && !initialUrl) {
        throw new Error("URL is required for mutation");
      }

      setState((prev) => ({ ...prev, loading: true }));

      const mergedConfig = { ...initialConfig, ...config };
      const targetUrl = url || initialUrl!;
      let response: ApiResponse<T>;

      try {
        if (mergedConfig.method === "DELETE") {
          response = await apiClient.delete<T>(targetUrl, mergedConfig);
        } else if (mergedConfig.method === "PUT") {
          response = await apiClient.put<T>(targetUrl, data, mergedConfig);
        } else {
          // Default to POST
          response = await apiClient.post<T>(targetUrl, data, mergedConfig);
        }

        setState({
          data: response.data,
          error: response.error,
          loading: false,
          status: response.status,
        });

        return response;
      } catch (error) {
        const errorState = {
          data: null,
          error: error instanceof Error ? error.message : "Unknown error",
          loading: false,
          status: 0,
        };
        setState(errorState);
        return errorState as ApiResponse<T>;
      }
    },
    [initialUrl, initialConfig]
  );

  return {
    ...state,
    mutate,
  };
}

// User-related hooks
export function useUser(userId: string | null) {
  return useApiQuery<{
    id: string;
    name: string;
    email: string;
    [key: string]: any;
  }>(userId ? `${process.env.REACT_APP_API_URL}/users/${userId}` : null, {}, [
    userId,
  ]);
}

export function useUpdateUser() {
  const { mutate, ...state } = useApiMutation<{ message: string }>();

  const updateUser = useCallback(
    async (userId: string, userData: any) => {
      return mutate(
        `${process.env.REACT_APP_API_URL}/users/${userId}`,
        userData,
        { method: "PUT" }
      );
    },
    [mutate]
  );

  return {
    ...state,
    updateUser,
  };
}

// Auth-related hooks
export function useLogin() {
  const { mutate, ...state } = useApiMutation<{
    userId: string;
    token: string;
    refreshToken: string;
  }>();

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      return mutate(
        `${process.env.REACT_APP_API_URL}/auth/login`,
        credentials,
        { method: "POST", skipAuth: true }
      );
    },
    [mutate]
  );

  return {
    ...state,
    login,
  };
}

export function useSignup() {
  const { mutate, ...state } = useApiMutation<{
    userId: string;
    token: string;
    refreshToken: string;
  }>();

  const signup = useCallback(
    async (userData: { name: string; email: string; password: string }) => {
      return mutate(`${process.env.REACT_APP_API_URL}/auth/signup`, userData, {
        method: "POST",
        skipAuth: true,
      });
    },
    [mutate]
  );

  return {
    ...state,
    signup,
  };
}

// User data submission hook
export function useSubmitUserData() {
  const { mutate, ...state } = useApiMutation<{ message: string }>();

  const submitUserData = useCallback(
    async (userId: string, userData: any) => {
      return mutate(
        `${process.env.REACT_APP_API_URL}/users/${userId}/data`,
        userData,
        { method: "POST" }
      );
    },
    [mutate]
  );

  return {
    ...state,
    submitUserData,
  };
}

// Service connection hooks
export function useConnectService(service: "gmail" | "plaid") {
  const { mutate, ...state } = useApiMutation<{ url: string }>();

  const getConnectionUrl = useCallback(
    async (userId: string) => {
      return mutate(
        `${process.env.REACT_APP_API_URL}/auth/${service}/url`,
        { userId },
        { method: "POST" }
      );
    },
    [mutate, service]
  );

  return {
    ...state,
    getConnectionUrl,
  };
}
