import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useUser } from '../context/UserContext';
import './Profile.css';

interface UserData {
  name: string;
  email: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

interface PrivacySettings {
  dataSharing: boolean;
}

function Profile() {
  const { userId } = useUser();
  const [shouldRefetch, setShouldRefetch] = useState(0);
  const { data: userData, loading, error: fetchError } = useFetch<UserData>(
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

  // Update formData when userData changes
  useEffect(() => {
    if (userData) {
      setFormData(userData);
    }
  }, [userData]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !userId) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({});

    try {
      const updateResponse = await fetch(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!updateResponse.ok) {
        throw new Error(`HTTP error! status: ${updateResponse.status}`);
      }

      // Trigger a re-fetch by incrementing the counter
      setShouldRefetch(prev => prev + 1);
      
      setSubmitStatus({
        success: true,
        message: 'Profile updated successfully!'
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSubmitStatus({
        success: false,
        message: 'Failed to update profile'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user makes a change
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!userId) {
    return <div>No user ID provided</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (fetchError) {
    return <div>Error: {fetchError}</div>;
  }

  if (!userData) {
    return <div className="error-message">No user data available</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>User Profile</h2>
        {!isEditing && (
          <button 
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        )}
      </div>

      {submitStatus.message && (
        <div className={`submit-status ${submitStatus.success ? 'success' : 'error'}`}>
          {submitStatus.message}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your name"
            />
            {formErrors.name && <div className="error-message">{formErrors.name}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
            />
            {formErrors.email && <div className="error-message">{formErrors.email}</div>}
          </div>

          <div className="button-group">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => {
                setIsEditing(false);
                setFormData(userData);
                setFormErrors({});
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-details">
          <div className="profile-field">
            <label>Name:</label>
            <span>{userData.name}</span>
          </div>
          <div className="profile-field">
            <label>Email:</label>
            <span>{userData.email}</span>
          </div>
        </div>
      )}

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