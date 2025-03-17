# Custom Hooks

This directory contains custom React hooks that provide reusable functionality across the application.

## Available Hooks

### useApi

A powerful hook for making API requests with advanced features like caching, retries, and authentication.

```typescript
import { useApi } from '../hooks';

// Use without initial fetch
const { request, loading, error, data } = useApi<User[]>();

// Make a request
const fetchUsers = async () => {
  const response = await request('/users', {
    method: 'GET',
    showErrorNotification: true
  });
  
  if (response.data) {
    console.log('Users:', response.data);
  }
};

// Use with initial fetch
const { data: user, loading, error, refetch } = useApi<User>(`/users/123`);

// Refetch data
const handleRefresh = () => {
  refetch();
};

// Use in your component
return (
  <div>
    {loading && <Spinner />}
    {error && <ErrorMessage message={error.message} />}
    {data && <UserProfile user={data} />}
    <Button onClick={handleRefresh} disabled={loading}>Refresh</Button>
  </div>
);
```

### useAuth

A hook for authentication state and operations.

```typescript
import { useAuth } from '../hooks';

const { 
  isAuthenticated, 
  isInitialized,
  login, 
  signup, 
  logout, 
  checkAuth 
} = useAuth();

// Log in a user
const handleLogin = async (credentials) => {
  const response = await login(credentials);
  if (response.data) {
    // Redirect or perform additional actions
  }
};

// Sign up a new user
const handleSignup = async (credentials) => {
  const response = await signup(credentials);
  if (response.data) {
    // Redirect or perform additional actions
  }
};

// Log out
const handleLogout = () => {
  logout();
};

// Check if user is authenticated (and redirect if not)
useEffect(() => {
  checkAuth('/login');
}, [checkAuth]);

// Use in your component
return (
  <div>
    {!isInitialized && <Spinner />}
    {isAuthenticated ? (
      <Button onClick={handleLogout}>Log Out</Button>
    ) : (
      <LoginForm onSubmit={handleLogin} />
    )}
  </div>
);
```

### useUser

A hook for user data and operations.

```typescript
import { useUser } from '../hooks';

const { 
  user, 
  loading, 
  error,
  fetchUserProfile, 
  updateUserProfile
} = useUser();

// Fetch user profile on component mount
useEffect(() => {
  fetchUserProfile();
}, [fetchUserProfile]);

// Update user profile
const handleProfileUpdate = async (userData) => {
  const response = await updateUserProfile(userData);
  if (response.data) {
    // Show success message or perform additional actions
  }
};

// Handle navigation based on user state
const checkUserAndNavigate = async () => {
  await checkUserDataAndNavigate('/login');
};

// Use in your component
return (
  <div>
    {loading && <Spinner />}
    {error && <ErrorMessage message={error} />}
    {user && (
      <ProfileForm 
        initialValues={user} 
        onSubmit={handleProfileUpdate} 
        isSubmitting={loading}
      />
    )}
  </div>
);
```

### useData

A hook for data operations.

```typescript
import { useData } from '../hooks';

const { 
  volunteeredData, 
  loading, 
  error,
  fetchVolunteeredData,
  createVolunteeredData,
  updateVolunteeredData,
  deleteVolunteeredData,
  fetchDataSources,
  connectDataSource,
  disconnectDataSource
} = useData();

// Fetch data on component mount
useEffect(() => {
  fetchVolunteeredData();
  fetchDataSources();
}, [fetchVolunteeredData, fetchDataSources]);

// Create new data
const handleDataSubmit = async (data) => {
  const response = await createVolunteeredData(data);
  if (response.data) {
    // Show success message or perform additional actions
  }
};

// Update data
const handleDataUpdate = async (id, data) => {
  const response = await updateVolunteeredData(id, data);
  if (response.data) {
    // Show success message or perform additional actions
  }
};

// Delete data
const handleDataDelete = async (id) => {
  const response = await deleteVolunteeredData(id);
  if (!response.error) {
    // Show success message or perform additional actions
  }
};

// Connect a data source
const handleConnectSource = async (source) => {
  const response = await connectDataSource(source);
  if (response.data) {
    // Show success message or perform additional actions
  }
};

// Use in your component
return (
  <div>
    {loading && <Spinner />}
    {error && <ErrorMessage message={error} />}
    <h2>Your Data</h2>
    {volunteeredData && (
      <DataTable 
        data={volunteeredData} 
        onUpdate={handleDataUpdate}
        onDelete={handleDataDelete}
      />
    )}
    <DataForm onSubmit={handleDataSubmit} />
  </div>
);
```

### useNotification

A hook for managing notifications in the application.

```typescript
import { useNotification } from '../hooks';

const {
  notifications,
  addNotification,
  removeNotification,
  clearNotifications
} = useNotification();

// Add a notification
addNotification('Operation completed successfully!', 'success');

// Add a notification with custom duration (in milliseconds)
addNotification('This will disappear in 10 seconds', 'info', 10000);

// Add a persistent notification (won't auto-dismiss)
addNotification('This requires manual dismissal', 'warning', 0);

// Remove a specific notification
removeNotification(notificationId);

// Clear all notifications
clearNotifications();
```

### useForm

A hook for managing form state, validation, and submission.

```typescript
import { useForm } from '../hooks';

// Define your form values type
interface FormValues {
  name: string;
  email: string;
  age: string;
  terms: boolean;
}

// Define your validation function
const validate = (values: FormValues) => {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  
  if (!values.name) {
    errors.name = 'Name is required';
  }
  
  if (!values.email) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Email is invalid';
  }
  
  return errors;
};

// Initialize the form with initial values and validation
const {
  values,
  errors,
  touched,
  isSubmitting,
  handleChange,
  handleBlur,
  handleSubmit,
  setFieldValue,
  setFieldError,
  clearErrors,
  resetForm
} = useForm<FormValues>(initialValues, validate);

// Handle form submission
const onSubmit = async (values: FormValues) => {
  // Submit form data
};

// Use in your form
<form onSubmit={handleSubmit(onSubmit)}>
  <input
    name="name"
    value={values.name}
    onChange={handleChange}
    onBlur={handleBlur}
  />
  {touched.name && errors.name && <div>{errors.name}</div>}
  
  <button type="submit" disabled={isSubmitting}>
    Submit
  </button>
</form>
```

## Best Practices

1. **Import from the index file**: Always import hooks from the index file rather than directly from their individual files:

```typescript
// Good
import { useForm, useApi, useAuth } from '../hooks';

// Avoid
import { useForm } from '../hooks/useForm';
import { useApi } from '../hooks/useApi';
```

2. **Type your data**: Always provide type parameters to hooks that accept them:

```typescript
// Good
const { request, data } = useApi<User[]>();

// Avoid
const { request, data } = useApi();
```

3. **Handle errors**: Always handle errors from hooks:

```typescript
// Good
const { data, error } = await request({ url: '/users' });
if (error) {
  console.error('Failed to fetch users:', error);
}

// Avoid ignoring errors
const { data } = await request({ url: '/users' });
```

4. **Use with contexts**: Some hooks work best with their corresponding contexts:

```typescript
// For global notifications, use the context
import { useNotificationContext } from '../contexts';

// For local notifications (e.g., in a test), use the hook directly
import { useNotification } from '../hooks';
``` 