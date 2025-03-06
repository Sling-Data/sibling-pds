# Set up Google Cloud project for Gmail API

## Domain: DevOps
**Sub-Context:** Configure a Google Cloud project for Sibling’s Gmail ingestion, including OAuth 2.0 credentials for backend use.
**Deliverable:** A detailed step-by-step guide for developers to set up a Google Cloud project with Gmail API and OAuth 2.0 credentials.
**Notes:** Use redirect URI http://localhost:3000/auth/callback for testing. Ensure credentials are securely managed. Incorporate lessons from initial setup.

## Results

### Project Configuration

**Project ID:** Sibling-Gmail-Ingestion

**Enabled APIs:** Gmail API

**OAuth 2.0 Credentials:**
```json
{
  "client_id": "Placeholder (generate via OAuth 2.0 Client IDs)",
  "client_secret": "Placeholder (generate via OAuth 2.0 Client IDs)",
  "redirect_uri": "http://localhost:3000/auth/callback"
}
```

### Setup Steps

### 1. Create a Google Cloud Project

**Description:** In the Google Cloud Console (https://console.cloud.google.com/), click the project dropdown, select 'New Project', and name it (e.g., 'Sibling-Gmail-Ingestion'). Enable billing if required (can reuse existing billing setup from prior projects).

**Notes:** Billing setup is only needed once per account unless a new payment method is required.

### 2. Enable the Gmail API

**Description:** Navigate to APIs & Services > Library, search for 'Gmail API', and click 'Enable'. Verify it appears under Enabled APIs & Services.

**Notes:** Ensure the API is enabled before proceeding to avoid 403 errors later.

### 3. Configure the OAuth Consent Screen

**Description:** Go to APIs & Services > OAuth consent screen. Select 'External' user type, set App name to 'Sibling Gmail Ingestion', User support email to developer’s email, and Developer contact to developer’s email. Add scope https://www.googleapis.com/auth/gmail.readonly, then save.

**Notes:** This sets the app in testing mode; only test users can authorize until verified by Google.

### 4. Add Test Users

**Description:** In the OAuth consent screen, scroll to 'Test users', click '+ Add users', and enter the Gmail addresses of testers (e.g., developer’s Gmail). Save the changes.

**Notes:** Test users must have Gmail accounts, as the Gmail API requires access to a Gmail inbox.

### 5. Generate OAuth 2.0 Credentials

**Description:** Navigate to APIs & Services > Credentials, click 'Create Credentials' > 'OAuth 2.0 Client IDs'. Choose 'Web application', name it (e.g., 'Sibling Gmail Web Client'), set Authorized JavaScript origins to http://localhost:3000, and Authorized redirect URIs to http://localhost:3000/auth/callback. Create the credentials, download the JSON file, and extract client_id and client_secret.

**Notes:** Keep credentials secure (e.g., in environment variables or encrypted storage); do not commit to version control.

### 6. Validate the Setup

**Description:** Generate an authorization URL using the google-auth-library (e.g., oauth2Client.generateAuthUrl({ scope: 'https://www.googleapis.com/auth/gmail.readonly', access_type: 'offline', prompt: 'consent' })). Open it in a browser, log in with a test user, and confirm the consent screen shows 'Sibling Gmail Ingestion'.

**Notes:** This confirms the app is correctly linked to the Google Cloud project.

### 7. Exchange Authorization Code for Tokens (Post-Flow Setup)

**Description:** After approval, the browser redirects to the redirect URI with a code (e.g., ?code=4/0AX...). Use oauth2Client.getToken(code) to exchange it for access_token and refresh_token. Store the refresh_token securely (e.g., in MongoDB with AES-256-CBC encryption).

**Notes:** The code expires in ~10 minutes and is single-use; if interrupted, restart the flow. Use access_type: 'offline' to get a refresh_token.

### Known Challenges and Solutions

### 1. Code expiration and interruption

**Description:** The authorization code expires after ~10 minutes and is single-use. If the user is interrupted (e.g., closes browser), they must restart the OAuth flow.

**Solution:** Implement a retry mechanism in the UI (e.g., 'Try connecting Gmail again') and regenerate the authorization URL as needed.

### 2. No server for redirect URI

**Description:** Initially, no server was running at http://localhost:3000/auth/callback, requiring manual code capture.

**Solution:** Set up an Express.js endpoint (/auth/callback) to handle the redirect and automate token exchange.

### 3. Deferred token testing

**Description:** Full token exchange testing was deferred due to lack of OAuth flow implementation.

**Solution:** Complete the flow implementation with Coder Cody to validate tokens with setCredentials and Gmail API calls.


## Metadata
- Worker: DevOps Dylan
- Date: 2025-03-06
- Source File: google_cloud_setup_guide_2025-03-06.json
