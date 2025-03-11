import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import Profile from './Profile';
import DataInput from './DataInput';
import ConnectPlaid from './ConnectPlaid';
import { UserProvider, useUser } from '../context/UserContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useUser();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useUser();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/profile" /> : <LoginForm />}
      />
      <Route
        path="/signup"
        element={isAuthenticated ? <Navigate to="/data-input" /> : <SignupForm />}
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/data-input"
        element={
          <PrivateRoute>
            <DataInput />
          </PrivateRoute>
        }
      />
      <Route
        path="/connect-plaid"
        element={
          <PrivateRoute>
            <ConnectPlaid />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </Router>
  );
};

export default App;