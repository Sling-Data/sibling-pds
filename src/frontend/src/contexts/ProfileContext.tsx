import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useUser } from '../hooks';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  onboardingCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PrivacySettings {
  dataSharing: boolean;
  marketingEmails: boolean;
  thirdPartyAccess: boolean;
}

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  privacySettings: PrivacySettings;
  isUpdating: boolean;
  updateError: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => Promise<boolean>;
}

const defaultPrivacySettings: PrivacySettings = {
  dataSharing: false,
  marketingEmails: false,
  thirdPartyAccess: false
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userId, isAuthenticated } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(defaultPrivacySettings);
  
  // Fetch profile data
  const { 
    data: fetchedProfile, 
    loading: isLoading, 
    error, 
    refetch: refetchProfile 
  } = useFetch<UserProfile>(
    isAuthenticated && userId ? `${process.env.REACT_APP_API_URL}/users/${userId}` : null
  );
  
  // Update profile
  const { 
    loading: isUpdating, 
    error: updateError, 
    update: updateProfileRequest 
  } = useFetch<UserProfile>(null);
  
  // Update state when profile is fetched
  useEffect(() => {
    if (fetchedProfile) {
      setProfile(fetchedProfile);
      
      // In a real app, privacy settings might be part of the profile or a separate endpoint
      // For now, we'll simulate it
      if (fetchedProfile.id) {
        // This would be replaced with actual API data
        setPrivacySettings({
          ...defaultPrivacySettings,
          // Example of how you might extract this from profile data
          dataSharing: localStorage.getItem(`privacy_dataSharing_${fetchedProfile.id}`) === 'true',
          marketingEmails: localStorage.getItem(`privacy_marketingEmails_${fetchedProfile.id}`) === 'true',
          thirdPartyAccess: localStorage.getItem(`privacy_thirdPartyAccess_${fetchedProfile.id}`) === 'true'
        });
      }
    }
  }, [fetchedProfile]);
  
  // Refresh profile
  const refreshProfile = async () => {
    if (isAuthenticated && userId) {
      await refetchProfile();
    }
  };
  
  // Update profile
  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!isAuthenticated || !userId) return false;
    
    try {
      const result = await updateProfileRequest(
        `${process.env.REACT_APP_API_URL}/users/${userId}`,
        {
          method: 'PUT',
          body: data
        }
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data) {
        setProfile(result.data);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };
  
  // Update privacy settings
  const updatePrivacySettings = async (settings: Partial<PrivacySettings>): Promise<boolean> => {
    if (!isAuthenticated || !profile?.id) return false;
    
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate it with localStorage
      const newSettings = { ...privacySettings, ...settings };
      
      // Store in localStorage for simulation
      Object.entries(newSettings).forEach(([key, value]) => {
        localStorage.setItem(`privacy_${key}_${profile.id}`, String(value));
      });
      
      setPrivacySettings(newSettings);
      return true;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      return false;
    }
  };
  
  // Refresh profile when user ID changes
  useEffect(() => {
    if (userId) {
      refreshProfile();
    } else {
      setProfile(null);
      setPrivacySettings(defaultPrivacySettings);
    }
  }, [userId]);
  
  const value = {
    profile,
    isLoading,
    error,
    privacySettings,
    isUpdating,
    updateError,
    refreshProfile,
    updateProfile,
    updatePrivacySettings
  };
  
  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}; 