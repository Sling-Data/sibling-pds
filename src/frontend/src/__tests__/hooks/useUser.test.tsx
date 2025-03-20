import { renderHook, act } from "@testing-library/react";
import { useUser } from "../../hooks/useUser";
import * as TokenManager from "../../utils/TokenManager";
import { useNavigate } from "react-router-dom";
import { UserProvider } from "../../contexts";
import { User } from "../../types";
import { UserService } from "../../services/user.service";

// Mock hooks
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

// Mock token manager - default mocks which tests can override
jest.mock("../../utils/TokenManager", () => {
  return {
    getUserId: jest.fn().mockReturnValue("user-123"),
    isTokenValid: jest.fn().mockReturnValue(true),
    getRefreshToken: jest.fn().mockReturnValue("mock-refresh-token"),
    getAccessToken: jest.fn().mockReturnValue("mock-access-token"),
    clearTokens: jest.fn(),
    storeTokens: jest.fn(),
    shouldRefresh: jest.fn().mockReturnValue(false)
  };
});

// Mock UserService
jest.mock("../../services/user.service", () => ({
  UserService: {
    getCurrentUser: jest.fn(),
    updateCurrentUser: jest.fn(),
    getUserData: jest.fn(),
  }
}));

// Create a manual mock for the useAuth hook
const mockRefreshTokens = jest.fn().mockResolvedValue(true);

// Mock useAuth hook with a variable we can update in tests
let mockIsAuthenticated = true;
jest.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    refreshTokens: mockRefreshTokens
  })
}));

// Setup test wrapper with providers
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserProvider>{children}</UserProvider>
);

describe("useUser Hook", () => {
  const mockNavigate = jest.fn();
  const mockUser: User = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    // Reset to default auth state
    mockIsAuthenticated = true;
    // Ensure getUserId returns a valid ID by default
    (TokenManager.getUserId as jest.Mock).mockReturnValue("user-123");
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
    expect(result.current.hasCompletedOnboarding).toBeFalsy();
  });

  it("should fetch user profile successfully", async () => {
    (UserService.getCurrentUser as jest.Mock).mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.fetchUserProfile();
    });

    // Check if service was called
    expect(UserService.getCurrentUser).toHaveBeenCalled();

    // Check if state was updated
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.userId).toEqual(mockUser.id);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch profile errors", async () => {
    (UserService.getCurrentUser as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: "User not found",
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.fetchUserProfile();
    });

    // Check if state was updated with error
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBe("User not found");
  });

  it("should update user profile successfully", async () => {
    const updatedUser = {
      ...mockUser,
      name: "Updated Name",
    };

    (UserService.updateCurrentUser as jest.Mock).mockResolvedValueOnce({
      data: updatedUser,
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.updateUserProfile({ name: "Updated Name" });
    });

    // Check if service was called with correct params
    expect(UserService.updateCurrentUser).toHaveBeenCalledWith({ name: "Updated Name" });

    // Check if state was updated
    expect(result.current.user).toEqual(updatedUser);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  it("should handle user data and navigate appropriately", async () => {
    // Explicitly ensure getUserId returns a valid ID
    (TokenManager.getUserId as jest.Mock).mockReturnValue("user-123");
    
    // Mock successful profile fetch
    (UserService.getCurrentUser as jest.Mock).mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    // Mock user data with volunteered data
    (UserService.getUserData as jest.Mock).mockResolvedValueOnce({
      data: {
        volunteeredData: ["some-data"],
      },
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Should navigate to profile since user has volunteered data
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });

  it("should navigate to data input if no volunteered data", async () => {
    // Explicitly ensure getUserId returns a valid ID
    (TokenManager.getUserId as jest.Mock).mockReturnValue("user-123");
    
    // Mock successful profile fetch
    (UserService.getCurrentUser as jest.Mock).mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    // Mock user data with no volunteered data
    (UserService.getUserData as jest.Mock).mockResolvedValueOnce({
      data: {
        volunteeredData: [],
      },
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Should navigate to data input since user has no volunteered data
    expect(mockNavigate).toHaveBeenCalledWith("/data-input");
  });

  it("should redirect to login if not authenticated", async () => {
    // Override for this test
    mockIsAuthenticated = false;
    mockRefreshTokens.mockResolvedValueOnce(false);
    
    // Override the getUserId mock for this test only
    (TokenManager.getUserId as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Should navigate to login
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
}); 