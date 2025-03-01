# Sibling - Personal Data Store (PDS)

## Table of Contents
- [Sibling - Personal Data Store (PDS)](#sibling---personal-data-store-pds)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
    - [Mission](#mission)
    - [Vision](#vision)
  - [File Structure](#file-structure)
  - [Build, Run, Test, Deploy Instructions](#build-run-test-deploy-instructions)
    - [Prerequisites](#prerequisites)
  - [Build, Run, Test, Deploy Instructions](#build-run-test-deploy-instructions-1)
    - [Prerequisites](#prerequisites-1)
    - [Build and Run](#build-and-run)
    - [Test](#test)
    - [Deploy](#deploy)
  - [Documentation](#documentation)
  - [Tech Stack](#tech-stack)
  - [Encryption](#encryption)
    - [Encrypted Fields](#encrypted-fields)
    - [Implementation Details](#implementation-details)

## Project Overview
Sibling is a user-centric Personal Data Store (PDS) that collects, manages, and harnesses an individual's comprehensive data profile—integrating volunteered, behavioral, and external data. It empowers users to train AI assistants (e.g., Grok, ChatGPT, Gemini) for personalized support, prioritizing user autonomy, transparency, and security.

### Mission
Enable individuals to own their data, refine it, and unlock tailored AI assistance.

### Vision
Make AI a trusted, personalized partner via a user-controlled data foundation.

## File Structure
/sibling-pds
├── /src           # Source code
│   ├── /backend   # Node.js/TypeScript backend with Express.js
│   └── /frontend  # React/TypeScript frontend
├── /docs          # Documentation (Markdown files)
│   └── /json      # Worker Grok JSON outputs
├── /tests         # Test files
└── README.md      # This file



## Build, Run, Test, Deploy Instructions
### Prerequisites
- Node.js (v18 or later)
- npm
- Docker (for MongoDB)


## Build, Run, Test, Deploy Instructions
### Prerequisites
- Node.js (v18 or later)
- npm
- Docker (for MongoDB)

### Build and Run
1. Clone the repository: `git clone <repo-url>`
2. Navigate to the project root: `cd sibling-pds`
3. Install dependencies:
   - Root: `npm install`
   - Frontend: `cd src/frontend && npm install && cd ../..`
4. Set up MongoDB via Docker:
   - Run: `docker run -d -p 27018:27017 --name sibling-mongo mongo`
   - (MongoDB runs on port 27018 locally)
5. Configure environment variables:
   - Create a `.env` file in `/src/backend` with: `MONGODB_URI=mongodb://localhost:27018/sibling`
6. Start the app: `npm start`
   - Backend runs on `http://localhost:3000`
   - Frontend runs on `http://localhost:3001`
7. Open `http://localhost:3001` in your browser to interact with the user profile form.

### Test
1. Ensure root dependencies are installed: `npm install`
2. Run tests: `npm test`
   - Uses Jest with `mongodb-memory-server` for in-memory MongoDB testing.
   - Verifies POST `/users` and GET `/users/:id` endpoints (success and 404 cases).

### Deploy
*(To be added as deployment is planned.)*

## Documentation
- [User Profile Wireframes (Designer Dana, 2025-03-01)](docs/user_profile_wireframes.md)
- [GDPR/CCPA Compliance Requirements (Compliance Clara, 2025-03-01)](docs/gdpr_ccpa_requirements_sibling.md)
- [External Data APIs (Researcher Rita, 2025-03-01)](docs/external_data_apis.md)
- [User Data Input Wireframes (Designer Dana, 2025-03-01)](docs/user_data_input_wireframes.md)
- [MongoDB Encryption Options (Compliance Clara, 2025-03-01)](docs/mongodb_encryption_options_sibling.md)
- [Behavioral Data Sources (Researcher Rita, 2025-03-01)](docs/behavioral_data_sources.md)
- [User Dashboard Wireframes (Designer Dana, 2025-03-01)](docs/user_dashboard_wireframes.md)
- [CSFLE Limitations and Pricing (Compliance Clara, 2025-03-01)](docs/csfle_limitations_pricing_sibling.md)
*(More to be added as tasks complete.)*


## Tech Stack
- **Backend**: 
  - Node.js with TypeScript for server-side logic.
  - Express.js for API routing and middleware.
  - MongoDB (Community Edition) with Mongoose for data modeling, running in Docker on port 27018.
  - Client-Side Field Level Encryption (CSFLE) for GDPR/CCPA-compliant data encryption using `mongodb-client-encryption`.
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
Sibling implements encryption using Node.js native `crypto` module with AES-256-CBC to comply with GDPR/CCPA requirements. Due to compatibility issues with CSFLE on Windows, encrypted fields (name, value, context, data) are stored as hex strings in MongoDB. Initialization vectors (IVs) are randomly generated per encryption operation to enhance security. Key management is handled via a local `.encryption_key` file in /src/backend.

### Encrypted Fields
- User: name
- Volunteered Data: value
- Behavioral Data: context
- External Data: data

### Implementation Details
- Algorithm: AES-256-CBC
- Key Size: 32 bytes (256 bits)
- IV Size: 16 bytes (128 bits)
- Storage Format: Hex strings for both IV and encrypted content
- Key Storage: Local file (.encryption_key) with hex-encoded key