import { renderHook, act } from "@testing-library/react";
import { useUser } from "../../hooks/useUser";
import * as TokenManager from "../../utils/TokenManager";
import { useNavigate } from "react-router-dom";
import { NotificationProvider } from "../../contexts";
import { User } from "../../types";

// Mock hooks
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));

// Mock contexts
jest.mock("../../contexts", () => ({
  ...jest.requireActual("../../contexts"),
  useNotificationContext: jest.fn().mockReturnValue({
    addNotification: jest.fn(),
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
  getUserId: jest.fn(),
}));

// Test wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
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
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useUser(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
    expect(result.current.hasCompletedOnboarding).toBeFalsy();
  });

  it("should fetch user profile successfully", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    mockRequest.mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.fetchUserProfile();
    });

    // Check if request was made with correct params
    expect(mockRequest).toHaveBeenCalledWith(
      "/users/user-123",
      expect.objectContaining({
        method: "GET",
      })
    );

    // Check if state was updated
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch profile errors", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    mockRequest.mockResolvedValueOnce({
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

  it("should handle unauthenticated state when fetching profile", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue(null);

    const { result } = renderHook(() => useUser(), { wrapper });

    let response;
    await act(async () => {
      response = await result.current.fetchUserProfile();
    });

    // Request should not be called
    expect(mockRequest).not.toHaveBeenCalled();
    
    // Should return error
    expect(response).toEqual({
      data: null,
      error: "User not authenticated",
    });
  });

  it("should update user profile successfully", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    const updatedUser = {
      ...mockUser,
      name: "Updated Name",
    };

    mockRequest.mockResolvedValueOnce({
      data: updatedUser,
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.updateUserProfile({ name: "Updated Name" });
    });

    // Check if request was made with correct params
    expect(mockRequest).toHaveBeenCalledWith(
      "/users/user-123",
      expect.objectContaining({
        method: "PUT",
        body: { name: "Updated Name" },
      })
    );

    // Check if state was updated
    expect(result.current.user).toEqual(updatedUser);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  it("should check onboarding status successfully", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    mockRequest.mockResolvedValueOnce({
      data: { completed: true },
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    let hasCompleted;
    await act(async () => {
      hasCompleted = await result.current.checkOnboardingStatus();
    });

    // Check if request was made with correct params
    expect(mockRequest).toHaveBeenCalledWith(
      "/users/user-123/onboarding",
      expect.objectContaining({
        method: "GET",
      })
    );

    // Check if state and return value were updated
    expect(result.current.hasCompletedOnboarding).toBeTruthy();
    expect(hasCompleted).toBeTruthy();
  });

  it("should handle user data and navigate appropriately when authenticated", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    // Mock successful profile fetch
    mockRequest.mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    // Mock completed onboarding
    mockRequest.mockResolvedValueOnce({
      data: { completed: true },
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Should navigate to dashboard
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("should redirect to onboarding if onboarding not completed", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    // Mock successful profile fetch
    mockRequest.mockResolvedValueOnce({
      data: mockUser,
      error: null,
    });

    // Mock incomplete onboarding
    mockRequest.mockResolvedValueOnce({
      data: { completed: false },
      error: null,
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Should navigate to onboarding
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding");
  });

  it("should redirect to login if not authenticated", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue(null);

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Should navigate to login
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("should redirect to login if user profile fetch fails", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    // Mock failed profile fetch
    mockRequest.mockResolvedValueOnce({
      data: null,
      error: "User not found",
    });

    const { result } = renderHook(() => useUser(), { wrapper });

    await act(async () => {
      await result.current.checkUserDataAndNavigate();
    });

    // Should navigate to login
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
}); 