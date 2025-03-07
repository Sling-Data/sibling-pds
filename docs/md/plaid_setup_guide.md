# Set up Plaid account and credentials for API integration

## Domain: DevOps
**Sub-Context:** Sibling is implementing data ingestion pipelines for Plaid to fetch account balances, transactions, and scheduled payments. Set up a Plaid developer account and generate credentials for backend use.
**Deliverable:** A guide to configure a Plaid account with PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV (sandbox), securely provided to developers.
**Notes:** Use Plaid’s Sandbox environment for testing. Account may include unexpected 2FA setup.

## Results

### Plaid Configuration

**Environment:** sandbox

**Credentials:**
```json
{
  "PLAID_CLIENT_ID": "Placeholder (from Keys section)",
  "PLAID_SECRET": "Placeholder (from Keys section)",
  "PLAID_ENV": "sandbox"
}
```

### Setup Steps

### 1. Create Plaid developer account

**Description:** Sign up at https://plaid.com/ with a team email (e.g., tome@sibling-pds.com). Verify email and expect 2FA setup. Log into https://dashboard.plaid.com/.

**Notes:** 2FA may be required; check email and spam for verification.

### 2. Set up Plaid application

**Description:** Navigate to Developers > Keys. Use existing Sandbox client_id and secret, or create a new app named ‘Sibling-PDS-Ingestion’ in Sandbox via Developers > Applications.

**Notes:** Default credentials may be provided; no new app needed if keys exist.

### 3. Configure redirect URI

**Description:** In Developers > API, add redirect URI http://localhost:3000/auth/plaid-callback. Save changes.

**Notes:** Ensure URI matches backend callback endpoint.

### 4. Provide credentials

**Description:** Add PLAID_CLIENT_ID, PLAID_SECRET, and PLAID_ENV=sandbox to .env file. Secure with .gitignore.

**Notes:** Never commit .env to version control.

### 5. Validate setup

**Description:** Verify Dashboard access and redirect URI. Optionally generate a Sandbox access token for testing (deferred to client integration).

**Notes:** API testing requires Plaid client setup.

### Known Challenges and Solutions

### 1. Unexpected 2FA requirement

**Description:** Onboarding required 2FA setup after email verification.

**Solution:** Complete 2FA to access Dashboard; document as potential step.

### 2. Quickstart not direct setup

**Description:** Quickstart is a guide, not an app creation tool.

**Solution:** Use Dashboard Keys section for credentials instead.


## Metadata
- Worker: DevOps Dylan
- Date: 2025-03-07
- Source File: plaid_setup_guide_2025-03-07.json
