import { renderHook, act } from "@testing-library/react";
import { useAuth } from "../../hooks/useAuth";
import * as TokenManager from "../../utils/TokenManager";
import { useNavigate } from "react-router-dom";

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
}));

// Set up mock request function
const mockRequest = jest.fn();

// Mock API hook
jest.mock("../../hooks/useApi", () => ({
  useApi: () => ({
    request: mockRequest,
  }),
}));

// Mock token manager
jest.mock("../../utils/TokenManager", () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
  storeTokens: jest.fn(),
  getUserId: jest.fn(),
}));

// Simple wrapper component
const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

describe("useAuth Hook", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockAddNotification.mockClear();
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
    // Mock getUserId to return user-123
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");
    
    // Mock API response
    mockRequest.mockResolvedValueOnce({
      success: true,
      data: {
        accessToken: "mock-token",
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

    // Verify token storage and state update - note we need to include userId
    expect(TokenManager.storeTokens).toHaveBeenCalledWith({
      accessToken: "mock-token", 
      refreshToken: "mock-refresh-token",
      userId: "user-123"
    });
    expect(result.current.isAuthenticated).toBeTruthy();
    expect(result.current.userId).toBe("user-123");
  });

  it("should handle signup successfully", async () => {
    // Mock getUserId to return user-123
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");
    
    // Mock API response
    mockRequest.mockResolvedValueOnce({
      success: true,
      data: {
        accessToken: "mock-token",
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

    // Verify token storage and state update - note we need to include userId
    expect(TokenManager.storeTokens).toHaveBeenCalledWith({
      accessToken: "mock-token", 
      refreshToken: "mock-refresh-token",
      userId: "user-123"
    });
    expect(result.current.isAuthenticated).toBeTruthy();
    expect(result.current.userId).toBe("user-123");
  });

  it("should handle logout correctly", async () => {
    // Mock authenticated state
    jest.spyOn(TokenManager, "getAccessToken").mockReturnValue("mock-token");
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    // Verify tokens cleared and state update
    expect(TokenManager.clearTokens).toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBeFalsy();
    expect(result.current.userId).toBeNull();
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("should refresh tokens correctly", async () => {
    // Setup the getRefreshToken mock to return a refresh token
    jest.spyOn(TokenManager, "getRefreshToken").mockReturnValue("old-refresh-token");
    
    // Mock API response
    mockRequest.mockResolvedValueOnce({
      success: true,
      data: {
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        userId: "user-123",
      },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      const success = await result.current.refreshTokens();
      expect(success).toBeTruthy();
    });

    // Verify tokens updated
    expect(TokenManager.storeTokens).toHaveBeenCalledWith({
      accessToken: "new-access-token", 
      refreshToken: "new-refresh-token",
      userId: "user-123"
    });
  });

  it("should handle token refresh failure correctly", async () => {
    // Mock initial state for the test
    // We need to set the initial state to match what would happen before a refresh attempt
    // (which would typically be a potentially authenticated state)
    jest.spyOn(TokenManager, "getAccessToken").mockReturnValue("some-token");
    jest.spyOn(TokenManager, "getRefreshToken").mockReturnValue("old-refresh-token");
    
    // Mock API error response
    mockRequest.mockResolvedValueOnce({
      success: false,
      error: "Invalid refresh token",
      data: null
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Verify initial state
    expect(result.current.isAuthenticated).toBeTruthy();
    
    // Attempt to refresh tokens
    let refreshSuccess;
    await act(async () => {
      refreshSuccess = await result.current.refreshTokens();
    });
    
    // Verify refresh failed
    expect(refreshSuccess).toBeFalsy();
    
    // The isAuthenticated state should remain unchanged after a failed refresh
    // The hook preserves the existing state on refresh failure
    expect(result.current.isAuthenticated).toBeTruthy(); 
    
    // Verify that storeTokens was not called with new tokens
    expect(TokenManager.storeTokens).not.toHaveBeenCalled();
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
}); 