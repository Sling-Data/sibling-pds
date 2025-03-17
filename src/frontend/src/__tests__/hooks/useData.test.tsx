import { renderHook, act } from "@testing-library/react";
import { useData } from "../../hooks/useData";
import * as TokenManager from "../../utils/TokenManager";
import { VolunteeredData, UserDataSource } from "../../types";

// Mock contexts
jest.mock("../../contexts", () => ({
  useNotificationContext: () => ({
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

describe("useData Hook", () => {
  const mockVolunteeredData: VolunteeredData[] = [
    {
      id: "data-1",
      userId: "user-123",
      name: "Favorite Color",
      value: "Blue",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-01",
    },
    {
      id: "data-2",
      userId: "user-123",
      name: "Home Town",
      value: "New York",
      createdAt: "2023-01-02",
      updatedAt: "2023-01-02",
    },
  ];
  
  const mockDataSources: UserDataSource[] = [
    {
      id: "source-1",
      userId: "user-123",
      source: "google",
      credentials: { token: "abc123" },
      lastSynced: "2023-01-01",
      createdAt: "2023-01-01",
      updatedAt: "2023-01-01",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useData());

    expect(result.current.volunteeredData).toBeNull();
    expect(result.current.behavioralData).toBeNull();
    expect(result.current.externalData).toBeNull();
    expect(result.current.dataSources).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  // Volunteered Data Tests
  it("should fetch volunteered data successfully", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    mockRequest.mockResolvedValueOnce({
      data: mockVolunteeredData,
      error: null,
    });

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.fetchVolunteeredData();
    });

    expect(mockRequest).toHaveBeenCalledWith(
      "/volunteered-data",
      expect.objectContaining({
        method: "GET",
      })
    );

    expect(result.current.volunteeredData).toEqual(mockVolunteeredData);
  });

  it("should create volunteered data successfully", async () => {
    const newDataItem = {
      name: "Favorite Food",
      value: "Pizza",
    };
    
    const createdData = {
      id: "data-3",
      userId: "user-123",
      name: "Favorite Food",
      value: "Pizza",
      createdAt: "2023-01-03",
      updatedAt: "2023-01-03",
    };

    mockRequest.mockResolvedValueOnce({
      data: createdData,
      error: null,
    });

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.createVolunteeredData(newDataItem);
    });

    expect(mockRequest).toHaveBeenCalledWith(
      "/volunteered-data",
      expect.objectContaining({
        method: "POST",
        body: newDataItem,
      })
    );

    expect(result.current.volunteeredData).toEqual([createdData]);
  });

  // Data Sources Test
  it("should fetch data sources successfully", async () => {
    jest.spyOn(TokenManager, "getUserId").mockReturnValue("user-123");

    mockRequest.mockResolvedValueOnce({
      data: mockDataSources,
      error: null,
    });

    const { result } = renderHook(() => useData());

    await act(async () => {
      await result.current.fetchDataSources();
    });

    expect(mockRequest).toHaveBeenCalledWith(
      "/user-data-sources",
      expect.objectContaining({
        method: "GET",
      })
    );

    expect(result.current.dataSources).toEqual(mockDataSources);
  });
}); 