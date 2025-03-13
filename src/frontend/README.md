# Sibling Frontend

A modern React application for connecting siblings and managing their interactions.

## Tech Stack

- **Core Technologies**:
  - React 18.2.0 with TypeScript 4.9.5
  - React DOM 18.2.0
  - React Router DOM 6.20.0
  - Create React App with react-scripts 5.0.1

- **State Management & Data Fetching**:
  - React Context API for global state
  - Custom `useFetch` hook with caching and retry logic
  - JWT token management with auto-refresh
  - Session storage for secure data

- **Testing & Development**:
  - Jest 29.7.0 with jest-environment-jsdom
  - React Testing Library 16.2.0
  - User Event Testing Library 13.5.0
  - ESLint with react-app config
  - TypeScript with strict mode

## Features

### Authentication & Security
- JWT-based authentication with automatic token refresh
- Protected routes with authentication guards
- Session-based token storage
- OAuth2 integration for external services
- Type-safe API calls

### Data Management
- Centralized data fetching with `useFetch` hook
- Request caching with configurable expiry
- Automatic retry on network errors
- Dependency-based refetching
- Error boundary implementation

### User Interface
- Responsive design with mobile-first approach
- Form validation and error handling
- Loading states and error messages
- Toast notifications for user feedback
- Protected route handling

### External Integrations
- Plaid financial data connection
- Gmail API integration
- Support for additional OAuth2 services

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the frontend directory with:
   ```bash
   REACT_APP_API_URL=http://localhost:3000
   ```

### Development

```bash
# Start development server
npm start

# Run tests
npm test

# Run tests once
npm run test-once

# Build for production
npm run build:frontend
```

## Project Structure

```
src/
├── components/           # React components
│   ├── App.tsx          # Main application component
│   ├── ConnectPlaid.tsx # Plaid integration UI
│   ├── DataInput.tsx    # User data input forms
│   ├── LoginForm.tsx    # Authentication UI
│   ├── Profile.tsx      # User profile management
│   └── SignupForm.tsx   # User registration
├── context/
│   └── UserContext.tsx  # Global user state management
├── hooks/
│   └── useFetch.ts      # Data fetching with caching
├── utils/
│   ├── TokenManager.ts  # JWT token management
│   └── api.ts          # API utilities
├── __tests__/          # Test files
│   ├── App.test.tsx
│   ├── Auth.test.tsx
│   ├── ConnectPlaid.test.tsx
│   ├── DataInput.test.tsx
│   ├── LoginForm.test.tsx
│   ├── Profile.test.tsx
│   ├── SignupForm.test.tsx
│   ├── UserContext.test.tsx
│   ├── integration.test.tsx
│   └── useFetch.test.tsx
└── index.tsx           # Application entry point
```

## Testing

### Test Coverage
- Component rendering and lifecycle
- Form validation and submission
- Authentication flows (login, signup, token refresh)
- External service integration (Plaid, Gmail)
- Error handling and display
- Data fetching and caching
- Protected route behavior
- User context management

### Running Tests
```bash
# Run validation script
npm run validate:cascade

# Run tests in watch mode
npm test

# Run tests once
npm run test-once
```

### Test Output
Check `test-output.json` for detailed test results and coverage information.

## Component Usage

### useFetch Hook
```typescript
const { data, loading, error, fromCache, refetch } = useFetch<DataType>({
  url: '/api/endpoint',
  method: 'GET',
  skipAuth: false, // Optional: skip authentication
  skipCache: false // Optional: skip cache
});
```

### Protected Routes
```typescript
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### External Service Connection
```typescript
// Plaid Connection
<ConnectPlaid onSuccess={handleSuccess} />

// Gmail Connection
<Profile onGmailConnect={handleGmailConnect} />
```

## Best Practices
1. Always use TypeScript for type safety
2. Use the `useFetch` hook for API calls
3. Handle loading and error states
4. Implement proper error boundaries
5. Write tests for new components
6. Follow React hooks rules
7. Use protected routes for authenticated content

## Learn More
- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Router Documentation](https://reactrouter.com/)
- [Testing Library Documentation](https://testing-library.com/)
