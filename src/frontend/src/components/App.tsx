import { useState } from 'react';
import SignupForm from './SignupForm';
import DataInput from './DataInput';

function App() {
  const [userId, setUserId] = useState<string | null>(null);

  const handleSignupSuccess = (newUserId: string) => {
    setUserId(newUserId);
  };

  return (
    <div className="app-container">
      <h1>Hello, Sibling!</h1>
      {userId ? (
        <DataInput userId={userId} />
      ) : (
        <SignupForm onSignupSuccess={handleSignupSuccess} />
      )}
    </div>
  );
}

export default App; 