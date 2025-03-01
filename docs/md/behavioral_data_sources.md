# Research behavioral data sources for integration

## Domain: Research
**Sub-Context:** Sibling will integrate behavioral data (e.g., online actions, physical activity). We use Node.js, TypeScript, and MongoDB.
**Deliverable:** A JSON list of 3-5 behavioral data sources (e.g., browser extensions, fitness trackers) with name, why chosen, auth setup, sample JSON output, and TypeScript compatibility notes.
**Notes:** Prioritize free tiers and JSON output. Consider user consent and privacy.

## Results

### 1. Web Activity Time Tracker (Browser Extension)

**Why Chosen:** Free, open-source, tracks online activity (time spent on sites) with JSON export, requires explicit user consent.

**Authentication Setup:**
- Install via Chrome Web Store
- No API key required; local storage access with user permission
- Use chrome.runtime API in Node.js with browser extension polyfills

**Sample JSON Output:**
```json
{"site": "example.com", "time_spent": 1200, "date": "2025-03-01", "category": "productivity"}
```

**TypeScript Compatibility:** No official typings, but simple JSON structure works with TypeScript interfaces.

### 2. Fitbit Web API

**Why Chosen:** Free tier available, JSON output, tracks physical activity (steps, heart rate), requires OAuth consent for privacy.

**Authentication Setup:**
- Register app in Fitbit Dev Portal
- Set up OAuth 2.0 with client ID and secret
- Use fitbit-node npm package in Node.js

**Sample JSON Output:**
```json
{"activities-steps": [{"dateTime": "2025-03-01", "value": "10500"}], "activities-heart": [{"dateTime": "2025-03-01", "value": {"heartRate": 72}}]}
```

**TypeScript Compatibility:** Fitbit-node package includes TypeScript definitions.

### 3. RescueTime API

**Why Chosen:** Free tier for basic tracking, JSON output, monitors online behavior (app/site usage), emphasizes user consent.

**Authentication Setup:**
- Sign up for RescueTime account
- Generate API key in account settings
- Use HTTP requests with key in Node.js

**Sample JSON Output:**
```json
{"rows": [["2025-03-01T09:00:00", 1800, "Coding", "Visual Studio Code", 5, 1]], "row_headers": ["time", "duration", "activity", "source", "productivity", "category"]}
```

**TypeScript Compatibility:** No official typings, but JSON structure is easily typed in TypeScript.

### 4. Strava API

**Why Chosen:** Free tier, JSON output, tracks physical activity (runs, rides) with GPS, requires user OAuth consent.

**Authentication Setup:**
- Register app in Strava API portal
- Implement OAuth 2.0 with client ID/secret
- Use strava-v3 npm package in Node.js

**Sample JSON Output:**
```json
{"id": 123456, "type": "Run", "distance": 5000, "start_date": "2025-03-01T08:00:00Z", "average_speed": 3.5}
```

**TypeScript Compatibility:** Strava-v3 package supports TypeScript with custom typings.

## Metadata
- Worker: Researcher Rita
- Date: 2025-03-01
- Source File: behavioral_data_sources_2025-03-01.json
