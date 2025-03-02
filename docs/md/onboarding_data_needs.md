# Research onboarding data needs for Sibling

## Domain: Research
**Sub-Context:** Sibling collects volunteered data during onboarding (e.g., interests, goals). We use Node.js, TypeScript, MongoDB, and React. Aim for a comprehensive yet user-friendly data set.
**Deliverable:** A JSON list of 5-10 volunteered data fields (e.g., goals, location, profession) with descriptions, suggested input methods (e.g., dropdown, checkbox, text), and why they’re valuable.
**Notes:** Balance completeness with usability—consider external API integration for prepopulated options.

## Results

### 1. Interests

**Description:** User’s hobbies or topics of interest (e.g., tech, fitness, music).

**Suggested Input Method:** Multi-select dropdown or tags

**Why Valuable:** Enables personalized content and AI recommendations. Prepopulate options via external taxonomy APIs (e.g., Wikipedia, Google Knowledge Graph).

### 2. Primary Goal

**Description:** Main objective for using Sibling (e.g., productivity, health, learning).

**Suggested Input Method:** Dropdown

**Why Valuable:** Guides AI assistant focus and prioritization. Predefined options ensure simplicity and consistency.

### 3. Location

**Description:** User’s city or region (e.g., New York, NY).

**Suggested Input Method:** Text with autocomplete

**Why Valuable:** Contextualizes data (e.g., weather, local events) for AI insights. Integrate with Google Places API for prepopulated suggestions.

### 4. Profession

**Description:** User’s job or industry (e.g., software developer, healthcare).

**Suggested Input Method:** Dropdown with optional text

**Why Valuable:** Tailors AI support to work-related needs. Prepopulate via LinkedIn API or industry lists.

### 5. Preferred Communication Style

**Description:** How user likes to receive info (e.g., concise, detailed, visual).

**Suggested Input Method:** Radio buttons

**Why Valuable:** Customizes AI interaction style for user comfort and engagement.

### 6. Daily Availability

**Description:** Times user is free for tasks (e.g., mornings, evenings).

**Suggested Input Method:** Checkbox list (e.g., morning, afternoon, evening)

**Why Valuable:** Optimizes AI scheduling and reminders based on user routine.

### 7. Fitness Level

**Description:** Self-reported activity level (e.g., beginner, intermediate, advanced).

**Suggested Input Method:** Dropdown

**Why Valuable:** Supports health-related AI features and integration with fitness trackers.

### 8. Learning Style

**Description:** Preferred way to learn (e.g., visual, auditory, kinesthetic).

**Suggested Input Method:** Checkbox (multi-select)

**Why Valuable:** Enhances AI-driven educational recommendations and content delivery.

## Metadata
- Worker: Researcher Rita
- Date: 2025-03-01
- Source File: onboarding_data_needs_2025-03-01.json
