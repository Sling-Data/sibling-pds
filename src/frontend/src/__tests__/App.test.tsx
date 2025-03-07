// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../components/App';
import { UserProvider } from '../context/UserContext';
import { MemoryRouter } from 'react-router-dom';

// Mock the environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

// Helper function to render App with context
const renderApp = (initialUserId: string | null = null) => {
  return render(
    <UserProvider initialUserId={initialUserId}>
      <App router={MemoryRouter} />
    </UserProvider>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset fetch mock
    global.fetch = jest.fn();
  });

  it('shows DataInput after successful signup', async () => {
    const mockUserId = '123';
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ _id: mockUserId }),
      });

    renderApp();

    // Fill in the signup form
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const form = screen.getByRole('form');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the form
    fireEvent.submit(form);

    // Wait for fetch to complete and navigation to occur
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Wait for data input page to load
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows Profile after successful data submission', async () => {
    const mockUserId = '123';
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ _id: mockUserId }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test User', email: 'test@example.com' }),
      });

    renderApp();

    // Fill in the signup form
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const signupForm = screen.getByRole('form');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the signup form
    fireEvent.submit(signupForm);

    // Wait for data input page to load
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Fill in the data input form
    const locationInput = screen.getByLabelText(/location/i);
    const ageInput = screen.getByLabelText(/age/i);
    const professionSelect = screen.getByLabelText(/profession/i);
    const primaryGoalSelect = screen.getByLabelText(/primary goal/i);
    const dataInputForm = screen.getByRole('button', { name: /submit/i });

    // Select interests
    const sportsCheckbox = screen.getByLabelText(/sports/i);
    fireEvent.click(sportsCheckbox);

    // Select communication style
    const directRadio = screen.getByLabelText(/direct/i);
    fireEvent.click(directRadio);

    // Select daily availability
    const morningCheckbox = screen.getByLabelText(/morning/i);
    fireEvent.click(morningCheckbox);

    // Select learning style
    const visualCheckbox = screen.getByLabelText(/visual/i);
    fireEvent.click(visualCheckbox);

    // Fill in other fields
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    fireEvent.change(ageInput, { target: { value: '25' } });
    fireEvent.change(professionSelect, { target: { value: 'tech' } });
    fireEvent.change(primaryGoalSelect, { target: { value: 'career' } });

    // Select fitness level
    const fitnessLevelSelect = screen.getByLabelText(/fitness level/i);
    fireEvent.change(fitnessLevelSelect, { target: { value: 'intermediate' } });

    // Submit the data input form
    fireEvent.submit(dataInputForm);

    // Navigate to profile page
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Connected Services' })).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('redirects to profile page when user is authenticated and has submitted data', async () => {
    const mockUserId = '123';

    // Mock the user data fetch and data submission status
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ _id: mockUserId }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'Test User', email: 'test@example.com' }),
      });

    renderApp();

    // Fill in the signup form
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const signupForm = screen.getByRole('form');

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit the signup form
    fireEvent.submit(signupForm);

    // Wait for data input form to load
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Fill in the data input form
    const locationInput = screen.getByLabelText(/location/i);
    const ageInput = screen.getByLabelText(/age/i);
    const professionSelect = screen.getByLabelText(/profession/i);
    const primaryGoalSelect = screen.getByLabelText(/primary goal/i);
    const dataInputForm = screen.getByRole('button', { name: /submit/i });

    // Select interests
    const sportsCheckbox = screen.getByLabelText(/sports/i);
    fireEvent.click(sportsCheckbox);

    // Select communication style
    const directRadio = screen.getByLabelText(/direct/i);
    fireEvent.click(directRadio);

    // Select daily availability
    const morningCheckbox = screen.getByLabelText(/morning/i);
    fireEvent.click(morningCheckbox);

    // Select learning style
    const visualCheckbox = screen.getByLabelText(/visual/i);
    fireEvent.click(visualCheckbox);

    // Fill in other fields
    fireEvent.change(locationInput, { target: { value: 'New York' } });
    fireEvent.change(ageInput, { target: { value: '25' } });
    fireEvent.change(professionSelect, { target: { value: 'tech' } });
    fireEvent.change(primaryGoalSelect, { target: { value: 'career' } });

    // Select fitness level
    const fitnessLevelSelect = screen.getByLabelText(/fitness level/i);
    fireEvent.change(fitnessLevelSelect, { target: { value: 'intermediate' } });

    // Submit the data input form
    fireEvent.submit(dataInputForm);

    // Wait for profile page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Connected Services' })).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

