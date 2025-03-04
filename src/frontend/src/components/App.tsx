import { useState } from 'react';
import SignupForm from './SignupForm';
import DataInput from './DataInput';
import Profile from './Profile';

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const handleSignupSuccess = (newUserId: string) => {
    setUserId(newUserId);
  };

  const handleDataSubmitted = () => {
    setShowProfile(true);
  };

  return (
    <div className="app-container">
      <h1>Hello, Sibling!</h1>
      {!userId ? (
        <SignupForm onSignupSuccess={handleSignupSuccess} />
      ) : showProfile ? (
        <Profile userId={userId} />
      ) : (
        <DataInput userId={userId} onSubmitted={handleDataSubmitted} />
      )}
    </div>
  );
}

export default App; 