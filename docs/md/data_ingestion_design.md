# Design data ingestion system for Sibling

## Domain: System Design
**Sub-Context:** Sibling needs to ingest data from external APIs (e.g., Gmail, Plaid) and behavioral sources (e.g., Fitbit, RescueTime) into MongoDB. Use Rita’s research (docs/json/external_data_apis_2025-03-01.json, docs/json/behavioral_data_sources_2025-03-01.json) and existing schemas (VolunteeredData, BehavioralData, ExternalData). Deferred categories (InferredData, RelationalData) should be considered for future extensibility.
**Deliverable:** A JSON object with: - High-level architecture (e.g., microservices, monolithic). - Component breakdown (e.g., API client, data processor). - Data flow diagram (text-based description). - Implementation notes (e.g., API key management, error handling). - Scalability and performance considerations.
**Notes:** Prioritize modularity and alignment with current tech stack (Node.js, Express.js, MongoDB). Avoid overcomplicating for deferred categories.

## Results

### Architecture

Modular monolith within Node.js/Express.js application

### Components

### 1. Scheduler

**Description:** Triggers periodic data fetching for each user and connected data source.

### 2. API Clients

**Description:** Handle authentication and data fetching for specific data sources (e.g., Gmail, Fitbit).

### 3. Data Processors

**Description:** Transform raw data into MongoDB schema formats (BehavioralData, ExternalData).

### 4. Storage Module

**Description:** Inserts processed data into MongoDB with CSFLE encryption.

### 5. Event Receivers

**Description:** API endpoints to receive and process data from event sources.

### Data Flow

#### API-Based Ingestion:
- Scheduler triggers fetching for a data source.
- Query UserDataSources for connected users.
- For each user, decrypt credentials and fetch data using API Client.
- Process data with Data Processor.
- Save to MongoDB via Storage Module.

#### Event-Based Ingestion:
- Event source sends data to Event Receiver.
- Validate and process data with Data Processor.
- Save to MongoDB via Storage Module.

### Implementation Notes

- Store user-specific credentials in UserDataSources collection, encrypted with CSFLE.
- API Clients must handle OAuth token refresh and error retries.
- Data Processors should map data to correct schemas and validate inputs.
- Use Mongoose with CSFLE for field-level encryption.
- Implement logging and monitoring for ingestion tasks.

### Scalability Notes

- Initially, run ingestion sequentially within the main app.
- Consider queue-based system for horizontal scaling if needed.
- Optimize API calls with rate limit handling and caching.


## Metadata
- Worker: Designer Drew
- Date: 2025-03-05
- Source File: data_ingestion_design_2025-03-05.json
