import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFetch } from '../hooks/useFetch';
import { useUser } from './UserContextOld';
import { UserDataSource } from '../types';

interface UserDataSourcesContextType {
  dataSources: UserDataSource[];
  isLoading: boolean;
  error: string | null;
  refreshDataSources: () => Promise<void>;
  connectDataSource: (source: string, credentials: any) => Promise<boolean>;
  disconnectDataSource: (sourceId: string) => Promise<boolean>;
}

const UserDataSourcesContext = createContext<UserDataSourcesContextType | undefined>(undefined);

export const UserDataSourcesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userId, isAuthenticated } = useUser();
  const [dataSources, setDataSources] = useState<UserDataSource[]>([]);
  
  // Fetch data sources
  const { 
    data: fetchedDataSources, 
    loading: isLoading, 
    error, 
    refetch: refetchDataSources,
    update: updateDataSources
  } = useFetch<UserDataSource[]>(
    isAuthenticated ? `${process.env.REACT_APP_API_URL}/user-data-sources` : null
  );
  
  // Update state when data is fetched
  useEffect(() => {
    if (fetchedDataSources) {
      setDataSources(fetchedDataSources);
    }
  }, [fetchedDataSources]);
  
  // Refresh data sources
  const refreshDataSources = async () => {
    if (isAuthenticated) {
      await refetchDataSources();
    }
  };
  
  // Connect a new data source
  const connectDataSource = async (source: string, credentials: any): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    try {
      const result = await updateDataSources(
        `${process.env.REACT_APP_API_URL}/user-data-sources`,
        {
          method: 'POST',
          body: {
            source,
            credentials
          }
        }
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      await refreshDataSources();
      return true;
    } catch (error) {
      console.error('Error connecting data source:', error);
      return false;
    }
  };
  
  // Disconnect a data source
  const disconnectDataSource = async (sourceId: string): Promise<boolean> => {
    if (!isAuthenticated) return false;
    
    try {
      const result = await updateDataSources(
        `${process.env.REACT_APP_API_URL}/user-data-sources/${sourceId}`,
        {
          method: 'DELETE'
        }
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      await refreshDataSources();
      return true;
    } catch (error) {
      console.error('Error disconnecting data source:', error);
      return false;
    }
  };
  
  // Refresh data sources when user ID changes
  useEffect(() => {
    if (userId) {
      refreshDataSources();
    }
  }, [userId]);
  
  const value = {
    dataSources,
    isLoading,
    error,
    refreshDataSources,
    connectDataSource,
    disconnectDataSource
  };
  
  return (
    <UserDataSourcesContext.Provider value={value}>
      {children}
    </UserDataSourcesContext.Provider>
  );
};

export const useUserDataSources = (): UserDataSourcesContextType => {
  const context = useContext(UserDataSourcesContext);
  if (context === undefined) {
    throw new Error('useUserDataSources must be used within a UserDataSourcesProvider');
  }
  return context;
}; 