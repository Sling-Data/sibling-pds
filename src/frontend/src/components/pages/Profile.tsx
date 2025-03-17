import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { useFetch } from '../../hooks/useFetch';
import '../../styles/Profile.css';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { Checkbox } from '../atoms/Checkbox';
import { StatusMessage } from '../atoms/StatusMessage';
import { TextInput } from '../atoms/TextInput';
import { Form } from '../molecules/Form';

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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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
    const message = params.get('message');
    const error = params.get('error');

    if (status === 'success') {
      setAuthStatus({
        success: true,
        message: message || 'Connected!'
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

  // Add effect to hide success message after a delay
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showSuccessMessage) {
      timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000); // Hide after 5 seconds
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSuccessMessage]);

  const handleGmailConnect = async () => {
    if (userId) {
      // Refresh token if needed before connecting to Gmail
      const refreshSuccessful = await refreshTokenIfExpired();
      if (refreshSuccessful) {
        navigate(`/connect-gmail?userId=${userId}`);      }
    }
  };

  const handlePlaidConnect = async () => {
    if (userId) {
      // Refresh token if needed before navigating to Plaid connection
      const refreshSuccessful = await refreshTokenIfExpired();
      if (refreshSuccessful) {
        navigate(`/connect-plaid?userId=${userId}`);      }
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
        setShowSuccessMessage(true);
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
    return <Card className="profile-container">No user ID provided</Card>;
  }

  if (fetchLoading) {
    return <Card className="profile-container">Loading user data...</Card>;
  }

  if (fetchError) {
    return (
      <Card className="profile-container">
        <StatusMessage type="error" message={fetchError} />
        <Button onClick={() => refetch()} variant="primary">Retry</Button>
      </Card>
    );
  }

  // Show loading state during update
  const isUpdating = isSubmitting || updateLoading;

  // Show any update errors
  const displayError = updateError || (submitStatus.success ? null : submitStatus.message);

  return (
    <div className="profile-container">
      <h1 className="profile-title">User Profile</h1>
      
      <Card>
        {/* Auth Status Messages */}
        {authStatus.message && (
          <StatusMessage 
            type={authStatus.success ? "success" : "error"} 
            message={authStatus.message}
          />
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
            <Button 
              onClick={() => setIsEditing(true)}
              variant="secondary"
              size="medium"
            >
              Edit Profile
            </Button>
            
            {showSuccessMessage && submitStatus.success && (
              <div className="success-message-container fade-out">
                <StatusMessage 
                  type="success" 
                  message={submitStatus.message || 'Profile updated successfully!'} 
                />
              </div>
            )}
          </div>
        )}
        
        {/* Edit Form */}
        {isEditing && (
          <Form 
            onSubmit={handleSubmit}
            submitText={isUpdating ? 'Saving...' : 'Save Changes'}
            isSubmitting={isUpdating}
            error={displayError || undefined}
            hideSubmitButton={true}
          >
            <TextInput
              id="name"
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleInputChange}
              error={formErrors.name}
              required
            />
            
            <TextInput
              id="email"
              name="email"
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleInputChange}
              error={formErrors.email}
              required
            />
            
            <div className="form-button-row">
              <Button 
                type="button" 
                onClick={() => setIsEditing(false)}
                variant="secondary"
                size="medium"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isUpdating}
                isLoading={isUpdating}
                variant="primary"
                size="medium"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        )}
      </Card>
      
      {/* Connect Services Section */}
      <Card className="connect-services" title="Connect Services">
        <div className="service-buttons">
          <div className="connect-button-wrapper">
            <Button 
                onClick={handleGmailConnect}
                variant="primary"
              size="medium"
            >
              Connect Gmail
            </Button>
          </div>
          <div className="connect-button-wrapper">
            <Button 
              onClick={handlePlaidConnect}
              variant="primary"
              size="medium"
            >
              Connect Bank Account
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Privacy Settings */}
      <Card className="privacy-settings" title="Privacy Settings">
        <div className="setting-item">
          <Checkbox
            id="dataSharing"
            name="dataSharing"
            label="Allow data sharing with third-party services"
            checked={privacySettings.dataSharing}
            onChange={(e) => setPrivacySettings({
              ...privacySettings,
              dataSharing: e.target.checked
            })}
          />
        </div>
      </Card>
    </div>
  );
}

export default Profile;