import React, { useState, useEffect } from 'react';
import { useApiRequest } from '../../hooks';
import { ExamplesNav } from './ExamplesNav';

interface User {
  id: string;
  name: string;
  email: string;
}

export const ApiRequestExample: React.FC = () => {
  const { request, loading, error, data } = useApiRequest<User[]>();
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      await request({
        url: '/users',
        method: 'GET',
        showErrorNotification: true
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await request({
        url: '/users',
        method: 'POST',
        body: newUser,
        showSuccessNotification: true,
        successMessage: `User ${newUser.name} created successfully!`
      });
      
      // Reset form and refresh user list
      setNewUser({ name: '', email: '' });
      fetchUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };
  
  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await request({
        url: `/users/${userId}`,
        method: 'DELETE',
        showSuccessNotification: true,
        successMessage: `User ${userName} deleted successfully!`
      });
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <ExamplesNav />
      
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">API Request Example</h2>
        
        {/* Create User Form */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-xl font-semibold mb-4">Create New User</h3>
          
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
        
        {/* User List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">User List</h3>
            
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1 px-3 rounded-md text-sm"
            >
              Refresh
            </button>
          </div>
          
          {loading && <p className="text-gray-600">Loading users...</p>}
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>Error: {error.message}</p>
            </div>
          )}
          
          {data && data.length === 0 && (
            <p className="text-gray-600">No users found.</p>
          )}
          
          {data && data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map(user => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 