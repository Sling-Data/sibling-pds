import { ApiService } from "./api.service";
import {
  AuthTokens,
  LoginCredentials,
  SignupCredentials,
  ApiResponse,
} from "../types";

/**
 * Service for handling authentication-related API calls
 */
export class AuthService extends ApiService {
  /**
   * Login a user
   * @param credentials The login credentials
   * @returns A promise that resolves to the authentication tokens
   */
  public static async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<AuthTokens>> {
    return this.post<AuthTokens>("/auth/login", credentials, {
      requiresAuth: false,
    });
  }

  /**
   * Register a new user
   * @param credentials The signup credentials
   * @returns A promise that resolves to the authentication tokens
   */
  public static async signup(
    credentials: SignupCredentials
  ): Promise<ApiResponse<AuthTokens>> {
    return this.post<AuthTokens>("/auth/signup", credentials, {
      requiresAuth: false,
    });
  }

  /**
   * Refresh the authentication tokens
   * @param refreshToken The refresh token
   * @returns A promise that resolves to the new authentication tokens
   */
  public static async refreshTokens(
    refreshToken: string
  ): Promise<ApiResponse<AuthTokens>> {
    return this.post<AuthTokens>(
      "/auth/refresh-token",
      { refreshToken },
      { requiresAuth: false }
    );
  }
}
