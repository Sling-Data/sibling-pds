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
    - [Design](#design)
    - [Research](#research)
    - [Compliance](#compliance)

## Project Overview
Sibling is a user-centric Personal Data Store (PDS) that collects, manages, and harnesses an individual's comprehensive data profile—integrating volunteered, behavioral, and external data. It empowers users to train AI assistants (e.g., Grok, ChatGPT, Gemini) for personalized support, prioritizing user autonomy, transparency, and security.

### Mission
Enable individuals to own their data, refine it, and unlock tailored AI assistance.

### Vision
Make AI a trusted, personalized partner via a user-controlled data foundation.

/sibling-pds
├── /docs          # Documentation
│   └── /json      # Worker Grok JSON outputs, intended for storing wireframes or specs like Dana's (currently empty).
├── /src           # Source code
│   ├── /backend   # Node.js/TypeScript backend
│   │   ├── /config     # Configuration files (currently empty, reserved for future config needs).
│   │   ├── /controllers # Controller logic
│   │   │   └── usersController.ts  # User-related business logic
│   │   ├── /middleware  # Express middleware
│   │   │   └── errorHandler.ts     # Centralized error handling
│   │   ├── /models     # Mongoose schemas
│   │   │   ├── BehavioralDataModel.ts  # Schema for behavioral data, storing actions and context with encrypted fields.
│   │   │   ├── ExternalDataModel.ts    # Schema for external data, linking to user ID with encrypted data fields.
│   │   │   ├── UserModel.ts            # Schema for users, encrypting name and email.
│   │   │   └── VolunteeredDataModel.ts # Schema for volunteered data, including type and encrypted value.
│   │   ├── /routes     # Express routes
│   │   │   └── users.ts             # User-related endpoints
│   │   ├── /utils      # Utility functions
│   │   │   └── encryption.ts        # Encryption/decryption utilities
│   │   └── /.env       # Backend environment variables
│   └── /frontend  # React/TypeScript frontend
│       ├── /public        # Static assets
│       │   ├── index.html         # React entry point, injecting bundled JS into the DOM.
│       │   ├── logo.svg           # Project logo for display in the application.
│       │   └── manifest.json      # Web app manifest for PWA features, defining metadata.
│       └── /src           # React source code
│           ├── /tests # Frontend unit tests
│           │   ├── App.test.tsx          # Tests App component rendering and navigation.
│           │   ├── DataInput.test.tsx    # Tests DataInput form rendering and submission.
│           │   ├── Profile.test.tsx      # Tests Profile view and edit functionality.
│           │   └── SignupForm.test.tsx   # Tests SignupForm submission and validation.
│           ├── /components
│           │   ├── App.tsx               # Main app component, managing state and rendering SignupForm, DataInput, or Profile.
│           │   ├── DataInput.tsx         # Form component for volunteered data with 8 fields, validated and submitted to /volunteered-data.
│           │   ├── Profile.tsx           # Displays and edits user profile (name, email) with privacy settings placeholder.
│           │   └── SignupForm.tsx        # Form for user creation, posting to /users.
│           ├── App.css                  # Styles for App component layout.
│           ├── index.css                # Global CSS for the application.
│           ├── index.tsx                # React entry point, rendering App into DOM.
│           ├── logo.svg                 # Logo asset for branding.
│           ├── react-app-env.d.ts       # TypeScript declaration for React environment, enhancing type safety.
│           ├── reportWebVitals.ts       # Performance monitoring utility (unused for now).
│           ├── package.json  # Frontend-specific dependencies and scripts, listing React (18.2.0), TypeScript (4.9.5), and scripts like test-once.
│           └── /.env          # Frontend environment variables, including REACT_APP_API_URL=http://localhost:3000, loaded by react-scripts.
├── /tests         # Test files
│   ├── /integration  # Integration tests
│   │   └── api-test.http  # HTTP test file for manual API endpoint testing (e.g., GET /user-data/:id).
│   └── /unit         # Backend unit tests
│       └── /backend  # Backend unit tests
│           ├── api.test.ts      # Tests API endpoints (15 cases, e.g., POST /users validation, PUT /users/:id).
│           └── setup.ts         # Test setup with MongoMemoryServer for isolated testing.
├── docker-compose.yml  # Docker configuration, defining MongoDB services, mapping port 27018, and managing data volumes.
├── jest.config.js      # Base Jest configuration, extended by domain-specific configs for testing setup.
├── jest.config.backend.js      # Jest config for backend tests, specifying TypeScript support and MongoMemoryServer.
├── jest.config.frontend.js     # Jest config for frontend tests, setting up jsdom environment for React.
├── package-lock.json   # Dependency lock file, ensuring consistent installs across environments.
├── package.json        # Backend and root project dependencies and scripts, including Express, Mongoose, and test-once combining runs.
├── README.md           # This file, documenting setup, encryption, and file structure.
├── tsconfig.json       # TypeScript configuration for the project, setting jsx to react-jsx and path aliases (e.g., @backend/, @frontend/).
└── .gitignore          # Git ignore file, excluding node_modules, .env, and build artifacts from version control.


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
   - Backend (watch mode): `npm run test:backend`
   - Backend (single run): `npm run test:backend-once`
   - Frontend: `npm run test:frontend`
   - Frontend (single run): `npm run test:frontend-once`
2. Test coverage includes:
   - User CRUD operations
   - Data encryption/decryption
   - Error handling
   - Input validation
3. Manual API testing:
   - Use the REST Client extension with `tests/integration/api-test.http`
   - Test endpoints: POST /users, GET /users/:id, PUT /users/:id

### Deploy
*(To be added as deployment is planned.)*

## Tech Stack
- **Backend**: 
  - Node.js with TypeScript for server-side logic.
  - Express.js for API routing and middleware.
  - MongoDB (Community Edition) with Mongoose for data modeling, running in Docker on port 27018.
  - Node.js native `crypto` module (AES-256-CBC) for data encryption.
- **Frontend**: 
  - React with TypeScript for dynamic user interfaces.
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
### Design
- [User Profile Wireframes (Designer Dana, 2025-03-01)](docs/user_profile_wireframes.md)
- [User Data Input Wireframes (Designer Dana, 2025-03-01)](docs/user_data_input_wireframes.md)
- [User Dashboard Wireframes (Designer Dana, 2025-03-01)](docs/user_dashboard_wireframes.md)
- [Onboarding Data Input Wireframes (Designer Dana, 2025-03-01)](docs/onboarding_data_input_wireframes.md)

### Research
- [External Data APIs (Researcher Rita, 2025-03-01)](docs/external_data_apis.md)
- [Behavioral Data Sources (Researcher Rita, 2025-03-01)](docs/behavioral_data_sources.md)
- [Onboarding Data Needs (Researcher Rita, 2025-03-01)](docs/onboarding_data_needs.md)
- [Data Category Assessment (Researcher Rita, 2025-03-01)](docs/data_category_assessment.md)

### Compliance
- [GDPR/CCPA Compliance Requirements (Compliance Clara, 2025-03-01)](docs/gdpr_ccpa_requirements_sibling.md)
- [MongoDB Encryption Options (Compliance Clara, 2025-03-01)](docs/mongodb_encryption_options_sibling.md)
- [CSFLE Limitations and Pricing (Compliance Clara, 2025-03-01)](docs/csfle_limitations_pricing_sibling.md)
- [Consent Flows (Compliance Clara, 2025-03-01)](docs/consent_flows_sibling.md)
- [Crypto AES-256-CBC Assessment (Compliance Clara, 2025-03-01)](docs/crypto_aes256cbc_assessment_sibling.md)
- [TLS Alternatives (Compliance Clara, 2025-03-03)](docs/tls_alternatives_sibling.md)