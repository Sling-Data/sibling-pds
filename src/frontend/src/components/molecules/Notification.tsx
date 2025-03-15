import React from 'react';
import { NotificationType } from '../../hooks/useNotification';

interface NotificationProps {
  id: string;
  message: string;
  type: NotificationType;
  onClose: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({ 
  id, 
  message, 
  type, 
  onClose 
}) => {
  const getTypeStyles = (): string => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-500 text-green-700';
      case 'error':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'info':
      default:
        return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  return (
    <div 
      className={`${getTypeStyles()} px-4 py-3 rounded border-l-4 relative mb-4 shadow-md`}
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="absolute top-0 bottom-0 right-0 px-4 py-3"
        aria-label="Close notification"
      >
        <span className="text-xl">&times;</span>
      </button>
    </div>
  );
}; 