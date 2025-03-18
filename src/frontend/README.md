# Sibling Frontend

A modern React application for connecting siblings and managing their interactions.

## Current Project Status

### Completed Work
- [x] Phase 1: API Layer Refactoring
  - Created consolidated API hook (useApi) to replace direct fetch calls
  - Implemented proper error handling and notification integration
  - Fixed and enhanced tests for the new API hook

- [x] Phase 2: Form and Notification Improvements
  - Enhanced the notification system integration with the API layer
  - Added tests for notification behavior in API calls

- [x] Phase 3: New Hooks Implementation
  - Implemented useAuth, useUser, and useData hooks
  - Added comprehensive tests for all new hooks
  - Fixed critical issues in test mocking and implementation

- [x] Phase 4: Initial Component Updates
  - Updated ConnectGmail component to improve UX when popup is closed
  - Enhanced Profile component to use the new ConnectApi molecule
  - Added service buttons styles to maintain visual consistency

### Pending Tasks for Next Agent
- [ ] Complete Phase 4: Component Updates
  - Update remaining components to use the new hooks and services
  - Ensure backward compatibility for all component changes
  - Verify tests for updated components

- [ ] Prepare for Phase 5: Cleanup and Documentation
  - Identify deprecated components that can be removed after migration
  - Document the new component architecture and hook usage patterns
  - Prepare migration strategy for remaining legacy code

## Tech Stack

- **Core Technologies**:
  - React 18.2.0 with TypeScript 4.9.5
  - React DOM 18.2.0
  - React Router DOM 6.20.0
  - Create React App with react-scripts 5.0.1

- **State Management & Data Fetching**:
  - React Context API for global state
  - Custom hooks architecture with domain-specific hooks
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
- Centralized data fetching with modern hooks
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
│   ├── atoms/           # Atomic components (buttons, inputs, etc.)
│   ├── molecules/       # Composite components (form sections, cards, etc.)
│   ├── organisms/       # Complex UI sections (forms, navbars, etc.)
│   ├── templates/       # Page layouts and templates
│   └── pages/           # Full page components
├── contexts/            # React contexts for state management
├── hooks/               # Custom React hooks
├── services/            # Domain-specific service functions
├── styles/              # CSS and styling
├── utils/               # Utility functions and helpers
├── __tests__/           # Test files
├── types/               # TypeScript type definitions
└── index.tsx            # Application entry point
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

# Run a specific test
node test-single.js "TestName"
```

## Next Steps for Development

1. Complete the component updates using the new hook architecture
2. Implement consistent error handling across all components
3. Replace remaining legacy fetch calls with modern hooks
4. Enhance the notification system with more user-friendly messages
5. Prepare for cleanup of deprecated code

> For more detailed information about the refactoring project, hooks implementation, and technical details, please see the [src/README.md](./src/README.md) file.

## Best Practices
1. Always use TypeScript for type safety
2. Use the centralized hooks for API calls and data management
3. Handle loading and error states consistently
4. Implement proper error boundaries
5. Write tests for new components and hooks
6. Follow React hooks rules
7. Use protected routes for authenticated content

## Learn More
- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Router Documentation](https://reactrouter.com/)
- [Testing Library Documentation](https://testing-library.com/)
