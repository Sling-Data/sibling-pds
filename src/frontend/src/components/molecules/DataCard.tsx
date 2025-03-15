import React from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';

interface DataCardProps {
  title: string;
  value: string;
  context?: string;
  createdAt?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * DataCard component for displaying data items
 */
export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  context,
  createdAt,
  onEdit,
  onDelete,
}) => {
  // Format date if provided
  const formattedDate = createdAt 
    ? new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <Card className="mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          {formattedDate && (
            <p className="text-sm text-gray-500 mt-1">Added on {formattedDate}</p>
          )}
        </div>
        <div className="flex space-x-2">
          {onEdit && (
            <Button
              onClick={onEdit}
              variant="secondary"
              size="small"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={onDelete}
              variant="danger"
              size="small"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-gray-700">{value}</p>
        {context && (
          <div className="mt-2 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">{context}</p>
          </div>
        )}
      </div>
    </Card>
  );
}; 