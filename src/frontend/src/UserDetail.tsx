import React, { useState, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
}

const UserDetail: React.FC<{ id: string }> = ({ id }) => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`http://localhost:3000/users/${id}`);
        const data = await response.json();
        if (response.ok) {
          setUser(data);
        } else {
          setError(data.error || 'User not found');
        }
      } catch (err) {
        setError('Failed to fetch user');
      }
    };
    fetchUser();
  }, [id]);

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading...</p>;
  return (
    <div>
      <h2>User Details</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
    </div>
  );
};

export default UserDetail; 