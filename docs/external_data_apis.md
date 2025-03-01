# Research APIs for external data integration

## Domain: Research
**Sub-Context:** Sibling will integrate external data (e.g., financial records, emails). We use Node.js, TypeScript, and MongoDB.
**Deliverable:** A JSON list of 3-5 APIs (e.g., banking, Gmail) with name, why chosen, auth setup, sample JSON output, and TypeScript compatibility notes.
**Notes:** Prioritize free tiers and JSON output.

## Results

### 1. Google Gmail API

**Why Chosen:** Free tier available, provides JSON output, ideal for email data integration into Sibling PDS.

**Authentication Setup:**
- Enable Gmail API in Google Cloud Console
- Set up OAuth 2.0 credentials
- Use google-auth-library in Node.js

**Sample JSON Output:**
```json
{"id": "abc123", "snippet": "Meeting at 3pm", "payload": {"headers": [{"name": "From", "value": "user@example.com"}]}}
```

**TypeScript Compatibility:** Official @types/googleapis package available for TypeScript support.

### 2. Plaid API

**Why Chosen:** Free development tier, JSON output, excellent for financial data (e.g., bank accounts, transactions) integration.

**Authentication Setup:**
- Sign up for Plaid Developer account
- Obtain API keys (client_id, secret)
- Use plaid npm package in Node.js

**Sample JSON Output:**
```json
{"accounts": [{"id": "xyz789", "name": "Checking", "balance": {"current": 1500.25}}], "transactions": [{"id": "txn001", "amount": 50.00, "date": "2025-02-28"}]}
```

**TypeScript Compatibility:** Plaid provides TypeScript definitions via @types/plaid package.

### 3. Alpha Vantage API

**Why Chosen:** Free tier with generous limits, JSON output, great for real-time financial market data (e.g., stocks).

**Authentication Setup:**
- Sign up for free API key on Alpha Vantage website
- Pass key as query parameter in HTTP requests

**Sample JSON Output:**
```json
{"Meta Data": {"Symbol": "AAPL"}, "Time Series (Daily)": {"2025-02-28": {"4. close": "175.30"}}}
```

**TypeScript Compatibility:** No official TypeScript typings, but simple HTTP requests work seamlessly with TypeScript.

### 4. Microsoft Graph API

**Why Chosen:** Free tier via Microsoft 365 Developer Program, JSON output, integrates email and calendar data.

**Authentication Setup:**
- Register app in Azure AD
- Set up OAuth 2.0 with client credentials
- Use @microsoft/microsoft-graph-client in Node.js

**Sample JSON Output:**
```json
{"value": [{"id": "msg456", "subject": "Team Sync", "sender": {"emailAddress": {"address": "user@outlook.com"}}}]}}
```

**TypeScript Compatibility:** Full TypeScript support with @microsoft/microsoft-graph-types package.

## Metadata
- Worker: Researcher Rita
- Date: 2025-03-01
- Source File: external_data_apis_2025-03-01.json
