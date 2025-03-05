import { useState } from 'react';
import SignupForm from './components/SignupForm';
import DataInput from './components/DataInput';
import Profile from './components/Profile';
import { UserProvider, useUser } from './context/UserContext';
import './App.css';

function AppContent() {
  const [showDataInput, setShowDataInput] = useState(false);
  const { userId, setUserId } = useUser();

  const handleSignupSuccess = (newUserId: string) => {
    setUserId(newUserId);
    setShowDataInput(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sibling</h1>
      </header>
      <main>
        {!showDataInput ? (
          <SignupForm onSuccess={handleSignupSuccess} />
        ) : userId ? (
          <>
            <Profile />
            <DataInput userId={userId} />
          </>
        ) : null}
      </main>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App; 