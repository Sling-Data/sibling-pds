import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignupForm from './SignupForm';
import LoginForm from './LoginForm';
import DataInput from './DataInput';
import Profile from './Profile';
import ConnectPlaid from './ConnectPlaid';
import { UserProvider, useUser } from '../context/UserContext';

function AppContent() {
  const { userId, setUserId, isAuthenticated } = useUser();

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
            isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <Navigate to="/signup" replace />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/data-input" replace />
            ) : (
              <SignupForm onSuccess={handleSignupSuccess} />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/profile" replace />
            ) : (
              <LoginForm />
            )
          }
        />
        <Route
          path="/data-input"
          element={
            isAuthenticated ? (
              <DataInput userId={userId as string} onSubmitted={() => {}} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <Profile />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/connect-plaid"
          element={
            isAuthenticated ? (
              <ConnectPlaid />
            ) : (
              <Navigate to="/login" replace />
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