import React, { useEffect, useState } from 'react';
import { useUser } from '../../hooks/useUser';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { StatusMessage } from '../atoms/StatusMessage';

export const UserExample: React.FC = () => {
  const {
    user,
    loading,
    error,
    fetchUserProfile,
    updateUserProfile,
  } = useUser();
  
  const [username, setUsername] = useState('');
  
  useEffect(() => {
    // Load user profile when component mounts
    fetchUserProfile();
  }, [fetchUserProfile]);
  
  useEffect(() => {
    // Update local state when user data changes
    if (user) {
      setUsername(user.name || '');
    }
  }, [user]);
  
  const handleUpdateProfile = async () => {
    if (username.trim()) {
      await updateUserProfile({ name: username });
    }
  };
  
  return (
    <Card title="User Profile Example">
      {loading && <StatusMessage type="info" message="Loading profile..." />}
      {error && <StatusMessage type="error" message={error} />}
      
      <div className="form-group">
        <label htmlFor="username">Name:</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label>User ID:</label>
        <div>{user?.id || 'Not logged in'}</div>
      </div>
      
      <div className="form-group">
        <label>Email:</label>
        <div>{user?.email || 'No email'}</div>
      </div>
      
      <Button
        onClick={handleUpdateProfile}
        disabled={loading || !username.trim()}
      >
        Update Profile
      </Button>
    </Card>
  );
}; 