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
    - [Build and Run](#build-and-run)
    - [Test](#test)
    - [Deploy](#deploy)
  - [Documentation](#documentation)

## Project Overview
Sibling is a user-centric Personal Data Store (PDS) that collects, manages, and harnesses an individual’s comprehensive data profile—integrating volunteered, behavioral, and external data. It empowers users to train AI assistants (e.g., Grok, ChatGPT, Gemini) for personalized support, prioritizing user autonomy, transparency, and security.

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

### Build and Run
1. Clone the repository: `git clone <repo-url>`
2. Navigate to the project root: `cd sibling-pds`
3. Install dependencies:
   - Root: `npm install`
   - Frontend: `cd src/frontend && npm install && cd ../..`
4. Start the app: `npm start`
   - Backend runs on `http://localhost:3000`
   - Frontend runs on `http://localhost:3001`
5. Open `http://localhost:3001` in your browser to see "Hello, Sibling!"

### Test
*(To be added as tests are implemented.)*

### Deploy
*(To be added as deployment is planned.)*

## Documentation
*(Links to be added as Worker Groks complete tasks.)*