# Guide Tomé in setting up a Fitbit developer account and app for API access

## Domain: DevOps
**Sub-Context:** Sibling’s Fitbit behavioral data pipeline requires API access via OAuth2. We need a Fitbit developer account and an app configured to obtain credentials (client ID, secret, redirect URI) for development.
**Deliverable:** A guide to configure a Fitbit developer account and app for OAuth2 access, including client ID, secret, and redirect URI (http://localhost:3000/auth/fitbit/callback).
**Notes:** Scopes are set during OAuth2 authorization, not app registration.

## Results

### Plaid Configuration

**Environment:** development

**Credentials:**
```json
{
  "FITBIT_CLIENT_ID": "Placeholder (from app settings)",
  "FITBIT_CLIENT_SECRET": "Placeholder (from app settings)",
  "FITBIT_REDIRECT_URI": "http://localhost:3000/auth/fitbit/callback"
}
```

### Setup Steps

### 1. Create Fitbit developer account

**Description:** Sign up or log into https://dev.fitbit.com/ with a Fitbit user account. Create one at https://www.fitbit.com/signup if needed. Verify email and accept developer terms.

**Notes:** Use a team email (e.g., tome@sibling-pds.com).

### 2. Register a new app

**Description:** In the Fitbit Developer Portal, go to Manage > Register a New App. Set App Name to 'Sibling-PDS-Fitbit-Ingestion', Description to 'Data ingestion pipeline for Sibling PDS to fetch Fitbit behavioral data like steps and activity', App Type to Server/Client, Redirect URI to http://localhost:3000/auth/fitbit/callback, Default Access Type to Read Only.

**Notes:** Scopes (e.g., activity, heartrate, sleep) are set during OAuth2 authorization, not here.

### 3. Configure OAuth2 and retrieve credentials

**Description:** In the app settings, note the Client ID and Client Secret. Add to .env as FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, and FITBIT_REDIRECT_URI=http://localhost:3000/auth/fitbit/callback.

**Notes:** Auth/Token URIs (https://www.fitbit.com/oauth2/authorize, https://api.fitbit.com/oauth2/token) are standard and typically hardcoded in the client.

### 4. Confirm setup details

**Description:** Verify .env setup, ensure .gitignore includes .env, and note desired scopes (e.g., activity, heartrate, sleep) for OAuth2 flow.

**Notes:** API testing requires Fitbit client setup.

### Known Challenges and Solutions

### 1. No scope selection during app registration

**Description:** Fitbit does not allow scope selection during app setup.

**Solution:** Scopes are requested during OAuth2 authorization flow.


## Metadata
- Worker: DevOps Dylan
- Date: 2025-03-07
- Source File: fitbit_setup_guide_2025-03-07.json
