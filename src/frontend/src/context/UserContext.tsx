import { createContext, useContext, useState, ReactNode } from 'react';

interface UserState {
  userId: string | null;
  setUserId: (id: string | null) => void;
}

const UserContext = createContext<UserState | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  initialUserId?: string | null;
}

export function UserProvider({ children, initialUserId = null }: UserProviderProps) {
  const [userId, setUserId] = useState<string | null>(initialUserId);

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