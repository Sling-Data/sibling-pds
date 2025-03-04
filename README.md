# Sibling - Personal Data Store (PDS)

## Table of Contents
- [Sibling - Personal Data Store (PDS)](#sibling---personal-data-store-pds)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
    - [Mission](#mission)
    - [Vision](#vision)
  - [Build, Run, Test, Deploy Instructions](#build-run-test-deploy-instructions)
    - [Prerequisites](#prerequisites)
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
│   └── /json      # Worker Grok JSON outputs
├── /src           # Source code
│   ├── /backend   # Node.js/TypeScript backend
│   │   ├── /config  # Configuration files
│   │   ├── /models  # Mongoose schemas
│   |   └── /.env    # Backend environment variables
│   └── /frontend  # React/TypeScript frontend
│       ├── /public        # Static assets
│       └── /src           # React source code
│           ├── /tests # Frontend unit tests
│           └── /components
│           ├── /package.json  # Frontend-specific dependencies and scripts
│           └── /.env          # Frontend environment variables
├── /tests         # Test files
│   ├── /integration  # Integration tests
│   └── /unit         # Backend unit tests
│       └── /backend  # Backend unit tests
├── docker-compose.yml  # Docker configuration
├── jest.config.js      # Base Jest configuration
├── package-lock.json   # Dependency lock file
├── package.json        # Backend and root project dependencies and scripts
├── README.md           # This file
├── tsconfig.json       # TypeScript configuration
└── .gitignore          # Git ignore file


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
5. Set up frontend environment variables: Add `REACT_APP_API_URL=http://localhost:3000` to `src/frontend/.env`.
6. Start MongoDB via Docker: `docker-compose up -d`
7. Start the app: `npm start`
   - Backend runs on `http://localhost:3000`
   - Frontend runs on `http://localhost:3001`
8. Open `http://localhost:3001` in your browser.

### Test
1. Run unit tests: `npm test`
   - Backend: `npm run test:backend`
   - Frontend: `npm run test:frontend`
   - All tests: `npm run test-once`
   - Uses Jest with `mongodb-memory-server`.

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

### Compliance
- [GDPR/CCPA Compliance Requirements (Compliance Clara, 2025-03-01)](docs/gdpr_ccpa_requirements_sibling.md)
- [MongoDB Encryption Options (Compliance Clara, 2025-03-01)](docs/mongodb_encryption_options_sibling.md)
- [CSFLE Limitations and Pricing (Compliance Clara, 2025-03-01)](docs/csfle_limitations_pricing_sibling.md)
- [Consent Flows (Compliance Clara, 2025-03-01)](docs/consent_flows_sibling.md)
- [Crypto AES-256-CBC Assessment (Compliance Clara, 2025-03-01)](docs/crypto_aes256cbc_assessment_sibling.md)
- [TLS Alternatives (Compliance Clara, 2025-03-03)](docs/tls_alternatives_sibling.md)