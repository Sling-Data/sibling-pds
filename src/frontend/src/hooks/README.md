# Custom Hooks

This directory contains custom React hooks that provide reusable functionality across the application.

## Available Hooks

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

### useApiRequest

A hook for making API requests with loading, error, and success states.

```typescript
import { useApiRequest } from '../hooks';

// Initialize the hook with your data type
const { request, loading, error, data } = useApiRequest<User[]>();

// Make a GET request
const fetchUsers = async () => {
  try {
    await request({
      url: '/users',
      method: 'GET',
      showErrorNotification: true
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
};

// Make a POST request
const createUser = async (userData: User) => {
  try {
    const result = await request({
      url: '/users',
      method: 'POST',
      body: userData,
      showSuccessNotification: true,
      successMessage: 'User created successfully!'
    });
    return result;
  } catch (error) {
    console.error('Failed to create user:', error);
  }
};

// Use in your component
return (
  <div>
    {loading && <p>Loading...</p>}
    {error && <p>Error: {error.message}</p>}
    {data && (
      <ul>
        {data.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    )}
    <button onClick={fetchUsers} disabled={loading}>
      Fetch Users
    </button>
  </div>
);
```

## Best Practices

1. **Import from the index file**: Always import hooks from the index file rather than directly from their individual files:

```typescript
// Good
import { useForm, useApiRequest } from '../hooks';

// Avoid
import { useForm } from '../hooks/useForm';
import { useApiRequest } from '../hooks/useApiRequest';
```

2. **Type your data**: Always provide type parameters to hooks that accept them:

```typescript
// Good
const { request, data } = useApiRequest<User[]>();

// Avoid
const { request, data } = useApiRequest();
```

3. **Handle errors**: Always handle errors from hooks that can throw them:

```typescript
// Good
try {
  await request({ url: '/users' });
} catch (error) {
  console.error('Failed to fetch users:', error);
}

// Avoid
await request({ url: '/users' });
```

4. **Use with contexts**: Some hooks work best with their corresponding contexts:

```typescript
// For global notifications, use the context
import { useNotificationContext } from '../contexts';

// For local notifications (e.g., in a test), use the hook directly
import { useNotification } from '../hooks';
``` 