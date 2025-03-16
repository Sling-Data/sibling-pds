import React from 'react';
import './Card.css';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Card component for containing content
 */
export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  const cardClasses = ['card', className].filter(Boolean).join(' ');
  
  return (
    <div className={cardClasses}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
}; 