import React from 'react';
import { StatusMessageProps } from '../../types';
import { SuccessIcon, ErrorIcon, InfoIcon, WarningIcon, CloseIcon } from './Icons';
import './StatusMessage.css';

/**
 * StatusMessage component for displaying status messages
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type,
  onDismiss,
  className = '',
}) => {
  const messageClasses = [
    'status-message',
    `status-message-${type}`,
    className
  ].filter(Boolean).join(' ');
  
  const iconClasses = [
    'status-message-icon',
    `status-message-icon-${type}`
  ].join(' ');
  
  const icons = {
    success: <SuccessIcon className={iconClasses} />,
    error: <ErrorIcon className={iconClasses} />,
    info: <InfoIcon className={iconClasses} />,
    warning: <WarningIcon className={iconClasses} />
  };

  return (
    <div className={messageClasses}>
      <div className="status-message-content-wrapper">
        <div className="status-message-icon-wrapper">
          {icons[type]}
        </div>
        <div className="status-message-content">
          <p className="status-message-text">{message}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          className="status-message-dismiss"
          onClick={onDismiss}
        >
          <span className="sr-only">Dismiss</span>
          <CloseIcon className="status-message-dismiss-icon" />
        </button>
      )}
    </div>
  );
}; 