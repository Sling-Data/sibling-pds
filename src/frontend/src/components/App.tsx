import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignupForm from './SignupForm';
import DataInput from './DataInput';
import Profile from './Profile';
import { UserProvider, useUser } from '../context/UserContext';

function AppContent() {
  const { userId, setUserId } = useUser();

  const handleSignupSuccess = (newUserId: string) => {
    setUserId(newUserId);
  };

  return (
    <div className="app-container">
      <h1>Hello, Sibling!</h1>
      <Routes>
        <Route
          path="/"
          element={
            !userId ? (
              <SignupForm onSuccess={handleSignupSuccess} />
            ) : (
              <Navigate to="/data-input" replace />
            )
          }
        />
        <Route
          path="/data-input"
          element={
            userId ? (
              <DataInput userId={userId} onSubmitted={() => {}} />
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            userId ? (
              <Profile />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

interface AppProps {
  router?: React.ComponentType<{ children: React.ReactNode }>;
}

function App({ router: Router = BrowserRouter }: AppProps) {
  return (
    <Router>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Router>
  );
}

export default App; 