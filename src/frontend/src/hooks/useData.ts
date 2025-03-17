import { useCallback, useState } from "react";
import {
  ApiResponse,
  BehavioralData,
  ExternalData,
  UserDataSource,
  VolunteeredData,
} from "../types";
import { getUserId } from "../utils/TokenManager";
import { useApi } from "./useApi";

interface DataState {
  volunteeredData: VolunteeredData[] | null;
  behavioralData: BehavioralData[] | null;
  externalData: ExternalData[] | null;
  dataSources: UserDataSource[] | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for data operations
 *
 * Provides functionality for:
 * - Managing different types of user data (volunteered, behavioral, external)
 * - Connecting and managing data sources
 * - CRUD operations for data entries
 */
export function useData() {
  const [state, setState] = useState<DataState>({
    volunteeredData: null,
    behavioralData: null,
    externalData: null,
    dataSources: null,
    loading: false,
    error: null,
  });

  const { request } = useApi();

  // =============== Volunteered Data Operations ===============

  /**
   * Fetch all volunteered data for the current user
   */
  const fetchVolunteeredData = useCallback(async (): Promise<
    ApiResponse<VolunteeredData[]>
  > => {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const response = await request<VolunteeredData[]>("/volunteered-data", {
      method: "GET",
      showErrorNotification: false,
    });

    if (response.data) {
      setState((prev) => ({
        ...prev,
        volunteeredData: response.data,
        loading: false,
        error: null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: response.error,
      }));
    }

    return response;
  }, [request]);

  /**
   * Create a new volunteered data entry
   * @param data The data to create
   */
  const createVolunteeredData = useCallback(
    async (
      data: Omit<VolunteeredData, "id" | "userId" | "createdAt" | "updatedAt">
    ): Promise<ApiResponse<VolunteeredData>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await request<VolunteeredData>("/volunteered-data", {
        method: "POST",
        body: data,
        showSuccessNotification: true,
        successMessage: "Data saved successfully!",
      });

      if (response.data) {
        setState((prev) => {
          const newVolunteeredData = prev.volunteeredData
            ? [...prev.volunteeredData, response.data!]
            : [response.data!];

          return {
            ...prev,
            volunteeredData: newVolunteeredData,
            loading: false,
            error: null,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: response.error,
        }));
      }

      return response;
    },
    [request]
  );

  /**
   * Update a volunteered data entry
   * @param id The ID of the data to update
   * @param data The updated data
   */
  const updateVolunteeredData = useCallback(
    async (
      id: string,
      data: Partial<VolunteeredData>
    ): Promise<ApiResponse<VolunteeredData>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await request<VolunteeredData>(
        `/volunteered-data/${id}`,
        {
          method: "PUT",
          body: data,
          showSuccessNotification: true,
          successMessage: "Data updated successfully!",
        }
      );

      if (response.data) {
        setState((prev) => {
          const updatedVolunteeredData =
            prev.volunteeredData?.map((item) =>
              item.id === id ? response.data! : item
            ) || null;

          return {
            ...prev,
            volunteeredData: updatedVolunteeredData,
            loading: false,
            error: null,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: response.error,
        }));
      }

      return response;
    },
    [request]
  );

  /**
   * Delete a volunteered data entry
   * @param id The ID of the data to delete
   */
  const deleteVolunteeredData = useCallback(
    async (id: string): Promise<ApiResponse<void>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await request<void>(`/volunteered-data/${id}`, {
        method: "DELETE",
        showSuccessNotification: true,
        successMessage: "Data deleted successfully!",
      });

      if (!response.error) {
        setState((prev) => {
          const filteredVolunteeredData =
            prev.volunteeredData?.filter((item) => item.id !== id) || null;

          return {
            ...prev,
            volunteeredData: filteredVolunteeredData,
            loading: false,
            error: null,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: response.error,
        }));
      }

      return response;
    },
    [request]
  );

  // =============== Data Sources Operations ===============

  /**
   * Fetch all data sources for the current user
   */
  const fetchDataSources = useCallback(async (): Promise<
    ApiResponse<UserDataSource[]>
  > => {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const response = await request<UserDataSource[]>("/user-data-sources", {
      method: "GET",
      showErrorNotification: false,
    });

    if (response.data) {
      setState((prev) => ({
        ...prev,
        dataSources: response.data,
        loading: false,
        error: null,
      }));
    } else {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: response.error,
      }));
    }

    return response;
  }, [request]);

  /**
   * Connect a new data source
   * @param source The data source to connect
   */
  const connectDataSource = useCallback(
    async (
      source: Omit<UserDataSource, "id" | "userId" | "createdAt" | "updatedAt">
    ): Promise<ApiResponse<UserDataSource>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await request<UserDataSource>("/user-data-sources", {
        method: "POST",
        body: source,
        showSuccessNotification: true,
        successMessage: `Data source connected successfully!`,
      });

      if (response.data) {
        setState((prev) => {
          const newDataSources = prev.dataSources
            ? [...prev.dataSources, response.data!]
            : [response.data!];

          return {
            ...prev,
            dataSources: newDataSources,
            loading: false,
            error: null,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: response.error,
        }));
      }

      return response;
    },
    [request]
  );

  /**
   * Disconnect a data source
   * @param id The ID of the data source to disconnect
   */
  const disconnectDataSource = useCallback(
    async (id: string): Promise<ApiResponse<void>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await request<void>(`/user-data-sources/${id}`, {
        method: "DELETE",
        showSuccessNotification: true,
        successMessage: "Data source disconnected successfully!",
      });

      if (!response.error) {
        setState((prev) => {
          const filteredDataSources =
            prev.dataSources?.filter((item) => item.id !== id) || null;

          return {
            ...prev,
            dataSources: filteredDataSources,
            loading: false,
            error: null,
          };
        });
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: response.error,
        }));
      }

      return response;
    },
    [request]
  );

  // Return the state and functions
  return {
    ...state,
    // Volunteered data operations
    fetchVolunteeredData,
    createVolunteeredData,
    updateVolunteeredData,
    deleteVolunteeredData,
    // Data sources operations
    fetchDataSources,
    connectDataSource,
    disconnectDataSource,
  };
}
