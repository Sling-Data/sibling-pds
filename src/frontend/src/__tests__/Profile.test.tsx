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

  it('shows loading state initially', async () => {
    const mockFetch = global.fetch as jest.Mock;
    // Add a delay to the mock fetch to ensure loading state is visible
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    await act(async () => {
      render(<Profile userId={mockUserId} />);
    });

    expect(screen.getByText(/Loading profile.../i)).toBeInTheDocument();
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
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/users/${mockUserId}`
    );
  });

  it('shows error message when fetch fails', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    await act(async () => {
      render(<Profile userId={mockUserId} />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load user profile/i)).toBeInTheDocument();
    });
  });

  it('enables editing mode when edit button is clicked', async () => {
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

    await act(async () => {
      fireEvent.click(screen.getByText('Edit Profile'));
    });

    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('validates form fields before submission', async () => {
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

    // Clear fields
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Name:'), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText('Email:'), { target: { value: '' } });
      fireEvent.click(screen.getByText('Save Changes'));
    });

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();

    // Test invalid email
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Name:'), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('Email:'), { target: { value: 'invalid-email' } });
      fireEvent.click(screen.getByText('Save Changes'));
    });

    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
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
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedUserData
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

    // Update fields
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Name:'), {
        target: { value: updatedUserData.name }
      });
      fireEvent.change(screen.getByLabelText('Email:'), {
        target: { value: updatedUserData.email }
      });
      fireEvent.click(screen.getByText('Save Changes'));
    });

    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
      expect(screen.getByText(updatedUserData.name)).toBeInTheDocument();
      expect(screen.getByText(updatedUserData.email)).toBeInTheDocument();
    });

    // Verify both the PUT and GET requests were made
    expect(mockFetch).toHaveBeenNthCalledWith(1, 
      `${process.env.REACT_APP_API_URL}/users/${mockUserId}`
    );
    expect(mockFetch).toHaveBeenNthCalledWith(2, 
      `${process.env.REACT_APP_API_URL}/users/${mockUserId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUserData)
      }
    );
    expect(mockFetch).toHaveBeenNthCalledWith(3, 
      `${process.env.REACT_APP_API_URL}/users/${mockUserId}`
    );
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