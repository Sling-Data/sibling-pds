import { renderHook, act } from "@testing-library/react";
import { useApi } from "../../hooks/useApi";
import * as TokenManager from "../../utils/TokenManager";

// Mock fetch
const mockedFetch = jest.fn();
global.fetch = mockedFetch;

// Mock process.env
process.env.REACT_APP_API_URL = "http://test-api.com";

// Mock notification context
const mockAddNotification = jest.fn();
jest.mock("../../contexts", () => ({
  useNotificationContext: () => ({
    addNotification: mockAddNotification,
  }),
}));

// Mock TokenManager
jest.mock("../../utils/TokenManager", () => ({
  getAccessToken: jest.fn(),
  isTokenValid: jest.fn().mockReturnValue(true),
  refreshTokens: jest.fn(),
  shouldRefresh: jest.fn().mockReturnValue(false),
}));

describe("useApi Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFetch.mockClear();
    mockAddNotification.mockClear();
    // Set up default return values for mocks
    jest.spyOn(TokenManager, "getAccessToken").mockReturnValue("mock-token");
    jest.spyOn(TokenManager, "isTokenValid").mockReturnValue(true);
    jest.spyOn(TokenManager, "shouldRefresh").mockReturnValue(false);
  });

  it("should make API requests with the correct headers", async () => {
    const mockData = { id: "123", name: "User" };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const { result } = renderHook(() => useApi());

    let responseData;
    await act(async () => {
      const response = await result.current.request("/test-endpoint");
      responseData = response.data;
      expect(response.error).toBeNull();
    });

    expect(responseData).toEqual(mockData);

    expect(mockedFetch).toHaveBeenCalledWith(
      "http://test-api.com/test-endpoint",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
        }),
      })
    );
  });

  it("should handle API errors", async () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    const { result } = renderHook(() => useApi());

    let responseData, responseError;
    await act(async () => {
      const response = await result.current.request("/nonexistent", {
        requiresAuth: false, // Skip auth to avoid token issues
      });
      responseData = response.data;
      responseError = response.error;
    });
    
    expect(responseData).toBeNull();
    expect(responseError).toBe("API error: 404 Not Found");
  });

  it("should cache GET requests", async () => {
    const mockData = { id: "123", name: "User" };
    
    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request("/cached-endpoint", { 
        method: "GET",
        cacheResult: true
      });
    });

    expect(mockedFetch).toHaveBeenCalledTimes(1);

    mockedFetch.mockClear();

    await act(async () => {
      await result.current.request("/cached-endpoint", { 
        method: "GET",
        cacheResult: true
      });
    });

    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it("should show success notifications when requested", async () => {
    const mockData = { id: "123", name: "User" };

    mockedFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockData),
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request("/success-endpoint", {
        showSuccessNotification: true,
        successMessage: "Operation was successful!",
      });
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      "Operation was successful!",
      "success"
    );
  });

  it("should show error notifications when requested", async () => {
    // Simulate a network error instead of a server error
    mockedFetch.mockImplementationOnce(() => {
      throw new Error("API error: 500 Server Error");
    });

    const { result } = renderHook(() => useApi());

    await act(async () => {
      await result.current.request("/error-endpoint", {
        showErrorNotification: true,
        requiresAuth: false,
      });
    });

    // Check that the error notification was shown with our specific error message
    expect(mockAddNotification).toHaveBeenCalledWith(
      "API error: 500 Server Error",
      "error"
    );
  });
}); 