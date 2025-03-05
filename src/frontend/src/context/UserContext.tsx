import { createContext, useContext, useState, ReactNode } from 'react';

interface UserState {
  userId: string | null;
  setUserId: (id: string | null) => void;
}

const UserContext = createContext<UserState | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [userId, setUserId] = useState<string | null>(null);

  const value = {
    userId,
    setUserId
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserState {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext; 