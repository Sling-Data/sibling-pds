# Research limitations of MongoDB Community Edition with CSFLE and pricing tiers beyond it

## Domain: Compliance
**Sub-Context:** Sibling uses MongoDB Community Edition in Docker (port 27018) with TypeScript/Node.js. Evaluating CSFLE for encryption.
**Deliverable:** A JSON object detailing CSFLE limitations in Community Edition and pricing for higher tiers (e.g., Enterprise, Atlas).
**Notes:** Focus on compliance (GDPR/CCPA), simplicity, and cost implications.

## Results

### 1. limitation
**Limitation:** No Automatic Encryption

**Description:** Community Edition lacks the `mongocryptd` daemon required for automatic CSFLE, meaning encryption/decryption must be explicitly coded in the app (unlike Enterprise/Atlas). This increases complexity for TypeScript/Node.js developers.

**Impact:** Requires manual encryption logic using `mongodb-client-encryption`, impacting simplicity but still GDPR/CCPA-compliant with proper key management.

### 2. limitation
**Limitation:** Limited Query Support

**Description:** CSFLE in Community Edition doesn’t support complex queries (e.g., aggregations, $lookup) on encrypted fields due to server-side restrictions on encrypted BinData.

**Impact:** May limit *Sibling*’s ability to perform advanced analytics on encrypted data, though basic equality searches are possible with deterministic encryption.

### 3. limitation
**Limitation:** No Built-in Key Management

**Description:** Community Edition lacks native integration with Key Management Interoperability Protocol (KMIP), requiring external solutions (e.g., AWS KMS) for secure key storage.

**Impact:** Adds setup overhead in Docker but remains cost-free if using local key files or affordable KMS options.

### 4. limitation
**Limitation:** No Server-Side Schema Enforcement

**Description:** Unlike Enterprise/Atlas, Community Edition can’t enforce encryption schemas at the database level, relying entirely on client-side logic.

**Impact:** Increases risk of misconfiguration but manageable with robust TypeScript code reviews.

### 1. tier
**Tier:** MongoDB Enterprise Advanced

**Description:** Self-managed, on-premises or cloud-hosted MongoDB with full CSFLE support, including automatic encryption via `mongocryptd` and KMIP integration.

**Pricing:** Subscription-based, starts at ~$10,000/year for small deployments (varies by node count, support level). Contact MongoDB sales for exact quotes.

**Pros:** Simplifies CSFLE with automatic encryption, enhances compliance with auditing and support.

**Cons:** High cost, requires Docker customization for deployment.

### 2. tier
**Tier:** MongoDB Atlas (Shared Tier)

**Description:** Managed cloud service with free tier (M0: 512MB RAM, 5GB storage) and shared tiers (M2/M5) starting at ~$9/month. CSFLE supported but requires Enterprise features for full automation.

**Pricing:** Pay-as-you-go, ~$0.012/hour ($9/month) for M2, scales with usage.

**Pros:** Low entry cost, Docker-compatible, managed backups/security.

**Cons:** Automatic CSFLE requires higher tiers (e.g., M10+ at $57/month), limited resources in free/shared tiers.

### 3. tier
**Tier:** MongoDB Atlas (Dedicated Tier)

**Description:** Fully managed with automatic CSFLE, KMIP, and advanced features. Starts at M10 tier with 2GB RAM, 10GB storage.

**Pricing:** ~$0.08/hour ($57/month) for M10, up to $100s/month for multi-region or large clusters.

**Pros:** Best for compliance (GDPR/CCPA), zero Docker setup, scales easily.

**Cons:** Cost increases with scale, less control vs. self-managed.

## Metadata
- Worker: Compliance Clara
- Date: 2025-03-01
- Source File: csfle_limitations_pricing_sibling_2025-03-01.json
