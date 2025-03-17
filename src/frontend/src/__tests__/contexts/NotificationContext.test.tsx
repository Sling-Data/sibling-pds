// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationProvider, useNotificationContext } from '../../contexts/NotificationContext';

// Test component that uses the notification context
const TestComponent = () => {
  const { notifications, addNotification, removeNotification, clearNotifications } = useNotificationContext();
  
  return (
    <div>
      <button 
        data-testid="add-success" 
        onClick={() => addNotification('Success message', 'success')}
      >
        Add Success
      </button>
      <button 
        data-testid="add-error" 
        onClick={() => addNotification('Error message', 'error')}
      >
        Add Error
      </button>
      <button 
        data-testid="clear-all" 
        onClick={clearNotifications}
      >
        Clear All
      </button>
      <div data-testid="notification-count">{notifications.length}</div>
      <ul>
        {notifications.map(notification => (
          <li key={notification.id} data-testid={`notification-${notification.id}`}>
            {notification.message} ({notification.type})
            <button 
              data-testid={`remove-${notification.id}`}
              onClick={() => removeNotification(notification.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

describe('NotificationContext', () => {
  it('provides notification functionality to components', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    // Initially no notifications
    expect(screen.getByTestId('notification-count').textContent).toBe('0');
    
    // Add a success notification
    fireEvent.click(screen.getByTestId('add-success'));
    expect(screen.getByTestId('notification-count').textContent).toBe('1');
    expect(screen.getByText(/Success message/)).toBeInTheDocument();
    
    // Add an error notification
    fireEvent.click(screen.getByTestId('add-error'));
    expect(screen.getByTestId('notification-count').textContent).toBe('2');
    expect(screen.getByText(/Error message/)).toBeInTheDocument();
    
    // Remove the first notification
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
    expect(screen.getByTestId('notification-count').textContent).toBe('1');
    
    // Clear all notifications
    fireEvent.click(screen.getByTestId('clear-all'));
    expect(screen.getByTestId('notification-count').textContent).toBe('0');
  });
  
  it('throws an error when used outside of NotificationProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNotificationContext must be used within a NotificationProvider');
    
    // Restore console.error
    console.error = originalError;
  });
}); 