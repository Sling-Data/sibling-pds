import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import DataInput from '../../../components/pages/DataInput';
import { UserProvider } from '../../../contexts/UserContextOld';

// Mock environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useFetch hook
const mockUpdate = jest.fn();
const mockRefetch = jest.fn();

// Create a function to get the default mock response
const getMockResponse = (data: any = null, loading = false, error = null) => ({
  loading,
  error,
  data,
  update: mockUpdate,
  refetch: mockRefetch,
  fromCache: false
});

jest.mock('../../../hooks/useFetch', () => ({
  useFetch: () => getMockResponse()
}));

// Mock UserContext
const mockUserId = 'test-user-123';
jest.mock('../../../contexts/UserContextOld', () => ({
  ...jest.requireActual('../../../contexts/UserContextOld'),
  useUser: () => ({
    userId: mockUserId
  })
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <UserProvider>
      {children}
    </UserProvider>
  </BrowserRouter>
);

describe('DataInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields', async () => {
    render(<DataInput />, { wrapper: TestWrapper });

    // Check for presence of all form fields
    expect(screen.getByText('Interests')).toBeInTheDocument();
    expect(screen.getByLabelText('Primary Goal')).toBeInTheDocument();
    expect(screen.getByLabelText('Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Profession')).toBeInTheDocument();
    expect(screen.getByText('Communication Style')).toBeInTheDocument();
    expect(screen.getByText('Daily Availability')).toBeInTheDocument();
    expect(screen.getByLabelText('Fitness Level')).toBeInTheDocument();
    expect(screen.getByText('Learning Style')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<DataInput />, { wrapper: TestWrapper });

    // Submit empty form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

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
    render(<DataInput />, { wrapper: TestWrapper });

    const ageInput = screen.getByLabelText('Age');

    // Test invalid age (too young)
    fireEvent.change(ageInput, { target: { value: '10' } });
    await waitFor(() => {
      const errorMessage = screen.getByText((content, element) => {
        return element?.className === 'error-message' && 
               content.toLowerCase().includes('please enter a valid age between 13 and 100');
      });
      expect(errorMessage).toBeInTheDocument();
    });

    // Test invalid age (too old)
    fireEvent.change(ageInput, { target: { value: '101' } });
    await waitFor(() => {
      const errorMessage = screen.getByText((content, element) => {
        return element?.className === 'error-message' && 
               content.toLowerCase().includes('please enter a valid age between 13 and 100');
      });
      expect(errorMessage).toBeInTheDocument();
    });

    // Test valid age
    fireEvent.change(ageInput, { target: { value: '25' } });
    await waitFor(() => {
      const errorMessage = screen.queryByText((content, element) => {
        return element?.className === 'error-message' && 
               content.toLowerCase().includes('please enter a valid age between 13 and 100');
      });
      expect(errorMessage).not.toBeInTheDocument();
    });
  });

  it('submits form successfully with valid data and redirects to profile page', async () => {
    // Mock successful form submission
    mockUpdate.mockResolvedValueOnce({
      data: { success: true },
      error: null
    });

    render(<DataInput />, { wrapper: TestWrapper });

    // Fill in form with valid data
    await act(async () => {
      // Fill in text/number inputs
      fireEvent.change(screen.getByLabelText('Age'), { target: { value: '25' } });
      fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'New York' } });

      // Select dropdowns
      fireEvent.change(screen.getByLabelText('Primary Goal'), { target: { value: 'fitness' } });
      fireEvent.change(screen.getByLabelText('Profession'), { target: { value: 'tech' } });
      fireEvent.change(screen.getByLabelText('Fitness Level'), { target: { value: 'intermediate' } });

      // Select radio button
      fireEvent.click(screen.getByLabelText('Direct'));

      // Select checkboxes
      fireEvent.click(screen.getByLabelText('Sports'));
      fireEvent.click(screen.getByLabelText('Morning'));
      fireEvent.click(screen.getByLabelText('Visual'));

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Verify API call
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/volunteered-data`,
        expect.objectContaining({
          method: 'POST',
          body: expect.objectContaining({
            type: 'onboarding',
            value: expect.objectContaining({
              interests: ['Sports'],
              dailyAvailability: ['Morning'],
              learningStyle: ['Visual']
            })
          })
        })
      );
    });

    // Verify navigation to profile page
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });
  });

  it('handles submission error gracefully', async () => {
    // Mock failed form submission
    mockUpdate.mockResolvedValueOnce({
      data: null,
      error: 'Network error'
    });

    render(<DataInput />, { wrapper: TestWrapper });

    // Fill in form with valid data
    await act(async () => {
      // Fill in text/number inputs
      fireEvent.change(screen.getByLabelText('Age'), { target: { value: '25' } });
      fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'New York' } });

      // Select dropdowns
      fireEvent.change(screen.getByLabelText('Primary Goal'), { target: { value: 'fitness' } });
      fireEvent.change(screen.getByLabelText('Profession'), { target: { value: 'tech' } });
      fireEvent.change(screen.getByLabelText('Fitness Level'), { target: { value: 'intermediate' } });

      // Select radio button
      fireEvent.click(screen.getByLabelText('Direct'));

      // Select checkboxes
      fireEvent.click(screen.getByLabelText('Sports'));
      fireEvent.click(screen.getByLabelText('Morning'));
      fireEvent.click(screen.getByLabelText('Visual'));

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /submit/i }));
    });

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Failed to submit form. Please try again.')).toBeInTheDocument();
    });
  });
});