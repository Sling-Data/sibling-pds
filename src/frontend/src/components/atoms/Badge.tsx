import React from 'react';

interface BadgeProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
}

/**
 * Badge component for displaying status or labels
 */
export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'medium',
}) => {
  // Variant styles
  const variantStyles = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-indigo-100 text-indigo-800',
  };

  // Size styles
  const sizeStyles = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-2.5 py-0.5',
    large: 'text-base px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {text}
    </span>
  );
}; 