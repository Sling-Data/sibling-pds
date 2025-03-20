import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { useAuth } from '../hooks';
import { ApiProvider, NotificationProvider, UserProvider } from '../contexts';
import { AuthProvider } from '../contexts/AuthContext';
import { NotificationContainer } from './organisms/NotificationContainer';
import ConnectGmail from './pages/ConnectGmail';
import ConnectPlaid from './pages/ConnectPlaid';
import DataInput from './pages/DataInput';
import { LoginForm } from './pages/LoginForm';
import Profile from './pages/Profile';
import { SignupForm } from './pages/SignupForm';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {

  return (
    <Routes>
      <Route
        path="/login"
        element={
            <LoginForm />
        }
      />
      <Route
        path="/signup"
        element={
            <SignupForm />
        }
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
      <Route
        path="/connect-gmail"
        element={
          <PrivateRoute>
            <ConnectGmail />
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
      <NotificationProvider>
        <AuthProvider>
          <ApiProvider>
              <UserProvider>
                <AppRoutes />
                <NotificationContainer />
              </UserProvider>
          </ApiProvider>
        </AuthProvider>
      </NotificationProvider>
    </Router>
  );
};

export default App;