import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../../hooks/useAuth";
import * as TokenManager from "../../utils/TokenManager";
import { useNavigate } from "react-router-dom";
import { AuthService } from "../../services/auth.service";
import { UserService } from "../../services/user.service";

// Mock hooks
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

// Mock the notification context
const mockAddNotification = jest.fn();
jest.mock("../../contexts", () => ({
  useNotificationContext: () => ({
    addNotification: mockAddNotification,
  }),
  useUserContext: () => ({
    userId: "user-123",
    setUserId: jest.fn(),
  }),
}));

// Mock AuthService
jest.mock("../../services/auth.service", () => ({
  AuthService: {
    login: jest.fn(),
    signup: jest.fn(),
    refreshTokens: jest.fn(),
  },
}));

// Mock UserService
jest.mock("../../services/user.service", () => ({
  UserService: {
    getUserData: jest.fn(),
  },
}));

// Mock token manager
jest.mock("../../utils/TokenManager", () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
  storeTokens: jest.fn(),
  getUserId: jest.fn(),
  isTokenValid: jest.fn(),
  shouldRefresh: jest.fn(),
}));

// Mock the AuthContext
const mockStoreAuthTokens = jest.fn();
const mockClearAuthTokens = jest.fn();
const mockSetIsRefreshing = jest.fn();
const mockGetCurrentRefreshToken = jest.fn().mockReturnValue("mock-refresh-token");
const mockHandleTokenRefreshSuccess = jest.fn();
const mockHandleTokenRefreshFailure = jest.fn();
const mockNeedsTokenRefresh = jest.fn().mockReturnValue(false);
const mockSetAuthState = jest.fn();

jest.mock("../../contexts/AuthContext", () => ({
  useAuthContext: () => ({
    isAuthenticated: true,
    isInitialized: true,
    userId: "user-123",
    isRefreshing: false,
    storeAuthTokens: mockStoreAuthTokens,
    clearAuthTokens: mockClearAuthTokens,
    setIsRefreshing: mockSetIsRefreshing,
    getCurrentRefreshToken: mockGetCurrentRefreshToken,
    handleTokenRefreshSuccess: mockHandleTokenRefreshSuccess,
    handleTokenRefreshFailure: mockHandleTokenRefreshFailure,
    needsTokenRefresh: mockNeedsTokenRefresh,
    setAuthState: mockSetAuthState,
  }),
}));

// Simple wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

