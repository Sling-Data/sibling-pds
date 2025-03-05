import { renderHook, act } from '@testing-library/react';
import { useFetch, clearCache } from '../hooks/useFetch';

interface User {
  _id: string;
  name: string;
  email: string;
}

const mockUser = {
  _id: '123',
  name: 'Test User',
  email: 'test@example.com',
};

const mockUpdatedUser = {
  _id: '123',
  name: 'Updated User',
  email: 'updated@example.com',
};

describe('useFetch', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    clearCache();
  });

  afterEach(() => {
    jest.resetAllMocks();
    clearCache();
  });

  it('should fetch data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const { result } = renderHook(() =>
      useFetch<User>('http://localhost:3000/users/123')
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(mockUser);
    expect(result.current.fromCache).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should use cached data on subsequent requests', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    // First render
    const { result } = renderHook(() =>
      useFetch<User>('http://localhost:3000/users/123')
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockUser);
    expect(result.current.fromCache).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second render with same URL should use cache
    const { result: result2 } = renderHook(() =>
      useFetch<User>('http://localhost:3000/users/123')
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result2.current.data).toEqual(mockUser);
    expect(result2.current.fromCache).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on network error but not on JSON parsing error', async () => {
    // First request fails with network error, second succeeds
    mockFetch
      .mockImplementationOnce(() => Promise.reject(new TypeError('Failed to fetch')))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser),
      }));

    const { result } = renderHook(() =>
      useFetch<User>('http://localhost:3000/users/123')
    );

    // Wait for both the initial failure and retry
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    expect(result.current.data).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // Reset mock for JSON parsing error test
    mockFetch.mockReset();

    // Request with invalid JSON response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new SyntaxError('Invalid JSON')),
    });

    const { result: result2 } = renderHook(() =>
      useFetch<User>('http://localhost:3000/users/456')
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(result2.current.error).toBe('Invalid JSON response from server');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should refetch and bypass cache when requested', async () => {
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const { result } = renderHook(() =>
      useFetch<User>('http://localhost:3000/users/123')
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockUser);
    expect(result.current.fromCache).toBe(false);

    // Setup mock for refetch with updated data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUpdatedUser),
    });

    // Trigger refetch
    act(() => {
      result.current.refetch();
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.data).toEqual(mockUpdatedUser);
    expect(result.current.fromCache).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});