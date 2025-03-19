import { ApiService } from "./api.service";
import { User, ApiResponse } from "../types";
import { getUserId } from "../utils/TokenManager";

/**
 * Service for handling user-related API calls
 *
 * TODO: Backend task - Create /users/me endpoints for easier access to current user data
 * - GET /users/me - Get current user profile
 * - PUT /users/me - Update current user profile
 * - GET /users/me/onboarding - Check if user has completed onboarding
 */
export class UserService extends ApiService {
  /**
   * Get the current user's profile
   * @returns A promise that resolves to the user profile
   */
  public static async getCurrentUser(): Promise<ApiResponse<User>> {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }
    return this.get<User>(`/users/${userId}`);
  }

  /**
   * Update the current user's profile
   * @param userData The updated user data
   * @returns A promise that resolves to the updated user profile
   */
  public static async updateCurrentUser(
    userData: Partial<User>
  ): Promise<ApiResponse<User>> {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }
    return this.put<User>(`/users/${userId}`, userData);
  }

  /**
   * Get user data including volunteered data
   * @param userId The user ID
   * @returns A promise that resolves to the user data
   */
  public static async getUserData(userId: string): Promise<ApiResponse<any>> {
    if (!userId) {
      return { data: null, error: "User ID is required" };
    }
    return this.get<any>(`/user-data/${userId}`);
  }

  /**
   * Check if the current user has completed the onboarding process
   * This is a placeholder until the backend implements this endpoint
   * @returns A promise that resolves to a boolean indicating if the user has completed onboarding
   */
  public static async hasCompletedOnboarding(): Promise<
    ApiResponse<{ completed: boolean }>
  > {
    const userId = getUserId();
    if (!userId) {
      return { data: null, error: "User not authenticated" };
    }

    return this.get<{ completed: boolean }>(`/users/${userId}/onboarding`);
  }
}
