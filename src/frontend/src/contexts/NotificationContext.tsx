import React, { createContext, useContext, ReactNode } from 'react';
import { useNotification, NotificationType } from '../hooks/useNotification';

interface NotificationContextType {
  notifications: Array<{
    id: string;
    message: string;
    type: NotificationType;
    duration?: number;
  }>;
  addNotification: (message: string, type: NotificationType, duration?: number) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notificationService = useNotification();

  return (
    <NotificationContext.Provider value={notificationService}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}; 