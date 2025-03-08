# Tech Debt Audit 1

## Domain: Engineering
**Sub-Context:** Sibling codebase audit for tech debt and vulnerabilities in Node.js with TypeScript (backend), React with TypeScript (frontend), Express.js, MongoDB with Mongoose in Docker, and Node.js crypto (AES-256-CBC). Recent work includes Gmail and Plaid pipelines with scheduler, 91 tests (57 backend, 34 frontend). Identified tech debt includes Gmail redirect issue.
**Deliverable:** A JSON report with prioritized and deferred tech debt findings.
**Notes:** Prioritization based on importance (severity) and urgency (dev mode relevance). Deferred items are production-specific or less urgent in dev mode.

## Results

### Prioritised Items

### 1. Gmail Redirect Issue (BE/FE)

**Task:** Fix redirect logic and add app-level auth (JWT).

### 2. Unsanitized Rendering of Error Messages (FE)

**Task:** Sanitize query params in Profile.tsx.

### 3. No App-Level Authentication

**Task:** Implement JWT-based authentication.

### 4. Hardcoded Redirect URLs and API URLs (BE/FE)

**Task:** Centralize in environment variables.

### 5. Query Parameters Not Cleared After Processing (FE)

**Task:** Clear params in Profile.tsx with useEffect.

### 6. Lack of CSRF Protection (BE/FE)

**Task:** Add CSRF tokens with JWT implementation.

### 7. Privacy Settings Don’t Persist (FE)

**Task:** Add API endpoints to save/retrieve settings.

### 8. Insufficient Input Validation in Route Handlers (BE)

**Task:** Use Joi for validation.

### 9. Duplicate Form Validation Logic (FE)

**Task:** Extract into a shared utility.

### 10. Duplicate Error Handling Logic (BE)

**Task:** Create a centralized utility.

### Deferred Items

### 1. Gaps

- Lack of integration tests for external APIs
- Missing error notification system
- Incomplete token refresh handling in Plaid client
- No health check endpoints or monitoring
- Limited test coverage for edge cases
- Missing error handling for Plaid Link token expiration
- No visual indication of connection status
- Missing validation for API responses in useFetch hook

### 2. Code Smells

- Tight coupling between scheduler and API clients
- Inconsistent logging format
- Lack of separation between route handlers and business logic
- Inconsistent error handling patterns across components
- Duplicate styling patterns across CSS files
- Duplicate form validation logic across components

### 3. Issues

- Scheduler doesn’t handle database connection failures gracefully
- No mechanism to retry failed data ingestion jobs
- Lack of loading indicators during form submissions
- Duplicate manual mock for styleMock
- Inconsistent port usage in redirect URLs

### 4. Vulnerabilities

- Sensitive API keys and secrets stored in plaintext in .env
- Encryption key stored in .env
- No rate limiting on API endpoints
- Lack of CSRF protection in authentication flows
- No rate limiting for form submissions
- Insecure handling of Plaid tokens in client-side code
- No CORS configuration

### 5. Performance Bottlenecks

- Sequential processing of data ingestion in scheduler
- Inefficient database queries in getUsersWithDataSource
- No caching for frequently accessed data
- Lack of database indexing strategy
- No pagination in Gmail data fetching
- Inefficient useEffect dependencies in Profile.tsx
- Lack of pagination for potential large data sets
- Inefficient cache invalidation in useFetch hook
- Synchronous form validation blocking UI thread


## Metadata
- Worker: Coder Cody
- Date: 2025-03-08
- Source File: tech_debt_audit_01_2025-03-08.json
