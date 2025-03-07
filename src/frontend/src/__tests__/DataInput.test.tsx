import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import DataInput from '../components/DataInput';
import * as router from 'react-router-dom';

// Mock Navigate component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Navigate: jest.fn(() => null)
}));

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

const mockUserId = 'test-user-123';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <router.MemoryRouter initialEntries={['/data-input']}>
      <router.Routes>
        <router.Route path="/data-input" element={component} />
        <router.Route path="/profile" element={<div>Profile Page</div>} />
      </router.Routes>
    </router.MemoryRouter>
  );
};

describe('DataInput Component', () => {
  const originalError = console.error;
  const originalLog = console.log;

  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
    // Mock console methods to silence test output
    console.error = jest.fn();
    console.log = jest.fn();
    // Reset Navigate mock
    (router.Navigate as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
    // Restore console methods
    console.error = originalError;
    console.log = originalLog;
  });

  it('renders all form fields', async () => {
    await act(async () => {
      renderWithRouter(<DataInput userId={mockUserId} />);
    });
    
    // Check main heading
    expect(screen.getByRole('heading', { name: 'Personal Information' })).toBeInTheDocument();

    // Check form groups
    expect(screen.getByText('Interests')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /primary goal/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /location/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /profession/i })).toBeInTheDocument();
    expect(screen.getByText('Communication Style')).toBeInTheDocument();
    expect(screen.getByText('Daily Availability')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /fitness level/i })).toBeInTheDocument();
    expect(screen.getByText('Learning Style')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /age/i })).toBeInTheDocument();

    // Check interests checkboxes
    ['Sports', 'Music', 'Art', 'Technology', 'Science', 'Literature'].forEach(interest => {
      expect(screen.getByRole('checkbox', { name: interest })).toBeInTheDocument();
    });

    // Check primary goal dropdown
    const goalSelect = screen.getByRole('combobox', { name: /primary goal/i });
    expect(goalSelect).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fitness' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Career Growth' })).toBeInTheDocument();

    // Check location input
    expect(screen.getByRole('textbox', { name: /location/i })).toBeInTheDocument();

    // Check profession dropdown
    const professionSelect = screen.getByRole('combobox', { name: /profession/i });
    expect(professionSelect).toBeInTheDocument();

    // Check communication style radio buttons
    ['Direct', 'Diplomatic', 'Casual', 'Formal'].forEach(style => {
      expect(screen.getByRole('radio', { name: style })).toBeInTheDocument();
    });

    // Check daily availability checkboxes
    ['Morning', 'Afternoon', 'Evening', 'Night'].forEach(time => {
      expect(screen.getByRole('checkbox', { name: time })).toBeInTheDocument();
    });

    // Check fitness level dropdown
    const fitnessSelect = screen.getByRole('combobox', { name: /fitness level/i });
    expect(fitnessSelect).toBeInTheDocument();

    // Check learning style checkboxes
    ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'].forEach(style => {
      expect(screen.getByRole('checkbox', { name: style })).toBeInTheDocument();
    });

    // Check age input
    expect(screen.getByRole('spinbutton', { name: /age/i })).toBeInTheDocument();

    // Check submit button
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    await act(async () => {
      renderWithRouter(<DataInput userId={mockUserId} />);
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
    renderWithRouter(<DataInput userId={mockUserId} />);
    
    // Fill out required fields to isolate age validation
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sports' }));
    fireEvent.change(screen.getByRole('combobox', { name: /primary goal/i }), { target: { value: 'fitness' } });
    fireEvent.change(screen.getByRole('textbox', { name: /location/i }), { target: { value: 'London' } });
    fireEvent.change(screen.getByRole('combobox', { name: /profession/i }), { target: { value: 'tech' } });
    fireEvent.click(screen.getByRole('radio', { name: 'Direct' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Morning' }));
    fireEvent.change(screen.getByRole('combobox', { name: /fitness level/i }), { target: { value: 'intermediate' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Visual' }));
    
    const ageInput = screen.getByRole('spinbutton', { name: /age/i });
    
    // Test invalid age
    fireEvent.change(ageInput, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid age between 13 and 100')).toBeInTheDocument();
    });

    // Test valid age
    fireEvent.change(ageInput, { target: { value: '25' } });
    
    // Verify error message is cleared
    expect(screen.queryByText('Please enter a valid age between 13 and 100')).not.toBeInTheDocument();
  });

  it('submits form successfully with valid data and redirects to profile page', async () => {
    const mockFetch = global.fetch as jest.Mock;
    const mockOnSubmitted = jest.fn();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await act(async () => {
      renderWithRouter(<DataInput userId={mockUserId} onSubmitted={mockOnSubmitted} />);
    });
    
    // Fill out form with valid data
    await act(async () => {
      // Interests (at least one required)
      fireEvent.click(screen.getByRole('checkbox', { name: 'Sports' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Music' }));
      // Primary goal (required)
      fireEvent.change(screen.getByRole('combobox', { name: /primary goal/i }), { target: { value: 'fitness' } });
      // Location (required)
      fireEvent.change(screen.getByRole('textbox', { name: /location/i }), { target: { value: 'London' } });
      // Profession (required)
      fireEvent.change(screen.getByRole('combobox', { name: /profession/i }), { target: { value: 'tech' } });
      // Communication style (required)
      fireEvent.click(screen.getByRole('radio', { name: 'Direct' }));
      // Daily availability (at least one required)
      fireEvent.click(screen.getByRole('checkbox', { name: 'Morning' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Evening' }));
      // Fitness level (required)
      fireEvent.change(screen.getByRole('combobox', { name: /fitness level/i }), { target: { value: 'intermediate' } });
      // Learning style (at least one required)
      fireEvent.click(screen.getByRole('checkbox', { name: 'Visual' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Auditory' }));
      // Age (required, between 13-100)
      fireEvent.change(screen.getByRole('spinbutton', { name: /age/i }), { target: { value: '25' } });
    });

    // Submit form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Verify no validation errors are present
    expect(screen.queryByText('Please select at least one interest')).not.toBeInTheDocument();
    expect(screen.queryByText('Please select a primary goal')).not.toBeInTheDocument();
    expect(screen.queryByText('Please enter your location')).not.toBeInTheDocument();
    expect(screen.queryByText('Please select your profession')).not.toBeInTheDocument();
    expect(screen.queryByText('Please select your communication style')).not.toBeInTheDocument();
    expect(screen.queryByText('Please select at least one time slot')).not.toBeInTheDocument();
    expect(screen.queryByText('Please select your fitness level')).not.toBeInTheDocument();
    expect(screen.queryByText('Please select at least one learning style')).not.toBeInTheDocument();
    expect(screen.queryByText('Please enter a valid age between 13 and 100')).not.toBeInTheDocument();

    // Verify API call with complete data
    expect(mockFetch).toHaveBeenCalledWith(`${process.env.REACT_APP_API_URL}/volunteered-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'onboarding',
        value: JSON.stringify({
          interests: ['Sports', 'Music'],
          primaryGoal: 'fitness',
          location: 'London',
          profession: 'tech',
          communicationStyle: 'Direct',
          dailyAvailability: ['Morning', 'Evening'],
          fitnessLevel: 'intermediate',
          learningStyle: ['Visual', 'Auditory'],
          age: '25'
        }),
        userId: mockUserId
      })
    });

    // Verify onSubmitted callback was called
    expect(mockOnSubmitted).toHaveBeenCalled();

    // Verify redirection to profile page
    await waitFor(() => {
      expect(router.Navigate).toHaveBeenCalledWith(expect.objectContaining({ to: '/profile' }), {});
    });
  });

  it('handles submission error gracefully', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      renderWithRouter(<DataInput userId={mockUserId} />);
    });
    
    await act(async () => {
      // Fill out form with valid data
      fireEvent.click(screen.getByRole('checkbox', { name: 'Sports' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Music' }));
      fireEvent.change(screen.getByRole('combobox', { name: /primary goal/i }), { target: { value: 'fitness' } });
      fireEvent.change(screen.getByRole('textbox', { name: /location/i }), { target: { value: 'London' } });
      fireEvent.change(screen.getByRole('combobox', { name: /profession/i }), { target: { value: 'tech' } });
      fireEvent.click(screen.getByRole('radio', { name: 'Direct' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Morning' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Evening' }));
      fireEvent.change(screen.getByRole('combobox', { name: /fitness level/i }), { target: { value: 'intermediate' } });
      fireEvent.click(screen.getByRole('checkbox', { name: 'Visual' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Auditory' }));
      fireEvent.change(screen.getByRole('spinbutton', { name: /age/i }), { target: { value: '25' } });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Check error message
    await waitFor(() => {
      expect(screen.getByText('Failed to submit form. Please try again.')).toBeInTheDocument();
    });

    // Verify we did not redirect
    expect(router.Navigate).not.toHaveBeenCalled();
  });
}); 