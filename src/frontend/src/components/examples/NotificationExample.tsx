import React from 'react';
import { useNotificationContext } from '../../contexts';
import { ExamplesNav } from './ExamplesNav';

export const NotificationExample: React.FC = () => {
  const { addNotification, clearNotifications } = useNotificationContext();

  const handleSuccessClick = () => {
    addNotification('Operation completed successfully!', 'success');
  };

  const handleErrorClick = () => {
    addNotification('An error occurred while processing your request.', 'error');
  };

  const handleInfoClick = () => {
    addNotification('This is an informational message.', 'info');
  };

  const handleWarningClick = () => {
    addNotification('Warning: This action cannot be undone.', 'warning');
  };

  const handlePersistentClick = () => {
    addNotification(
      'This notification will not disappear automatically. You must close it manually.',
      'info',
      0 // Duration of 0 means it won't auto-dismiss
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ExamplesNav />
      
      <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">Notification System Example</h2>
        
        <div className="space-y-2">
          <button
            onClick={handleSuccessClick}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Show Success Notification
          </button>
          
          <button
            onClick={handleErrorClick}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Show Error Notification
          </button>
          
          <button
            onClick={handleInfoClick}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Show Info Notification
          </button>
          
          <button
            onClick={handleWarningClick}
            className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Show Warning Notification
          </button>
          
          <button
            onClick={handlePersistentClick}
            className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Show Persistent Notification
          </button>
          
          <button
            onClick={clearNotifications}
            className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mt-4"
          >
            Clear All Notifications
          </button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Click the buttons above to display different types of notifications.</p>
          <p>Regular notifications will disappear after 5 seconds.</p>
          <p>Persistent notifications will remain until manually closed.</p>
        </div>
      </div>
    </div>
  );
}; 