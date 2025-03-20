# Sibling Frontend

A modern React application for connecting siblings and managing their interactions.

## Tech Stack

- **Core Technologies**:
  - React 18.2.0 with TypeScript 4.9.5
  - React DOM 18.2.0
  - React Router DOM 6.20.0
  - Create React App with react-scripts 5.0.1

- **State Management & Data Fetching**:
  - React Context API for global state (UserContext)
  - Custom hooks architecture with domain-specific hooks
  - Modern API handling with useApi hook 
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
- OAuth2 integration for external services (Gmail, Plaid)
- Type-safe API calls

### Data Management
- Centralized API handling with useApi hook
- Request caching with configurable expiry
- Automatic retry on network errors
- Dependency-based refetching
- Error boundary implementation

### User Interface
- Atomic design pattern (atoms, molecules, organisms, templates, pages)
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
│   ├── atoms/           # Atomic components (buttons, inputs, etc.)
│   ├── molecules/       # Composite components (form sections, cards, etc.)
│   ├── organisms/       # Complex UI sections (forms, containers, etc.)
│   ├── templates/       # Page layouts and templates
│   └── pages/           # Full page components
├── contexts/            # React contexts for state management
├── hooks/               # Custom React hooks
│   ├── useApi.ts        # API interaction hook
│   ├── useAuth.ts       # Authentication hook
│   ├── useUser.ts       # User data hook
│   └── useNotification.ts # Notification hook
├── services/            # Domain-specific service functions
├── styles/              # CSS and styling
│   ├── atoms/           # Styles for atomic components
│   ├── molecules/       # Styles for molecular components
│   ├── pages/           # Styles for page components
│   ├── templates/       # Styles for template components
│   └── index.css        # Global styles
├── utils/               # Utility functions and helpers
├── __tests__/           # Test files
├── types/               # TypeScript type definitions
└── index.tsx            # Application entry point
```

## API Architecture

The application has been refactored to use a centralized API handling approach:

### useApi Hook

The `useApi` hook replaces the legacy `useFetch` hook and provides:

- Consistent API interaction patterns across the application
- Automatic token refresh for authenticated requests
- Better error handling and type safety
- Support for different request methods (GET, POST, PUT, DELETE)
- Request caching with configurable options
- Loading state management
- Automatic retries for failed requests
- Dependency tracking for refetching

### Components Migration

All major components have been migrated from `useFetch` to `useApi`:

- `Profile.tsx`: User profile management
- `ConnectGmail.tsx`: Gmail integration
- `ConnectPlaid.tsx`: Financial data integration
- `DataInput.tsx`: User data input forms

## CSS Architecture

The application uses a structured CSS organization based on the atomic design pattern:

- `/styles/atoms/`: Styles for atomic components
- `/styles/molecules/`: Styles for molecular components
- `/styles/pages/`: Styles for page components
- `/styles/templates/`: Styles for template components

This organization mirrors the component structure and improves maintainability.

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

# Run a specific test
node test-single.js "TestName"
```

## Best Practices
1. Always use TypeScript for type safety
2. Use the useApi hook for all API calls
3. Follow the atomic design pattern for components
4. Handle loading and error states consistently
5. Implement proper error boundaries
6. Write tests for new components and hooks
7. Follow React hooks rules and best practices
8. Use protected routes for authenticated content
9. Place CSS files in the appropriate styles directory

## Learn More
- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Router Documentation](https://reactrouter.com/)
- [Testing Library Documentation](https://testing-library.com/)
