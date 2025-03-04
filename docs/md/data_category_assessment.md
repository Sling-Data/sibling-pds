# Assess data category assumptions for Sibling

## Domain: Research
**Sub-Context:** Sibling currently categorizes data into volunteered (user-provided), behavioral (action-based), and external (API-sourced). Assess if these cover all relevant data types for a comprehensive PDS. Consider user context, AI training needs, and potential gaps in the current model.
**Deliverable:** A JSON list of 3-5 potential data categories (including or beyond volunteered, behavioral, external) with names, descriptions, relevance to Sibling’s goals, and suggested fields.
**Notes:** Leverage the project description, tech stack, and data model. Suggest fields that align with MongoDB/Mongoose and TypeScript.

## Results

### 1. VolunteeredData

**Description:** Data explicitly provided by users during onboarding or updates (e.g., interests, goals).

**Relevance to Goals:** Forms the foundational user profile for AI personalization, ensuring transparency as users control inputs.

**Suggested Fields:**
```typescript
userId: ObjectId (ref User)
type: string (e.g., 'interest', 'goal')
value: mixed (string, number, array, etc.)
timestamp: Date
source: string (default: 'user', for audit trail)
```

### 2. BehavioralData

**Description:** Data derived from user actions within Sibling or tracked sources (e.g., clicks, fitness logs).

**Relevance to Goals:** Captures real-time habits and preferences, enhancing AI’s ability to adapt to user behavior.

**Suggested Fields:**
```typescript
userId: ObjectId (ref User)
action: string (e.g., 'clicked', 'loggedWorkout')
context: mixed (e.g., { 'url': string, 'duration': number })
timestamp: Date
consentLevel: string (e.g., 'explicit', 'implied', for transparency)
```

### 3. ExternalData

**Description:** Data imported from third-party APIs (e.g., Gmail, Fitbit) with user consent.

**Relevance to Goals:** Enriches the profile with contextual data, broadening AI’s support scope (e.g., scheduling, health).

**Suggested Fields:**
```typescript
userId: ObjectId (ref User)
source: string (e.g., 'gmail', 'fitbit')
data: mixed (nested JSON from API)
timestamp: Date
encryptionStatus: boolean (true if encrypted with AES-256-CBC)
```

### 4. InferredData

**Description:** Data derived from analysis of other categories (e.g., predicted preferences, mood trends).

**Relevance to Goals:** Fills gaps in explicit data, enabling proactive AI insights while requiring clear transparency to maintain trust.

**Suggested Fields:**
```typescript
userId: ObjectId (ref User)
type: string (e.g., 'preference', 'trend')
value: mixed (e.g., { 'category': string, 'confidence': number })
sourceCategory: string (e.g., 'BehavioralData', 'VolunteeredData')
timestamp: Date
```

### 5. RelationalData

**Description:** Data about user connections or interactions (e.g., contacts, social patterns), sourced with consent.

**Relevance to Goals:** Adds social context for AI to support collaboration or communication tasks, enhancing personalization.

**Suggested Fields:**
```typescript
userId: ObjectId (ref User)
type: string (e.g., 'contact', 'interaction')
relatedEntity: mixed (e.g., { 'email': string, 'name': string })
context: mixed (e.g., { 'frequency': number, 'lastContact': Date })
timestamp: Date
```


## Metadata
- Worker: Researcher Rita
- Date: 2025-03-01
- Source File: data_category_assessment_2025-03-01.json
