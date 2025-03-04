import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DataInput from '../components/DataInput';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

const mockUserId = 'test-user-123';

describe('DataInput Component', () => {
  const originalError = console.error;
  const originalLog = console.log;

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
    // Mock console methods to silence test output
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    // Restore console methods
    console.error = originalError;
    console.log = originalLog;
  });

  it('renders all form fields', async () => {
    await act(async () => {
      render(<DataInput userId={mockUserId} />);
    });
    
    // Check section headings
    expect(screen.getByText('Interests')).toBeInTheDocument();
    expect(screen.getByText('Primary Goal')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Profession')).toBeInTheDocument();
    expect(screen.getByText('Communication Style')).toBeInTheDocument();
    expect(screen.getByText('Daily Availability')).toBeInTheDocument();
    expect(screen.getByText('Fitness Level')).toBeInTheDocument();
    expect(screen.getByText('Learning Style')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();

    // Check interests checkboxes
    ['Sports', 'Music', 'Art', 'Technology', 'Science', 'Literature'].forEach(interest => {
      expect(screen.getByLabelText(interest)).toBeInTheDocument();
    });

    // Check primary goal dropdown
    const goalSelect = screen.getByRole('combobox', { name: /primary goal/i });
    expect(goalSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fitness' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Career Growth' })).toBeInTheDocument();

    // Check location input
    expect(screen.getByPlaceholderText('Enter your location')).toBeInTheDocument();

    // Check profession dropdown
    const professionSelect = screen.getByRole('combobox', { name: /profession/i });
    expect(professionSelect).toBeInTheDocument();

    // Check communication style radio buttons
    ['Direct', 'Diplomatic', 'Casual', 'Formal'].forEach(style => {
      expect(screen.getByRole('radio', { name: style })).toBeInTheDocument();
    });

    // Check daily availability checkboxes
    ['Morning', 'Afternoon', 'Evening', 'Night'].forEach(time => {
      expect(screen.getByLabelText(time)).toBeInTheDocument();
    });

    // Check fitness level dropdown
    const fitnessSelect = screen.getByRole('combobox', { name: /fitness level/i });
    expect(fitnessSelect).toBeInTheDocument();

    // Check learning style checkboxes
    ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'].forEach(style => {
      expect(screen.getByLabelText(style)).toBeInTheDocument();
    });

    // Check age input
    expect(screen.getByPlaceholderText('Enter your age')).toBeInTheDocument();

    // Check submit button
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    await act(async () => {
      render(<DataInput userId={mockUserId} />);
    });
    
    await act(async () => {
      // Submit empty form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText('Please select at least one interest')).toBeInTheDocument();
      expect(screen.getByText('Please select a primary goal')).toBeInTheDocument();
      expect(screen.getByText('Please enter your location')).toBeInTheDocument();
      expect(screen.getByText('Please select your profession')).toBeInTheDocument();
      expect(screen.getByText('Please select your communication style')).toBeInTheDocument();
      expect(screen.getByText('Please select at least one time slot')).toBeInTheDocument();
      expect(screen.getByText('Please select your fitness level')).toBeInTheDocument();
      expect(screen.getByText('Please select at least one learning style')).toBeInTheDocument();
      expect(screen.getByText('Please enter your age')).toBeInTheDocument();
    });
  });

  it('validates age input correctly', async () => {
    await act(async () => {
      render(<DataInput userId={mockUserId} />);
    });
    
    const ageInput = screen.getByPlaceholderText('Enter your age');
    
    await act(async () => {
      // Test invalid age
      fireEvent.change(ageInput, { target: { value: '10' } });
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid age between 13 and 100')).toBeInTheDocument();
    });

    await act(async () => {
      // Test valid age
      fireEvent.change(ageInput, { target: { value: '25' } });
    });
    expect(screen.queryByText('Please enter a valid age between 13 and 100')).not.toBeInTheDocument();
  });

  it('submits form successfully with valid data', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await act(async () => {
      render(<DataInput userId={mockUserId} />);
    });
    
    await act(async () => {
      // Fill out form
      fireEvent.click(screen.getByLabelText('Sports'));
      fireEvent.change(screen.getByRole('combobox', { name: /primary goal/i }), { target: { value: 'fitness' } });
      fireEvent.change(screen.getByPlaceholderText('Enter your location'), { target: { value: 'London' } });
      fireEvent.change(screen.getByRole('combobox', { name: /profession/i }), { target: { value: 'tech' } });
      fireEvent.click(screen.getByRole('radio', { name: 'Direct' }));
      fireEvent.click(screen.getByLabelText('Morning'));
      fireEvent.change(screen.getByRole('combobox', { name: /fitness level/i }), { target: { value: 'intermediate' } });
      fireEvent.click(screen.getByLabelText('Visual'));
      fireEvent.change(screen.getByPlaceholderText('Enter your age'), { target: { value: '25' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/volunteered-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining(mockUserId)
      });
    });

    // Check success message
    await waitFor(() => {
      expect(screen.getByText('Form submitted successfully!')).toBeInTheDocument();
    });
  });

  it('handles submission error gracefully', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(<DataInput userId={mockUserId} />);
    });
    
    await act(async () => {
      // Fill out form with valid data
      fireEvent.click(screen.getByLabelText('Sports'));
      fireEvent.change(screen.getByRole('combobox', { name: /primary goal/i }), { target: { value: 'fitness' } });
      fireEvent.change(screen.getByPlaceholderText('Enter your location'), { target: { value: 'London' } });
      fireEvent.change(screen.getByRole('combobox', { name: /profession/i }), { target: { value: 'tech' } });
      fireEvent.click(screen.getByRole('radio', { name: 'Direct' }));
      fireEvent.click(screen.getByLabelText('Morning'));
      fireEvent.change(screen.getByRole('combobox', { name: /fitness level/i }), { target: { value: 'intermediate' } });
      fireEvent.click(screen.getByLabelText('Visual'));
      fireEvent.change(screen.getByPlaceholderText('Enter your age'), { target: { value: '25' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Failed to submit form. Please try again.')).toBeInTheDocument();
    });
  });
}); 