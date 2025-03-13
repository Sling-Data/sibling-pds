# Sibling - Personal Data Store (PDS)

## Table of Contents
- [Sibling - Personal Data Store (PDS)](#sibling---personal-data-store-pds)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
    - [Mission](#mission)
    - [Vision](#vision)
    - [Project Structure](#project-structure)
  - [Build, Run, Test, Deploy Instructions](#build-run-test-deploy-instructions)
    - [Prerequisites](#prerequisites)
    - [Environment Variables](#environment-variables)
      - [Backend (.env)](#backend-env)
      - [Frontend (.env)](#frontend-env)
    - [Build and Run](#build-and-run)
    - [Test](#test)
    - [Deploy](#deploy)
    - [Security Features](#security-features)
  - [Tech Stack](#tech-stack)
  - [Encryption](#encryption)
  - [Documentation](#documentation)
    - [Design](#design)
    - [Research](#research)
    - [Compliance](#compliance)
    - [DevOps](#devops)
    - [Engineering](#engineering)

## Project Overview
Sibling is a user-centric Personal Data Store (PDS) that collects, manages, and harnesses an individual's comprehensive data profile—integrating volunteered, behavioral, and external data. It empowers users to train AI assistants (e.g., Grok, ChatGPT, Gemini) for personalized support, prioritizing data sovereignty user autonomy, transparency, and security.

### Mission
Enable individuals to own their data, refine it, and unlock tailored AI assistance.

### Vision
Make AI a trusted, personalized partner via a user-controlled data foundation.

### Project Structure
```
/sibling-pds
├── /.vscode         # VS Code configuration
│   ├── launch.json          # Debug configuration for Jest tests
│   └── settings.json        # VS Code settings including Jest configuration
├── /src           # Source code
│   ├── /backend   # Node.js/TypeScript backend
│   │   ├── /config     # Configuration files
│   │   │   └── config.ts    # Environment and app configuration
│   │   ├── /controllers # Controller logic
│   │   │   └── usersController.ts  # User-related business logic
│   │   ├── /middleware  # Express middleware
│   │   │   ├── auth.ts          # JWT authentication and token management
│   │   │   ├── validation.ts    # Request validation schemas
│   │   │   └── errorHandler.ts  # Centralized error handling
│   │   ├── /models     # Mongoose schemas
│   │   │   ├── BehavioralDataModel.ts
│   │   │   ├── ExternalDataModel.ts
│   │   │   ├── UserModel.ts
│   │   │   ├── VolunteeredDataModel.ts
│   │   │   └── UserDataSourcesModel.ts
│   │   ├── /routes     # Express routes
│   │   │   ├── unprotectedAuthRoutes.ts  # Public routes (login, signup, OAuth callbacks)
│   │   │   ├── authRoutes.ts     # Protected authentication routes
│   │   │   ├── users.ts          # User management
│   │   │   ├── volunteeredData.ts # User-provided data
│   │   │   ├── behavioralData.ts # User behavior tracking
│   │   │   ├── externalData.ts   # Third-party data
│   │   │   ├── userData.ts       # Aggregated user data
│   │   │   ├── userDataSources.ts # External service connections
│   │   │   ├── apiRoutes.ts      # API endpoints
│   │   │   └── testRoutes.ts     # Testing endpoints
│   │   ├── /services   # Service implementations
│   │   │   ├── scheduler.ts      # Background task scheduling
│   │   │   └── /apiClients      # Third-party API clients
│   │   │       ├── gmailClient.ts  # Gmail API integration
│   │   │       └── plaidClient.ts  # Plaid API integration
│   │   ├── /utils      # Utility functions
│   │   │   ├── encryption.ts     # Data encryption/decryption
│   │   │   └── userUtils.ts      # User-related helpers
│   │   ├── index.ts    # Main server entry point
│   │   └── /.env       # Backend environment variables
│   └── /frontend  # React/TypeScript frontend
│       ├── /public     # Static assets
│       │   ├── index.html
│       │   ├── logo.svg
│       │   └── manifest.json
│       └── /src        # React source code
│           ├── /__mocks__/
│           │   └── styleMock.ts    # CSS module mock for tests
│           ├── /__tests__/         # Frontend unit tests
│           │   ├── App.test.tsx
│           │   ├── Auth.test.tsx
│           │   ├── ConnectPlaid.test.tsx
│           │   ├── DataInput.test.tsx
│           │   ├── LoginForm.test.tsx
│           │   ├── Profile.test.tsx
│           │   ├── SignupForm.test.tsx
│           │   ├── UserContext.test.tsx
│           │   ├── integration.test.tsx
│           │   └── useFetch.test.tsx
│           ├── /components
│           │   ├── App.tsx         # Main application component
│           │   ├── ConnectPlaid.tsx # Plaid integration UI
│           │   ├── DataInput.tsx   # User data input forms
│           │   ├── LoginForm.tsx   # Authentication UI
│           │   ├── Profile.tsx     # User profile management
│           │   └── SignupForm.tsx  # User registration
│           ├── /context
│           │   └── UserContext.tsx # Global user state management
│           ├── /hooks
│           │   └── useFetch.ts     # Data fetching with caching
│           ├── /utils
│           │   ├── TokenManager.ts # JWT token management
│           │   └── api.ts         # API utilities
│           ├── setupTests.ts      # Test configuration
│           ├── index.tsx         # Application entry point
│           └── reportWebVitals.ts # Performance monitoring
├── /tests         # Test files
│   └── /unit
│       ├── /backend              # Backend unit tests
│       │   ├── api.test.ts
│       │   ├── errorHandler.test.ts
│       │   └── usersController.test.ts
│       └── setup.ts             # Backend test setup and mocks
├── babel.config.js              # Root Babel configuration
├── jest.config.js              # Jest configuration for both frontend and backend
├── package.json
└── tsconfig.json
```

## Build, Run, Test, Deploy Instructions
### Prerequisites
- Node.js (v18 or later)
- npm
- Docker
- MongoDB (runs in Docker)
- Gmail API credentials (for Gmail integration)
- Plaid API credentials (for financial data)

### Environment Variables
#### Backend (.env)
```
# Required
ENCRYPTION_KEY=<32-byte-hex-key>  # Used for data encryption
JWT_SECRET=<jwt-secret-key>       # Used for JWT token signing
MONGODB_URI=<mongodb-uri>         # MongoDB connection string
JWT_EXPIRY=3600                   # JWT token expiry in seconds
JWT_REFRESH_EXPIRY=86400         # Refresh token expiry in seconds

# Optional (for Gmail integration)
GMAIL_CLIENT_ID=<client-id>
GMAIL_CLIENT_SECRET=<client-secret>
GMAIL_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional (for Plaid integration)
PLAID_CLIENT_ID=<client-id>
PLAID_SECRET=<secret>
PLAID_ENV=sandbox                 # or development/production
```

#### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3000
```

### Build and Run
1. Clone the repository: `git clone <repo-url>`
2. Navigate to the root: `cd sibling-pds`
3. Install dependencies: `npm install`
4. Set up environment variables as described above
5. Start MongoDB via Docker: `docker-compose up -d`
6. Build the backend: `npm run build:backend`
7. Start the app: `npm start`
   - Backend runs on `http://localhost:3000`
   - Frontend runs on `http://localhost:3001`
8. Open `http://localhost:3001` in your browser.

### Test
1. Run tests:
   - Frontend validation: `npm run validate:cascade:frontend`
   - Backend validation: `npm run validate:cascade:backend`
   - Single run: `npm run test:backend-once` or `npm run test:frontend-once`
   - Debug tests using VS Code:
     1. Open the Run and Debug tab
     2. Select "Debug Jest Tests" configuration
     3. Use Test Explorer to run specific tests
     4. Set breakpoints in test files

2. Test Coverage:
   - **Frontend Tests**:
     - Component rendering and lifecycle
     - Form validation and submission
     - Authentication flows (login, signup, token refresh)
     - External service integration (Plaid, Gmail)
     - Error handling and display
     - Data fetching and caching
     - Protected route behavior
     - User context management
   
   - **Backend Tests**:
     - API endpoint validation
     - Authentication middleware
     - Data encryption/decryption
     - External service integration
     - Error handling
     - Database operations

3. Test Configuration:
   - Jest configuration in `jest.config.js`
   - Babel configuration in `babel.config.js`
   - VS Code debug settings in `.vscode/launch.json`
   - Test setup files:
     - Frontend: `src/frontend/src/setupTests.ts`
     - Backend: `tests/unit/setup.ts`
   - Test output: Check `test-output.json` in respective directories

4. Validation Process:
   - Build verification
   - ESLint checks
   - TypeScript compilation
   - Unit test execution
   - Integration test execution
   - Test coverage reporting

### Deploy
*(To be added as deployment is planned.)*

### Security Features
1. **Authentication**:
   - JWT-based authentication for API routes
   - Token refresh mechanism with configurable expiry
   - Protected routes with middleware
   - OAuth2 for external services
   - Session-based token storage
   - Automatic token refresh before expiry

2. **Data Protection**:
   - AES-256-CBC encryption for sensitive data
   - Secure credential storage
   - HTTPS in production
   - Token validation and expiry checks

3. **API Security**:
   - Input validation
   - Rate limiting
   - CORS configuration
   - Error handling
   - Automatic retry with token refresh
   - Request caching for performance

4. **Frontend Security**:
   - Session storage for tokens
   - Automatic token refresh
   - Protected route handling
   - Error boundary implementation
   - Type-safe API calls

## Tech Stack
- **Backend**: 
  - Core Technologies:
    - Node.js with TypeScript for server-side logic
    - Express.js for API routing and middleware
    - MongoDB (Community Edition) with Mongoose for data modeling, running in Docker on port 27018
  - Authentication & Security:
    - Node.js native `crypto` module (AES-256-CBC) for data encryption
    - OAuth2 authentication for external services (Gmail, Plaid)
    - Google Auth Library for Gmail API integration
  - Data Management:
    - Mongoose schemas for data modeling and validation
    - UserDataSources collection for external service credentials
    - Automatic token refresh for OAuth2 services
  - API Architecture:
    - RESTful API design with Express routers
    - Modular controller architecture
    - Centralized error handling middleware
    - Type-safe request/response handling
  - Development Features:
    - Hot reloading with ts-node-dev
    - Environment-based configuration
    - Comprehensive logging system
    - API documentation with REST Client
- **Frontend**: 
  - Core Technologies:
    - React 18.2.0 with TypeScript 4.9.5
    - React DOM 18.2.0
    - Create React App with react-scripts 5.0.1
    - React Router DOM for navigation
  - Modern React Features:
    - Context API for state management (UserContext)
    - Custom hooks for data fetching (useFetch with caching, retry logic)
    - Functional components with hooks (useState, useEffect, useCallback)
    - Protected route handling
  - Authentication & Security:
    - JWT token management with automatic refresh
    - Session storage for secure token handling
    - OAuth2 integration for external services
    - Type-safe API calls with TypeScript
  - Data Management:
    - Centralized data fetching with useFetch hook
    - Request caching with configurable expiry
    - Automatic retry on network errors
    - Dependency-based refetching
  - External Integrations:
    - Plaid for financial data (ConnectPlaid component)
    - Gmail API for email data
    - Support for additional OAuth2 services
  - Testing Suite:
    - Jest 29.7.0 with jest-environment-jsdom
    - React Testing Library 16.2.0
    - User Event Testing Library 13.5.0
    - Integration tests for component interactions
    - Mock implementations for external services
    - Comprehensive test coverage
  - Development Tools:
    - TypeScript with strict type checking
    - ESLint with react-app config
    - Babel with React and TypeScript presets
    - Hot module replacement
    - Web Vitals for performance monitoring
  - Browser Support:
    - Modern evergreen browsers
    - Configurable through browserslist
- **Testing**: 
  - Jest with `ts-jest` and `supertest` for API unit tests.
  - MongoDB Memory Server for isolated test databases.
  - REST Client extension for manual API testing.
- **Development Tools**: 
  - Nodemon for auto-restarting the backend.
  - Docker for containerized MongoDB deployment.
  - Git for version control.

## Encryption
- **Implementation**:
  - AES-256-CBC encryption using Node.js native `crypto` module
  - Secure key management via environment variables
  - Initialization Vector (IV) generation per encryption
  - Automatic encryption/decryption of sensitive data
- **Data Protection**:
  - User credentials
  - OAuth tokens
  - Personal information
  - External service data
  - Behavioral analytics
- **Key Management**:
  - 32-byte encryption key required
  - Secure key storage in environment variables
  - No key persistence in codebase
- **Encrypted Fields**: `name`, `email`, `value`, `context`, `data`.
- **Future Plans**: TLS in Phase 5, key rotation to be implemented.
*(Please preserve this section in future README updates.)*

## Documentation
### Design
- [User Profile Wireframes (Designer Dana, 2025-03-01)](docs/md/user_profile_wireframes.md)
- [User Data Input Wireframes (Designer Dana, 2025-03-01)](docs/md/user_data_input_wireframes.md)
- [User Dashboard Wireframes (Designer Dana, 2025-03-01)](docs/md/user_dashboard_wireframes.md)
- [Onboarding Data Input Wireframes (Designer Dana, 2025-03-01)](docs/md/onboarding_data_input_wireframes.md)

### Research
- [External Data APIs (Researcher Rita, 2025-03-01)](docs/md/external_data_apis.md)
- [Behavioral Data Sources (Researcher Rita, 2025-03-01)](docs/md/behavioral_data_sources.md)
- [Onboarding Data Needs (Researcher Rita, 2025-03-01)](docs/md/onboarding_data_needs.md)
- [Data Category Assessment (Researcher Rita, 2025-03-01)](docs/md/data_category_assessment.md)

### Compliance
- [GDPR/CCPA Compliance Requirements (Compliance Clara, 2025-03-01)](docs/md/gdpr_ccpa_requirements_sibling.md)
- [MongoDB Encryption Options (Compliance Clara, 2025-03-01)](docs/md/mongodb_encryption_options_sibling.md)
- [CSFLE Limitations and Pricing (Compliance Clara, 2025-03-01)](docs/md/csfle_limitations_pricing_sibling.md)
- [Consent Flows (Compliance Clara, 2025-03-01)](docs/md/consent_flows_sibling.md)
- [Crypto AES-256-CBC Assessment (Compliance Clara, 2025-03-01)](docs/md/crypto_aes256cbc_assessment_sibling.md)
- [TLS Alternatives (Compliance Clara, 2025-03-03)](docs/md/tls_alternatives_sibling.md)

### DevOps
- [Google Cloud Setup Guide for Gmail API (DevOps Dylan, 2025-03-06)](docs/md/google_cloud_setup_guide.md)
- [Gmail 429 Error Simulation Guide (DevOps Dylan, 2025-03-07)](docs/md/gmail_429_simulation_guide.md)
- [Plaid Setup Guide (DevOps Dylan, 2025-03-07)](docs/md/plaid_setup_guide.md)

### Engineering
- [Tech Debt Audit Report (Coder Cody, 2025-03-08)](docs/md/tech_debt_audit_01.md)