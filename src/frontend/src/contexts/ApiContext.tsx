import React, { createContext, useContext } from 'react';

/**
 * API Context
 * This is a placeholder context to ensure API functionality is available
 * It's kept to maintain compatibility with existing code that might expect it
 */
const ApiContext = createContext<null>(null);

/**
 * API Provider
 * This is now a simple passthrough component that just renders its children
 * API requests are handled by the shared API request function in useApi.ts
 */
export const ApiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ApiContext.Provider value={null}>
      {children}
    </ApiContext.Provider>
  );
};

/**
 * Hook to ensure the ApiProvider is being used
 * This hook doesn't actually provide any values, it just enforces the use of the provider
 */
export const useApiContext = () => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApiContext must be used within an ApiProvider');
  }
  return null;
};

export default ApiContext; 