import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useUser } from '../context/UserContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAccessToken } from '../utils/TokenManager';
import '../styles/Profile.css';

// Types
interface UserData {
  name: string;
  email: string;
  // Add other user data fields as needed
}

interface FormErrors {
  name?: string;
  email?: string;
  // Add other form error fields as needed
}

interface PrivacySettings {
  dataSharing: boolean;
  // Add other privacy settings as needed
}

// Helper function to safely use useLocation
const useLocationSafe = () => {
  try {
    return useLocation();
  } catch (e) {
    // Return a mock location object when not in a Router context (for tests)
    return { search: '', pathname: '', state: null, key: '', hash: '' };
  }
};

function Profile() {
  const { userId, refreshTokenIfExpired } = useUser();
  const location = useLocationSafe();
  const navigate = useNavigate();
  const { data: userData, loading: fetchLoading, error: fetchError, refetch } = useFetch<UserData>(
    userId ? `${process.env.REACT_APP_API_URL}/users/${userId}` : null
  );

  // For profile updates, we'll use a separate useFetch instance with a null URL initially
  const { loading: updateLoading, error: updateError, update: updateProfile } = useFetch<{ message: string }>(
    null,
    {
      method: 'PUT',
      skipCache: true
    }
  );

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserData>({ name: '', email: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataSharing: false
  });
  const [authStatus, setAuthStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});

  // Update formData when userData changes
  useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  // Check token validity and refresh if needed on component mount
  useEffect(() => {
    if (userId) {
      refreshTokenIfExpired();
    }
  }, [userId, refreshTokenIfExpired]);

  // Parse query parameters on component mount or location change
  useEffect(() => {
    if (!location || typeof location.search !== 'string') {
      return;
    }
    
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const error = params.get('error');

    if (status === 'success') {
      setAuthStatus({
        success: true,
        message: 'Connected!'
      });
    } else if (error) {
      setAuthStatus({
        success: false,
        message: decodeURIComponent(error)
      });
    } else {
      setAuthStatus({});
    }
  }, [location]);

  const handleGmailConnect = async () => {
    if (userId) {
      // Refresh token if needed before connecting to Gmail
      const refreshSuccessful = await refreshTokenIfExpired();
      if (refreshSuccessful) {
        try {
          // Get the current access token
          const accessToken = getAccessToken();
          
          if (!accessToken) {
            throw new Error('No access token available');
          }
          
          // The simplest approach: directly navigate to the endpoint
          // The browser will automatically include the Authorization header
          // from the current session, and the backend will handle the redirect
          window.location.href = `${process.env.REACT_APP_API_URL}/api/gmail?userId=${userId}&token=${encodeURIComponent(accessToken)}`;
          
        } catch (error) {
          console.error('Error connecting to Gmail:', error);
          setAuthStatus({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to connect to Gmail'
          });
        }
      }
    }
  };

  const handlePlaidConnect = async () => {
    if (userId) {
      // Refresh token if needed before navigating to Plaid connection
      const refreshSuccessful = await refreshTokenIfExpired();
      if (refreshSuccessful) {
        // Navigate to the ConnectPlaid component using react-router
        navigate(`/connect-plaid?userId=${userId}`);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true);
      try {
        // Refresh token if needed before submitting form
        const refreshSuccessful = await refreshTokenIfExpired();
        if (!refreshSuccessful) {
          throw new Error('Authentication failed. Please log in again.');
        }

        // Call updateProfile with the URL and body
        const result = await updateProfile(
          userId ? `${process.env.REACT_APP_API_URL}/users/${userId}` : null,
          {
            method: 'PUT',
            body: formData,
            skipCache: true
          }
        );

        if (result.error) {
          throw new Error(result.error);
        }

        setSubmitStatus({
          success: true,
          message: 'Profile updated successfully!'
        });
        setIsEditing(false);
        refetch();
      } catch (error) {
        setSubmitStatus({
          success: false,
          message: error instanceof Error ? error.message : 'An error occurred. Please try again.'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!userId) {
    return <div className="profile-container">No user ID provided</div>;
  }

  if (fetchLoading) {
    return <div className="profile-container">Loading user data...</div>;
  }

  if (fetchError) {
    return (
      <div className="profile-container error">
        <p>Error: {fetchError}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  // Show loading state during update
  const isUpdating = isSubmitting || updateLoading;

  // Show any update errors
  const displayError = updateError || submitStatus.message;

  return (
    <div className="profile-container">
      <h2>User Profile</h2>
      
      {/* Auth Status Messages */}
      {authStatus.message && (
        <div className={`auth-status ${authStatus.success ? 'success' : 'error'}`}>
          {authStatus.message}
        </div>
      )}
      
      {/* User Info Display */}
      {!isEditing && userData && (
        <div className="user-info">
          <div className="info-row">
            <span className="label">Name:</span>
            <span className="value">{userData.name}</span>
          </div>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value">{userData.email}</span>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="edit-button"
          >
            Edit Profile
          </button>
        </div>
      )}
      
      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && <div className="error-message">{formErrors.name}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={formErrors.email ? 'error' : ''}
            />
            {formErrors.email && <div className="error-message">{formErrors.email}</div>}
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={isUpdating}
              className="save-button"
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              onClick={() => setIsEditing(false)}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
          
          {displayError && (
            <div className={`submit-status ${submitStatus.success ? 'success' : 'error'}`}>
              {displayError}
            </div>
          )}
        </form>
      )}
      
      {/* Connect Services Section */}
      <div className="connect-services">
        <h3>Connect Services</h3>
        <div className="service-buttons">
          <button 
            onClick={handleGmailConnect}
            className="gmail-button"
          >
            Connect Gmail
          </button>
          <button 
            onClick={handlePlaidConnect}
            className="plaid-button"
          >
            Connect Bank Account
          </button>
        </div>
      </div>
      
      {/* Privacy Settings */}
      <div className="privacy-settings">
        <h3>Privacy Settings</h3>
        <div className="setting-item">
          <label htmlFor="dataSharing">
            <input
              type="checkbox"
              id="dataSharing"
              checked={privacySettings.dataSharing}
              onChange={(e) => setPrivacySettings({
                ...privacySettings,
                dataSharing: e.target.checked
              })}
            />
            Allow data sharing with third-party services
          </label>
        </div>
      </div>
    </div>
  );
}

export default Profile;