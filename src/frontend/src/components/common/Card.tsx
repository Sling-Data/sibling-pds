import React from 'react';

export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  children,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
}) => {
  return (
    <div className={`card ${className}`}>
      {(title || subtitle) && (
        <div className={`mb-4 ${headerClassName}`}>
          {title && <h3 className="font-semibold text-xl">{title}</h3>}
          {subtitle && <div className="text-secondary mt-1">{subtitle}</div>}
        </div>
      )}
      
      <div className={bodyClassName}>
        {children}
      </div>
      
      {footer && (
        <div className={`mt-4 pt-3 border-t border-gray-200 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card; 