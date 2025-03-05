// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../components/App';
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
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows DataInput after successful signup', async () => {
    // Mock fetch for signup
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ _id: mockUserId })
      }));

    render(
      <UserProvider>
        <App />
      </UserProvider>
    );

    // Fill out and submit signup form
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for DataInput to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /personal information/i })).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.REACT_APP_API_URL}/users`,
      expect.any(Object)
    );
  });

  it('shows Profile after successful data submission', async () => {
    // Mock fetch for all API calls
    global.fetch = jest.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ _id: mockUserId })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }))
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      }));

    render(
      <UserProvider>
        <App />
      </UserProvider>
    );

    // Fill out and submit signup form
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    // Fill out and submit data form
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /personal information/i })).toBeInTheDocument();
    });

    // Fill out required fields
    fireEvent.change(screen.getByRole('textbox', { name: /location/i }), {
      target: { value: 'New York' },
    });
    
    // Select interests
    fireEvent.click(screen.getByRole('checkbox', { name: /sports/i }));
    
    // Select primary goal
    fireEvent.change(screen.getByRole('combobox', { name: /primary goal/i }), {
      target: { value: 'fitness' },
    });
    
    // Select profession
    fireEvent.change(screen.getByRole('combobox', { name: /profession/i }), {
      target: { value: 'tech' },
    });
    
    // Select communication style
    fireEvent.click(screen.getByRole('radio', { name: /direct/i }));
    
    // Select availability
    fireEvent.click(screen.getByRole('checkbox', { name: /morning/i }));
    
    // Select fitness level
    fireEvent.change(screen.getByRole('combobox', { name: /fitness level/i }), {
      target: { value: 'intermediate' },
    });
    
    // Select learning style
    fireEvent.click(screen.getByRole('checkbox', { name: /visual/i }));
    
    // Enter age
    fireEvent.change(screen.getByRole('spinbutton', { name: /age/i }), {
      target: { value: '25' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Wait for Profile to appear and verify its contents
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /user profile/i })).toBeInTheDocument();
      expect(screen.getByText(mockUserData.name)).toBeInTheDocument();
      expect(screen.getByText(mockUserData.email)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    
    // Verify the signup call
    expect(global.fetch).toHaveBeenNthCalledWith(1, 
      `${process.env.REACT_APP_API_URL}/users`,
      expect.any(Object)
    );
    
    // Verify the data submission call
    expect(global.fetch).toHaveBeenNthCalledWith(2, 
      `${process.env.REACT_APP_API_URL}/volunteered-data`,
      expect.any(Object)
    );
    
    // Verify that the third call was to fetch user data
    const thirdCallUrl = (global.fetch as jest.Mock).mock.calls[2][0];
    expect(thirdCallUrl).toContain(`${process.env.REACT_APP_API_URL}/users/`);
  });
});

