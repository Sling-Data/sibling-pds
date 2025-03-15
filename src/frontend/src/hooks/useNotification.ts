import { useState, useCallback } from "react";

export type NotificationType = "success" | "error" | "info" | "warning";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface UseNotificationResult {
  notifications: Notification[];
  addNotification: (
    message: string,
    type: NotificationType,
    duration?: number
  ) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export function useNotification(): UseNotificationResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Generate a unique ID for notifications
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  // Add a new notification
  const addNotification = useCallback(
    (
      message: string,
      type: NotificationType = "info",
      duration = 5000
    ): string => {
      const id = generateId();

      const notification: Notification = {
        id,
        message,
        type,
        duration,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-remove notification after duration (if duration > 0)
      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    []
  );

  // Remove a notification by ID
  const removeNotification = useCallback((id: string): void => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  // Clear all notifications
  const clearNotifications = useCallback((): void => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  };
}
