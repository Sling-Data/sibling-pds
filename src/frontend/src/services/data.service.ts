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
  // Volunteered Data
  /**
   * Create a new volunteered data entry
   * This is the only volunteered data endpoint currently implemented
   * @param data The volunteered data to create
   * @returns A promise that resolves to the created volunteered data
   */
  public static async createVolunteeredData(
    data: Omit<VolunteeredData, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<VolunteeredData>> {
    return this.post<VolunteeredData>("/volunteered-data", data);
  }

  // Behavioral Data
  /**
   * Get behavioral data by ID
   * @param id The ID of the behavioral data to get
   * @returns A promise that resolves to the behavioral data
   */
  public static async getBehavioralData(
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

  // External Data
  /**
   * Create new external data
   * This is the only external data endpoint currently implemented
   * @param data The external data to create
   * @returns A promise that resolves to the created external data
   */
  public static async createExternalData(
    data: Omit<ExternalData, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<ExternalData>> {
    return this.post<ExternalData>("/external-data", data);
  }

  // User Data
  /**
   * Get user data by user ID
   * @param userId The ID of the user to get data for
   * @returns A promise that resolves to the user data
   */
  public static async getUserData(userId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/user-data/${userId}`);
  }

  /**
   * Get data for the current user
   * @returns A promise that resolves to the user data
   */
  public static async getCurrentUserData(): Promise<ApiResponse<any>> {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }
    return this.getUserData(userId);
  }

  // User Data Sources
  /**
   * Get all user data sources for the current user
   * @returns A promise that resolves to an array of user data sources
   */
  public static async getUserDataSources(): Promise<
    ApiResponse<UserDataSource[]>
  > {
    return this.get<UserDataSource[]>("/user-data-sources");
  }

  /**
   * Connect a new data source
   * @param source The source to connect
   * @param credentials The credentials for the source
   * @returns A promise that resolves to the connected data source
   */
  public static async connectDataSource(
    source: string,
    credentials: any
  ): Promise<ApiResponse<UserDataSource>> {
    return this.post<UserDataSource>("/user-data-sources", {
      source,
      credentials,
    });
  }

  /**
   * Disconnect a data source
   * @param id The ID of the data source to disconnect
   * @returns A promise that resolves to a success message
   */
  public static async disconnectDataSource(
    id: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.delete<{ message: string }>(`/user-data-sources/${id}`);
  }
}
