# Sibling - Personal Data Store (PDS)

## Table of Contents
- [Sibling - Personal Data Store (PDS)](#sibling---personal-data-store-pds)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
    - [Mission](#mission)
    - [Vision](#vision)
  - [Build, Run, Test, Deploy Instructions](#build-run-test-deploy-instructions)
    - [Prerequisites](#prerequisites)
  - [Build, Run, Test, Deploy Instructions](#build-run-test-deploy-instructions-1)
    - [Prerequisites](#prerequisites-1)
    - [Build and Run](#build-and-run)
    - [Test](#test)
    - [Deploy](#deploy)
  - [Tech Stack](#tech-stack)
  - [Encryption](#encryption)
  - [Documentation](#documentation)
    - [Architecture](#architecture)
    - [Design](#design)
    - [Research](#research)
    - [Compliance](#compliance)
    - [DevOps](#devops)

## Project Overview
Sibling is a user-centric Personal Data Store (PDS) that collects, manages, and harnesses an individual's comprehensive data profile—integrating volunteered, behavioral, and external data. It empowers users to train AI assistants (e.g., Grok, ChatGPT, Gemini) for personalized support, prioritizing data sovereignty user autonomy, transparency, and security.

### Mission
Enable individuals to own their data, refine it, and unlock tailored AI assistance.

### Vision
Make AI a trusted, personalized partner via a user-controlled data foundation.

/sibling-pds
├── /.vscode         # VS Code configuration
│   ├── launch.json          # Debug configuration for Jest tests
│   └── settings.json        # VS Code settings including Jest configuration
├── /src           # Source code
│   ├── /backend   # Node.js/TypeScript backend
│   │   ├── /config     # Configuration files
│   │   ├── /controllers # Controller logic
│   │   │   └── usersController.ts  # User-related business logic
│   │   ├── /middleware  # Express middleware
│   │   │   └── errorHandler.ts     # Centralized error handling
│   │   ├── /models     # Mongoose schemas
│   │   │   ├── BehavioralDataModel.ts
│   │   │   ├── ExternalDataModel.ts
│   │   │   ├── UserModel.ts
│   │   │   └── VolunteeredDataModel.ts
│   │   ├── /routes     # Express routes
│   │   │   └── users.ts
│   │   ├── /utils      # Utility functions
│   │   │   └── encryption.ts
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
│           │   ├── DataInput.test.tsx
│           │   ├── Profile.test.tsx
│           │   ├── SignupForm.test.tsx
│           │   ├── UserContext.test.tsx
│           │   ├── integration.test.tsx
│           │   └── useFetch.test.tsx
│           ├── /components
│           │   ├── App.tsx
│           │   ├── DataInput.tsx
│           │   ├── Profile.tsx
│           │   └── SignupForm.tsx
│           ├── /hooks
│           │   └── useFetch.ts
│           ├── /context
│           │   └── UserContext.tsx
│           ├── setupTests.ts       # Frontend test setup and mocks
│           ├── App.css
│           ├── index.css
│           ├── index.tsx
│           └── .babelrc            # Frontend Babel configuration
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

## Build, Run, Test, Deploy Instructions
### Prerequisites
- Node.js (v18 or later)
- npm
- Docker


## Build, Run, Test, Deploy Instructions
### Prerequisites
- Node.js (v18 or later)
- npm
- Docker

### Build and Run
1. Clone the repository: `git clone <repo-url>`
2. Navigate to the root: `cd sibling-pds`
3. Install dependencies: `npm install`
4. Set up backend environment variables: Add `ENCRYPTION_KEY=<32-byte-key>` to `src/backend/.env`.
5. Set up frontend environment variables: Add `REACT_APP_API_URL=http://localhost:3000` to `src/frontend/src/.env`.
6. Start MongoDB via Docker: `docker-compose up -d`
7. Build the backend: `npm run build:backend`
8. Start the app: `npm start`
   - Backend runs on `http://localhost:3000`
   - Frontend runs on `http://localhost:3001`
9. Open `http://localhost:3001` in your browser.

### Test
1. Run unit tests:
   - All tests: `npm test`
   - Single run: `npm run test-once`
   - Debug tests using VS Code:
     1. Open the Run and Debug tab
     2. Select "Debug Jest Tests" configuration
     3. Use Test Explorer to run specific tests
     4. Set breakpoints in test files
2. Test coverage includes:
   - User CRUD operations
   - Data encryption/decryption
   - Error handling
   - Input validation
   - Frontend component rendering
   - Form validation
   - API integration
3. Test Configuration:
   - Jest configuration in `jest.config.js`
   - Babel configuration in `babel.config.js` and frontend `.babelrc`
   - VS Code debug settings in `.vscode/launch.json`
   - Test setup files:
     - Frontend: `src/frontend/src/setupTests.ts`
     - Backend: `tests/unit/setup.ts`

### Deploy
*(To be added as deployment is planned.)*

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
  - Modern React Features:
    - Context API for state management (UserContext)
    - Custom hooks for data fetching (useFetch with caching, retry logic)
    - Functional components with hooks (useState, useEffect, useCallback)
  - Testing Suite:
    - Jest 29.7.0 with jest-environment-jsdom
    - React Testing Library 16.2.0
    - User Event Testing Library 13.5.0
    - Integration tests for component interactions
    - Jest Transform CSS for style imports
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
- **Key Management**: Moved to `ENCRYPTION_KEY` in `.env` with fallback to random key.
- **IV Usage**: Unique 16-byte IVs per encryption, stored as hex strings.
- **Encrypted Fields**: `name`, `email`, `value`, `context`, `data`.
- **Future Plans**: TLS in Phase 5, key rotation to be implemented.
*(Please preserve this section in future README updates.)*

## Documentation
### Architecture
- [Data Ingestion System](docs/md/data_ingestion_design.md)
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