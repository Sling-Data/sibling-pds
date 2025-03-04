import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import Profile from '../components/Profile';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

describe('Profile Component', () => {
  const mockUserId = 'test-user-123';
  const originalError = console.error;
  const originalLog = console.log;

  beforeEach(() => {
    global.fetch = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    console.error = originalError;
    console.log = originalLog;
  });

  it('renders loading state initially', () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

    render(<Profile userId={mockUserId} />);
    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<Profile userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  it('displays user data when fetch succeeds', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    await act(async () => {
      render(<Profile userId={mockUserId} />);
    });

    await waitFor(() => {
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
      expect(screen.getByText(mockUserData.email)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/users/${mockUserId}`
    );
  });

  it('shows edit form when edit button is clicked', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    await act(async () => {
      render(<Profile userId={mockUserId} />);
    });

    await waitFor(() => {
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    expect(screen.getByLabelText('Name:')).toHaveValue(mockUserData.name);
    expect(screen.getByLabelText('Email:')).toHaveValue(mockUserData.email);
  });

  it('shows validation errors for empty form submission', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    await act(async () => {
      render(<Profile userId={mockUserId} />);
    });

    await waitFor(() => {
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    const nameInput = screen.getByLabelText('Name:');
    const emailInput = screen.getByLabelText('Email:');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: '' } });
      fireEvent.change(emailInput, { target: { value: '' } });
      fireEvent.click(screen.getByText('Save Changes'));
    });

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('successfully updates user profile', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const updatedUserData = {
      name: 'Updated User',
      email: 'updated@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    
    // Initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    // Update request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Profile updated successfully' })
    });

    // Fetch after update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => updatedUserData
    });

    await act(async () => {
      render(<Profile userId={mockUserId} />);
    });

    await waitFor(() => {
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    const nameInput = screen.getByLabelText('Name:');
    const emailInput = screen.getByLabelText('Email:');

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: updatedUserData.name } });
      fireEvent.change(emailInput, { target: { value: updatedUserData.email } });
      fireEvent.click(screen.getByText('Save Changes'));
    });

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
      expect(screen.getByText(updatedUserData.name)).toBeInTheDocument();
      expect(screen.getByText(updatedUserData.email)).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('handles update errors gracefully', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData
      })
      .mockRejectedValueOnce(new Error('Update failed'));

    await act(async () => {
      render(<Profile userId={mockUserId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Enter edit mode
    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    // Wait for edit form to appear
    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'));
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile. Please try again.')).toBeInTheDocument();
    });
  });

  it('cancels edit mode without changes', async () => {
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com'
    };

    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserData
    });

    await act(async () => {
      render(<Profile userId={mockUserId} />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Enter edit mode
    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    // Make changes
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Name:'), {
        target: { value: 'Changed Name' }
      });
    });

    // Cancel edit
    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'));
    });

    // Verify original data is shown
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
}); 