# Research encryption options for MongoDB in Sibling

## Domain: Compliance
**Sub-Context:** Sibling stores personal data in MongoDB (Docker, port 27018). GDPR/CCPA requires encryption at rest and in transit.
**Deliverable:** A JSON object listing 2-3 encryption options (e.g., MongoDB native, third-party tools) with descriptions, pros/cons, and implementation notes.
**Notes:** Focus on TypeScript/Node.js compatibility and ease of setup with Docker.

## Results

### 1. MongoDB Native Encryption (Enterprise Edition)

**Description:** MongoDB Enterprise offers Encrypted Storage Engine for data at rest (AES-256) and TLS/SSL for data in transit, aligning with GDPR Art. 32 and CCPA §1798.150.

**Pros:**
- Built-in, seamless integration with MongoDB
- Supports TypeScript/Node.js via MongoDB Node.js driver
- Robust key management with KMIP

**Cons:**
- Requires MongoDB Enterprise license (costly)
- Setup complexity in Docker (requires custom images)

**Implementation Notes:** Use a Docker container with MongoDB Enterprise (e.g., `mongo:4.4-enterprise`), enable encryption with `--encryptionKeyFile` flag, and configure TLS with certificates. In TypeScript, use `mongodb` package with `tls: true` options.

### 2. MongoDB Client-Side Field Level Encryption (CSFLE)

**Description:** Encrypts specific fields client-side before data reaches MongoDB, using the Node.js driver’s encryption library. Supports AES-256 and works with Community Edition.

**Pros:**
- No Enterprise license needed
- Granular control over encrypted fields
- Fully compatible with TypeScript/Node.js via `mongodb-client-encryption`

**Cons:**
- Requires additional app-layer logic
- Key management must be handled externally (e.g., AWS KMS)

**Implementation Notes:** Install `mongodb-client-encryption` in your Node.js app, configure a key vault in MongoDB, and use in TypeScript with `AutoEncryption` options. Run MongoDB in Docker (`mongo:4.4`) on port 27018 with minimal changes.

### 3. Third-Party Tool: HashiCorp Vault

**Description:** A third-party encryption solution providing transit encryption and key management, integrated with MongoDB for at-rest encryption via a plugin.

**Pros:**
- Centralized key management
- Works with MongoDB Community Edition
- Docker-friendly with official images

**Cons:**
- Additional infrastructure (Vault server)
- More complex TypeScript/Node.js integration

**Implementation Notes:** Run Vault in Docker (`hashicorp/vault`), configure MongoDB to use Vault’s transit engine for encryption keys, and connect via TypeScript using `node-vault`. MongoDB in Docker (port 27018) requires a custom startup script.

## Metadata
- Worker: Compliance Clara
- Date: 2025-03-01
- Source File: mongodb_encryption_options_sibling_2025-03-01.json
