# Contexts

This directory contains React contexts that provide global state management for the application.

## Available Contexts

### NotificationContext

A context for managing global notifications in the application.

```typescript
import { useNotificationContext } from '../contexts';

// In a component
const { addNotification, removeNotification, clearNotifications } = useNotificationContext();

// Add a notification
addNotification('Operation completed successfully!', 'success');

// Remove a notification
removeNotification(notificationId);

// Clear all notifications
clearNotifications();
```

### UserContext

A context for managing user authentication and user data.

```typescript
import { useUser } from '../contexts';

// In a component
const { 
  user, 
  isAuthenticated, 
  login, 
  logout, 
  updateUser 
} = useUser();

// Check if user is authenticated
if (isAuthenticated) {
  // User is logged in
  console.log(user.name);
}

// Login user
await login(email, password);

// Update user data
await updateUser({ name: 'New Name' });

// Logout user
logout();
```

## Using Contexts in Your Application

### Provider Setup

Contexts need to be set up at the root of your application. The order of providers matters if they depend on each other.

```tsx
// In App.tsx
import { 
  UserProvider, 
  NotificationProvider 
} from '../contexts';

const App: React.FC = () => {
  return (
    <NotificationProvider>
      <UserProvider>
        <YourApp />
      </UserProvider>
    </NotificationProvider>
  );
};
```

### Using Context Hooks

Always use the context hooks within components that are children of the corresponding provider.

```tsx
import { useNotificationContext, useUser } from '../contexts';

const YourComponent: React.FC = () => {
  const { addNotification } = useNotificationContext();
  const { user, isAuthenticated } = useUser();
  
  const handleAction = () => {
    if (isAuthenticated) {
      // Do something with user data
      addNotification(`Action completed for ${user.name}`, 'success');
    } else {
      addNotification('Please log in to perform this action', 'warning');
    }
  };
  
  return (
    <button onClick={handleAction}>
      Perform Action
    </button>
  );
};
```

## Best Practices

1. **Import from the index file**: Always import contexts from the index file rather than directly from their individual files:

```typescript
// Good
import { useUser, NotificationProvider } from '../contexts';

// Avoid
import { useUser } from '../contexts/UserContext';
import { NotificationProvider } from '../contexts/NotificationContext';
```

2. **Provider order**: Place providers in the correct order based on dependencies:

```tsx
// Good - NotificationProvider doesn't depend on UserProvider
<NotificationProvider>
  <UserProvider>
    <App />
  </UserProvider>
</NotificationProvider>

// Avoid - if UserProvider uses notifications internally
<UserProvider>
  <NotificationProvider>
    <App />
  </NotificationProvider>
</UserProvider>
```

3. **Error handling**: Always handle errors from context methods that can throw them:

```typescript
// Good
try {
  await login(email, password);
  addNotification('Login successful', 'success');
} catch (error) {
  addNotification(`Login failed: ${error.message}`, 'error');
}

// Avoid
await login(email, password);
```

4. **Context vs. Props**: Use contexts for truly global state. For component-specific state or for state that only needs to be shared between a few components, consider using props or a more local state management approach.

5. **Testing**: When testing components that use contexts, make sure to wrap them in the appropriate providers:

```tsx
// In your test
import { render } from '@testing-library/react';
import { NotificationProvider } from '../contexts';
import YourComponent from './YourComponent';

test('your component works correctly', () => {
  render(
    <NotificationProvider>
      <YourComponent />
    </NotificationProvider>
  );
  
  // Your test assertions
});
``` 