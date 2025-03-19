import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useUser } from './UserContextOld';
import { VolunteeredData, BehavioralData, ExternalData } from '../types';

interface UserDataContextType {
  // Volunteered data
  volunteeredData: VolunteeredData[];
  isLoadingVolunteeredData: boolean;
  volunteeredDataError: string | null;
  refreshVolunteeredData: () => Promise<void>;
  
  // Behavioral data
  behavioralData: BehavioralData[];
  isLoadingBehavioralData: boolean;
  behavioralDataError: string | null;
  refreshBehavioralData: () => Promise<void>;
  
  // External data
  externalData: ExternalData[];
  isLoadingExternalData: boolean;
  externalDataError: string | null;
  refreshExternalData: () => Promise<void>;
  
  // Combined refresh
  refreshAllData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userId, isAuthenticated } = useUser();
  
  // Volunteered data state
  const [volunteeredData, setVolunteeredData] = useState<VolunteeredData[]>([]);
  const { data: fetchedVolunteeredData, loading: isLoadingVolunteeredData, error: volunteeredDataError, refetch: refetchVolunteeredData } = useFetch<VolunteeredData[]>(
    isAuthenticated ? `${process.env.REACT_APP_API_URL}/volunteered-data` : null
  );
  
  // Behavioral data state
  const [behavioralData, setBehavioralData] = useState<BehavioralData[]>([]);
  const { data: fetchedBehavioralData, loading: isLoadingBehavioralData, error: behavioralDataError, refetch: refetchBehavioralData } = useFetch<BehavioralData[]>(
    isAuthenticated ? `${process.env.REACT_APP_API_URL}/behavioral-data` : null
  );
  
  // External data state
  const [externalData, setExternalData] = useState<ExternalData[]>([]);
  const { data: fetchedExternalData, loading: isLoadingExternalData, error: externalDataError, refetch: refetchExternalData } = useFetch<ExternalData[]>(
    isAuthenticated ? `${process.env.REACT_APP_API_URL}/external-data` : null
  );
  
  // Update state when data is fetched
  useEffect(() => {
    if (fetchedVolunteeredData) {
      setVolunteeredData(fetchedVolunteeredData);
    }
  }, [fetchedVolunteeredData]);
  
  useEffect(() => {
    if (fetchedBehavioralData) {
      setBehavioralData(fetchedBehavioralData);
    }
  }, [fetchedBehavioralData]);
  
  useEffect(() => {
    if (fetchedExternalData) {
      setExternalData(fetchedExternalData);
    }
  }, [fetchedExternalData]);
  
  // Refresh functions
  const refreshVolunteeredData = async () => {
    if (isAuthenticated) {
      await refetchVolunteeredData();
    }
  };
  
  const refreshBehavioralData = async () => {
    if (isAuthenticated) {
      await refetchBehavioralData();
    }
  };
  
  const refreshExternalData = async () => {
    if (isAuthenticated) {
      await refetchExternalData();
    }
  };
  
  const refreshAllData = async () => {
    if (isAuthenticated) {
      await Promise.all([
        refreshVolunteeredData(),
        refreshBehavioralData(),
        refreshExternalData()
      ]);
    }
  };
  
  // Refresh data when user ID changes
  useEffect(() => {
    if (userId) {
      refreshAllData();
    }
  }, [userId]);
  
  const value = {
    // Volunteered data
    volunteeredData,
    isLoadingVolunteeredData,
    volunteeredDataError,
    refreshVolunteeredData,
    
    // Behavioral data
    behavioralData,
    isLoadingBehavioralData,
    behavioralDataError,
    refreshBehavioralData,
    
    // External data
    externalData,
    isLoadingExternalData,
    externalDataError,
    refreshExternalData,
    
    // Combined refresh
    refreshAllData
  };
  
  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = (): UserDataContextType => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}; 