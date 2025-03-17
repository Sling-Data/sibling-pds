import { renderHook, act } from '@testing-library/react';
import { useNotification } from '../../hooks/useNotification';

describe('useNotification', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with empty notifications array', () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.notifications).toEqual([]);
  });

  it('should add a notification', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.addNotification('Test message', 'info');
    });
    
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe('Test message');
    expect(result.current.notifications[0].type).toBe('info');
  });

  it('should remove a notification by id', () => {
    const { result } = renderHook(() => useNotification());
    let notificationId: string;
    
    act(() => {
      notificationId = result.current.addNotification('Test message', 'info');
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      result.current.removeNotification(notificationId);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('should clear all notifications', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.addNotification('Test message 1', 'info');
      result.current.addNotification('Test message 2', 'error');
    });
    
    expect(result.current.notifications).toHaveLength(2);
    
    act(() => {
      result.current.clearNotifications();
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('should auto-remove notification after duration', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.addNotification('Test message', 'info', 1000);
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.notifications).toHaveLength(0);
  });

  it('should not auto-remove notification if duration is 0', () => {
    const { result } = renderHook(() => useNotification());
    
    act(() => {
      result.current.addNotification('Test message', 'info', 0);
    });
    
    expect(result.current.notifications).toHaveLength(1);
    
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(result.current.notifications).toHaveLength(1);
  });
}); 