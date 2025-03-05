// @ts-expect-error React is used implicitly with JSX
import React from 'react';
import { useState } from 'react';
import SignupForm from './SignupForm';
import DataInput from './DataInput';
import Profile from './Profile';
import { UserProvider, useUser } from '../context/UserContext';

function AppContent() {
  const [showProfile, setShowProfile] = useState(false);
  const { userId, setUserId } = useUser();

  const handleSignupSuccess = (newUserId: string) => {
    setUserId(newUserId);
  };

  const handleDataSubmitted = () => {
    setShowProfile(true);
  };

  return (
    <div className="app-container">
      <h1>Hello, Sibling!</h1>
      {!userId ? (
        <SignupForm onSuccess={handleSignupSuccess} />
      ) : showProfile ? (
        <Profile />
      ) : (
        <DataInput userId={userId} onSubmitted={handleDataSubmitted} />
      )}
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App; 