import { ApiService } from "./api.service";
import {
  VolunteeredData,
  BehavioralData,
  ExternalData,
  UserDataSource,
  ApiResponse,
} from "../types";
import { getUserId } from "../utils/TokenManager";

/**
 * Service for handling data-related API calls
 *
 * TODO: Backend task - Implement missing data endpoints
 * - GET /volunteered-data - Get all volunteered data for current user
 * - GET /volunteered-data/:id - Get volunteered data by ID
 * - PUT /volunteered-data/:id - Update volunteered data
 * - DELETE /volunteered-data/:id - Delete volunteered data
 * - GET /behavioral-data - Get all behavioral data for current user
 * - GET /external-data - Get all external data for current user
 * - GET /external-data/source/:source - Get external data by source
 * - GET /user-data-sources - Get all user data sources
 * - POST /user-data-sources - Connect a new data source
 * - DELETE /user-data-sources/:id - Disconnect a data source
 */
export class DataService extends ApiService {
  // =============== Volunteered Data Operations ===============

  /**
   * Get all volunteered data for the current user
   * @returns A promise that resolves to the volunteered data
   */
  public static async getVolunteeredData(): Promise<
    ApiResponse<VolunteeredData[]>
  > {
    return this.get<VolunteeredData[]>("/volunteered-data");
  }

  /**
   * Get volunteered data by ID
   * @param id The ID of the volunteered data to get
   * @returns A promise that resolves to the volunteered data
   */
  public static async getVolunteeredDataById(
    id: string
  ): Promise<ApiResponse<VolunteeredData>> {
    return this.get<VolunteeredData>(`/volunteered-data/${id}`);
  }

  /**
   * Create a new volunteered data entry
   * @param data The volunteered data to create
   * @returns A promise that resolves to the created volunteered data
   */
  public static async createVolunteeredData(
    data: Omit<VolunteeredData, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<VolunteeredData>> {
    return this.post<VolunteeredData>("/volunteered-data", data);
  }

  /**
   * Update volunteered data
   * @param id The ID of the volunteered data to update
   * @param data The updated volunteered data
   * @returns A promise that resolves to the updated volunteered data
   */
  public static async updateVolunteeredData(
    id: string,
    data: Partial<VolunteeredData>
  ): Promise<ApiResponse<VolunteeredData>> {
    return this.put<VolunteeredData>(`/volunteered-data/${id}`, data);
  }

  /**
   * Delete volunteered data
   * @param id The ID of the volunteered data to delete
   * @returns A promise that resolves to void
   */
  public static async deleteVolunteeredData(
    id: string
  ): Promise<ApiResponse<void>> {
    return this.delete<void>(`/volunteered-data/${id}`);
  }

  // =============== Behavioral Data Operations ===============

  /**
   * Get all behavioral data for the current user
   * @returns A promise that resolves to the behavioral data
   */
  public static async getBehavioralData(): Promise<
    ApiResponse<BehavioralData[]>
  > {
    return this.get<BehavioralData[]>("/behavioral-data");
  }

  /**
   * Get behavioral data by ID
   * @param id The ID of the behavioral data to get
   * @returns A promise that resolves to the behavioral data
   */
  public static async getBehavioralDataById(
    id: string
  ): Promise<ApiResponse<BehavioralData>> {
    return this.get<BehavioralData>(`/behavioral-data/${id}`);
  }

  /**
   * Get all behavioral data for a specific user
   * @param userId The ID of the user to get behavioral data for
   * @returns A promise that resolves to an array of behavioral data
   */
  public static async getUserBehavioralData(
    userId: string
  ): Promise<ApiResponse<BehavioralData[]>> {
    return this.get<BehavioralData[]>(`/behavioral-data/user/${userId}`);
  }

  /**
   * Get all behavioral data for the current user
   * @returns A promise that resolves to an array of behavioral data
   */
  public static async getCurrentUserBehavioralData(): Promise<
    ApiResponse<BehavioralData[]>
  > {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }
    return this.getUserBehavioralData(userId);
  }

  /**
   * Create a new behavioral data entry
   * @param data The behavioral data to create
   * @returns A promise that resolves to the created behavioral data
   */
  public static async createBehavioralData(
    data: Omit<BehavioralData, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<BehavioralData>> {
    return this.post<BehavioralData>("/behavioral-data", data);
  }

  // =============== External Data Operations ===============

  /**
   * Get all external data for the current user
   * @returns A promise that resolves to the external data
   */
  public static async getExternalData(): Promise<ApiResponse<ExternalData[]>> {
    return this.get<ExternalData[]>("/external-data");
  }

  /**
   * Get external data by source
   * @param source The source of the external data to get
   * @returns A promise that resolves to the external data
   */
  public static async getExternalDataBySource(
    source: string
  ): Promise<ApiResponse<ExternalData[]>> {
    return this.get<ExternalData[]>(`/external-data/source/${source}`);
  }

  // =============== Data Sources Operations ===============

  /**
   * Get all data sources for the current user
   * @returns A promise that resolves to the data sources
   */
  public static async getDataSources(): Promise<ApiResponse<UserDataSource[]>> {
    return this.get<UserDataSource[]>("/user-data-sources");
  }

  /**
   * Connect a new data source
   * @param source The data source to connect
   * @returns A promise that resolves to the connected data source
   */
  public static async connectDataSource(
    source: Omit<UserDataSource, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<UserDataSource>> {
    return this.post<UserDataSource>("/user-data-sources", source);
  }

  /**
   * Disconnect a data source
   * @param id The ID of the data source to disconnect
   * @returns A promise that resolves to void
   */
  public static async disconnectDataSource(
    id: string
  ): Promise<ApiResponse<void>> {
    return this.delete<void>(`/user-data-sources/${id}`);
  }
}
