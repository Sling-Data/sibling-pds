import { act, renderHook } from "@testing-library/react";
import { clearApiCache, useApi } from "../../hooks/useApi";
import * as TokenManager from "../../utils/TokenManager";

// Mock fetch
global.fetch = jest.fn();
const mockedFetch = global.fetch as jest.Mock;

// Mock the notification context
jest.mock("../../contexts", () => ({
  useNotificationContext: () => ({
    addNotification: jest.fn()
  })
}));

// Mock token manager
jest.mock("../../utils/TokenManager", () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  shouldRefresh: jest.fn(),
  storeTokens: jest.fn(),
}));

// Mock API URL
process.env.REACT_APP_API_URL = "http://test-api.com";

describe("useApi Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch.mockClear();
    clearApiCache();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should make a successful GET request", async () => {
    const mockData = { id: "123", name: "Test User" };
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    jest.spyOn(TokenManager, "getAccessToken").mockReturnValue("mock-token");

    const { result } = renderHook(() => useApi());

    let response = { data: null, error: null };
    await act(async () => {
      response = await result.current.request("/test-endpoint");
    });

    expect(mockedFetch).toHaveBeenCalledWith(
      "http://test-api.com/test-endpoint",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
        }),
      })
    );

    expect(result.current.data).toEqual(mockData);
  });

  it("should handle API errors", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const { result } = renderHook(() => useApi());

    let response = { data: null, error: null };
    await act(async () => {
      response = await result.current.request("/nonexistent", {
        requiresAuth: false,
      });
    });

    expect(response.data).toBeNull();
    expect(response.error).toBe("API error: 404 Not Found");
  });

  it("should cache GET requests", async () => {
    const mockData = { id: "123", name: "User" };
    
    // Only mock once - second request should use cache
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const { result } = renderHook(() => useApi());

    // First request
    await act(async () => {
      await result.current.request("/cached-endpoint", { requiresAuth: false });
    });

    // Second request to the same endpoint should use cache
    await act(async () => {
      await result.current.request("/cached-endpoint", { requiresAuth: false });
    });

    // Fetch should be called only once
    expect(mockedFetch).toHaveBeenCalledTimes(1);
  });

  it("should refresh token on 401 response", async () => {
    jest.spyOn(TokenManager, "getAccessToken")
      .mockReturnValueOnce("expired-token")
      .mockReturnValueOnce("new-token");
    
    jest.spyOn(TokenManager, "getRefreshToken")
      .mockReturnValue("refresh-token");

    // First request fails with 401
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    });

    // Token refresh request succeeds
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        accessToken: "new-token",
        refreshToken: "new-refresh-token",
      }),
    });

    // Retry with new token succeeds
    const userData = { id: "123", name: "Test User" };
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(userData),
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request("/protected");
    });

    // Check token refresh was called
    expect(mockedFetch).toHaveBeenCalledTimes(3);
    expect(TokenManager.storeTokens).toHaveBeenCalledWith({
      accessToken: "new-token",
      refreshToken: "new-refresh-token",
    });
  });
}); 