import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useUser } from '../context/UserContext';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const { userId } = useUser();
  const location = useLocationSafe();
  const navigate = useNavigate();
  const [shouldRefetch, setShouldRefetch] = useState(0);
  const { data: userData, loading, error: fetchError, refetch } = useFetch<UserData>(
    userId ? `${process.env.REACT_APP_API_URL}/users/${userId}` : null,
    shouldRefetch
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

  const handleGmailConnect = () => {
    if (userId) {
      // Use window.location.href for external redirects
      window.location.href = `${process.env.REACT_APP_API_URL}/auth/gmail?userId=${userId}`;
    }
  };

  const handlePlaidConnect = () => {
    if (userId) {
      // Navigate to the ConnectPlaid component using react-router
      navigate(`/connect-plaid?userId=${userId}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setPrivacySettings({
      ...privacySettings,
      [name]: checked
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
        const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          setSubmitStatus({
            success: true,
            message: 'Profile updated successfully!'
          });
          setShouldRefetch(prev => prev + 1);
          setIsEditing(false);
        } else {
          const errorData = await response.json();
          setSubmitStatus({
            success: false,
            message: errorData.message || 'Failed to update profile.'
          });
        }
      } catch (error) {
        setSubmitStatus({
          success: false,
          message: 'An error occurred. Please try again.'
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!userId) {
    return <div className="profile-container">No user ID provided</div>;
  }

  if (loading) {
    return <div className="profile-container">Loading user data...</div>;
  }

  if (fetchError) {
    return (
      <div className="profile-container">
        <div className="error-message">Error loading user data: {fetchError}</div>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

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
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        </div>
      )}
      
      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
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
            <label htmlFor="email">Email</label>
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
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="dataSharing"
                checked={privacySettings.dataSharing}
                onChange={handlePrivacyChange}
              />
              Allow data sharing with third parties
            </label>
          </div>
          
          <div className="button-group">
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="save-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          
          {submitStatus.message && (
            <div className={`submit-status ${submitStatus.success ? 'success' : 'error'}`}>
              {submitStatus.message}
            </div>
          )}
        </form>
      )}
      
      {/* External Connections */}
      <div className="external-connections">
        <h3>External Connections</h3>
        
        {authStatus.message && (
          <div className={`auth-status ${authStatus.success ? 'success' : 'error'}`}>
            {authStatus.message}
          </div>
        )}
        
        <div className="connections-content">
          <div className="connection-control">
            <label htmlFor="gmailConnection">Gmail:</label>
            <button
              id="gmailConnection"
              className="connect-button"
              onClick={handleGmailConnect}
            >
              Connect
            </button>
          </div>
          <div className="connection-control">
            <label htmlFor="plaidConnection">Bank Account:</label>
            <button
              id="plaidConnection"
              className="connect-button"
              onClick={handlePlaidConnect}
            >
              Connect
            </button>
          </div>
        </div>
      </div>
      
      {/* Privacy Settings */}
      <div className="privacy-settings">
        <h3>Privacy Settings</h3>
        <div className="privacy-content">
          <p className="privacy-message">
            Coming soon - manage your data sharing preferences
          </p>
          <div className="privacy-control">
            <label htmlFor="dataSharing">Data Sharing:</label>
            <button
              id="dataSharing"
              className={`toggle-button ${privacySettings.dataSharing ? 'active' : ''}`}
              onClick={() => setPrivacySettings(prev => ({
                ...prev,
                dataSharing: !prev.dataSharing
              }))}
              aria-pressed={privacySettings.dataSharing}
            >
              {privacySettings.dataSharing ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;