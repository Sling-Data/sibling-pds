import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const ExamplesNav: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const examples = [
    { path: '/notification-example', label: 'Notification Example' },
    { path: '/form-example', label: 'Form Example' },
    { path: '/api-example', label: 'API Request Example' }
  ];
  
  return (
    <div className="bg-gray-100 p-4 mb-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Examples Navigation</h2>
      
      <div className="flex flex-wrap gap-2">
        {examples.map(example => (
          <Link
            key={example.path}
            to={example.path}
            className={`px-4 py-2 rounded-md ${
              isActive(example.path)
                ? 'bg-blue-500 text-white'
                : 'bg-white text-blue-500 hover:bg-blue-100'
            }`}
          >
            {example.label}
          </Link>
        ))}
        
        <Link
          to="/"
          className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Back to App
        </Link>
      </div>
    </div>
  );
}; 