describe("useAuth Hook", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockAddNotification.mockClear();
    mockStoreAuthTokens.mockClear();
    mockClearAuthTokens.mockClear();
    mockSetIsRefreshing.mockClear();
    mockGetCurrentRefreshToken.mockClear();
    mockHandleTokenRefreshSuccess.mockClear();
    mockHandleTokenRefreshFailure.mockClear();
    mockNeedsTokenRefresh.mockClear();
  });

  it("should initialize with correct authentication state", () => {
    // Mock authenticated state
    jest.spyOn(TokenManager, "getAccessToken").mockReturnValue("mock-token");
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBeTruthy();
    expect(result.current.userId).toBe("user-123");
  });

  it("should handle login successfully", async () => {
    // Mock API response
    (AuthService.login as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        token: "mock-token",
        refreshToken: "mock-refresh-token",
        userId: "user-123",
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: "test@example.com",
        password: "password123",
      });
    });

    // Verify token storage called
    expect(mockStoreAuthTokens).toHaveBeenCalledWith({
      token: "mock-token", 
      refreshToken: "mock-refresh-token",
      userId: "user-123"
    });
    expect(result.current.isAuthenticated).toBeTruthy();
    expect(result.current.userId).toBe("user-123");
  });

  it("should handle signup successfully", async () => {
    // Mock API response
    (AuthService.signup as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        token: "mock-token",
        refreshToken: "mock-refresh-token",
        userId: "user-123",
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signup({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
    });

    // Verify token storage called
    expect(mockStoreAuthTokens).toHaveBeenCalledWith({
      token: "mock-token", 
      refreshToken: "mock-refresh-token",
      userId: "user-123"
    });
    expect(result.current.isAuthenticated).toBeTruthy();
    expect(result.current.userId).toBe("user-123");
  });

  it("should handle logout correctly", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    // Verify tokens cleared and state update
    expect(mockClearAuthTokens).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("should refresh tokens correctly", async () => {
    // Mock successful token refresh
    (AuthService.refreshTokens as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        token: "new-mock-token",
        refreshToken: "new-mock-refresh-token",
        userId: "user-123"
      }
    });

    jest.spyOn(TokenManager, "shouldRefresh").mockReturnValue(true);
    
    // Need to mock getCurrentRefreshToken to return a value
    mockGetCurrentRefreshToken.mockReturnValue("mock-refresh-token");
    
    const { result } = renderHook(() => useAuth(), { wrapper });

    let success;
    await act(async () => {
      success = await result.current.refreshTokens();
    });
    
    // Verify success
    expect(success).toBeTruthy();
    
    // Verify refresh tokens was called correctly
    expect(mockGetCurrentRefreshToken).toHaveBeenCalled();
    expect(AuthService.refreshTokens).toHaveBeenCalledWith("mock-refresh-token");
    expect(mockHandleTokenRefreshSuccess).toHaveBeenCalledWith({
      token: "new-mock-token",
      refreshToken: "new-mock-refresh-token",
      userId: "user-123"
    });
  });

  it("should handle token refresh failure correctly", async () => {
    // Mock failed token refresh
    (AuthService.refreshTokens as jest.Mock).mockResolvedValueOnce({
      success: false,
      error: "Invalid refresh token"
    });
    
    // Need to mock getCurrentRefreshToken to return a value
    mockGetCurrentRefreshToken.mockReturnValue("invalid-refresh-token");

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Attempt to refresh tokens
    let refreshSuccess;
    await act(async () => {
      refreshSuccess = await result.current.refreshTokens();
    });
    
    // Verify refresh failed
    expect(refreshSuccess).toBeFalsy();
    expect(mockHandleTokenRefreshFailure).toHaveBeenCalled();
  });

  it("should check auth and redirect if not authenticated", async () => {
    // Mock unauthenticated state
    jest.spyOn(TokenManager, "getAccessToken").mockReturnValue("");

    const { result } = renderHook(() => useAuth(), { wrapper });

    let isAuth;
    await act(async () => {
      isAuth = result.current.checkAuth();
      expect(isAuth).toBeFalsy();
    });

    // Verify redirect to login - default path is /login
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("should not redirect if authenticated during checkAuth", async () => {
    // Mock authenticated state
    jest.spyOn(TokenManager, "getAccessToken").mockReturnValue("mock-token");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.checkAuth("/protected");
    });

    // Verify no navigation occurred
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("should navigate to profile when user has volunteered data", async () => {
    // Mock authenticated state
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");
    jest.spyOn(TokenManager, "isTokenValid").mockReturnValue(true);
    
    // Mock user data with volunteered data
    (UserService.getUserData as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        volunteeredData: ["some-data"],
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Verify navigation to profile
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });

  it("should navigate to data input when user has no volunteered data", async () => {
    // Mock authenticated state
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");
    jest.spyOn(TokenManager, "isTokenValid").mockReturnValue(true);
    
    // Mock user data with no volunteered data
    (UserService.getUserData as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        volunteeredData: [],
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Verify navigation to data input
    expect(mockNavigate).toHaveBeenCalledWith("/data-input");
  });

  it("should attempt token refresh when token is invalid during data check", async () => {
    // Mock authenticated state but invalid token
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");
    jest.spyOn(TokenManager, "isTokenValid").mockReturnValue(false);
    
    // Mock successful token refresh
    (AuthService.refreshTokens as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        token: "new-mock-token",
        refreshToken: "new-mock-refresh-token",
        userId: "user-123"
      }
    });
    
    // Need to mock getCurrentRefreshToken to return a value
    mockGetCurrentRefreshToken.mockReturnValue("mock-refresh-token");
    
    // Mock user data with volunteered data
    (UserService.getUserData as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        volunteeredData: ["some-data"],
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Verify token refresh was attempted and navigation to profile
    expect(mockGetCurrentRefreshToken).toHaveBeenCalled();
    expect(AuthService.refreshTokens).toHaveBeenCalledWith("mock-refresh-token");
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });
}); 