import React from 'react';
import { render, screen } from '@testing-library/react';
import { NotificationContainer } from '../../components/organisms/NotificationContainer';
import { NotificationProvider } from '../../context/NotificationContext';
import { useNotificationContext } from '../../context/NotificationContext';

// Mock the Notification component
jest.mock('../../components/molecules/Notification', () => ({
  Notification: ({ id, message, type, onClose }: any) => (
    <div data-testid={`notification-${id}`} data-type={type}>
      {message}
      <button onClick={() => onClose(id)}>Close</button>
    </div>
  )
}));

// Helper component to add notifications for testing
const NotificationAdder = ({ notifications }: { notifications: Array<{ message: string, type: string }> }) => {
  const { addNotification } = useNotificationContext();
  
  React.useEffect(() => {
    notifications.forEach(({ message, type }) => {
      addNotification(message, type as any);
    });
  }, [addNotification, notifications]);
  
  return null;
};

describe('NotificationContainer', () => {
  it('renders nothing when there are no notifications', () => {
    render(
      <NotificationProvider>
        <NotificationContainer />
      </NotificationProvider>
    );
    
    const container = screen.queryByRole('alert');
    expect(container).not.toBeInTheDocument();
  });
  
  it('renders notifications when they exist', () => {
    const notifications = [
      { message: 'Success message', type: 'success' },
      { message: 'Error message', type: 'error' }
    ];
    
    render(
      <NotificationProvider>
        <NotificationAdder notifications={notifications} />
        <NotificationContainer />
      </NotificationProvider>
    );
    
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
}); 