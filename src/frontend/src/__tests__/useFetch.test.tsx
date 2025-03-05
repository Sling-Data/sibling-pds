import { renderHook, waitFor } from '@testing-library/react';
import { useFetch } from '../hooks/useFetch';

interface TestUser {
  _id: string;
  name: string;
  email: string;
}

const mockUser: TestUser = {
  _id: 'test-123',
  name: 'Test User',
  email: 'test@example.com'
};

describe('useFetch', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('should fetch data successfully', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser
    });

    const { result } = renderHook(() => useFetch<TestUser>('/users/123'));

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for data to be loaded
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockUser);
    expect(result.current.error).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch error', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ status: 'error', message: 'User not found' })
    });

    const { result } = renderHook(() => useFetch<TestUser>('/users/123'));

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Wait for error to be set
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('User not found');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle network error', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFetch<TestUser>('/users/123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Network error');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
}); 