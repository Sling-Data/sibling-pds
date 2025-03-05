import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { UserProvider } from '../context/UserContext';

// Mock the environment variable
process.env.REACT_APP_API_URL = 'http://localhost:3000';

const mockUserId = '123';
const mockUserData = {
  name: 'Test User',
  email: 'test@example.com'
};

describe('App Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Mock fetch for all API calls
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ _id: mockUserId })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows DataInput after successful signup', async () => {
    render(
      <UserProvider>
        <App />
      </UserProvider>
    );

    // Fill out and submit signup form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Create Account'));

    // Wait for DataInput to appear
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('shows Profile after successful data submission', async () => {
    // Mock fetch for user data
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ _id: mockUserId })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }));

    render(
      <UserProvider>
        <App />
      </UserProvider>
    );

    // Fill out and submit signup form
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByText('Create Account'));

    // Fill out and submit data form
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Fill out required fields
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'New York' },
    });
    
    // Select interests
    fireEvent.click(screen.getByLabelText('Sports'));
    
    // Select primary goal
    fireEvent.change(screen.getByLabelText('Primary Goal'), {
      target: { value: 'fitness' },
    });
    
    // Select profession
    fireEvent.change(screen.getByLabelText('Profession'), {
      target: { value: 'tech' },
    });
    
    // Select communication style
    fireEvent.click(screen.getByLabelText('Direct'));
    
    // Select availability
    fireEvent.click(screen.getByLabelText('Morning'));
    
    // Select fitness level
    fireEvent.change(screen.getByLabelText('Fitness Level'), {
      target: { value: 'intermediate' },
    });
    
    // Select learning style
    fireEvent.click(screen.getByLabelText('Visual'));
    
    // Enter age
    fireEvent.change(screen.getByLabelText('Age'), {
      target: { value: '25' },
    });

    // Submit the form
    fireEvent.click(screen.getByText('Submit'));

    // Wait for Profile to appear and verify its contents
    await waitFor(() => {
      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
      expect(screen.getByText(mockUserData.email)).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});

