# Design consent flows for GDPR/CCPA compliance in Sibling

## Domain: Compliance
**Sub-Context:** Sibling collects volunteered, behavioral, and external data in MongoDB (Community Edition, CSFLE-enabled). Users control access. Frontend is React.
**Deliverable:** A JSON object with 3-5 consent flow steps (e.g., initial consent, data type opt-in, revocation) including descriptions, UI suggestions (e.g., checkboxes, buttons), and GDPR/CCPA alignment notes.
**Notes:** Focus on user clarity and legal requirements. Coordinate with CSFLE implementation if needed—Coder Carl can answer questions via Tomé.

## Results

### 1. Initial Consent Prompt

**Description:** Presented to users on first interaction with Sibling (e.g., signup or app launch), explaining data collection purpose and requesting consent.

**UI Suggestions:**
- Component: Modal
- Elements:
  - Text: 'Sibling collects your data to personalize AI assistants. Agree to proceed?'
  - Button: 'Accept' (green, primary)
  - Button: 'Learn More' (links to privacy policy)

**GDPR/CCPA Alignment:** GDPR Art. 6(1)(a): Requires explicit, informed consent before processing. CCPA §1798.100: Ensures transparency on data use. Stores consent timestamp in MongoDB (CSFLE-encrypted field).

### 2. Data Type Opt-In Selection

**Description:** Allows users to choose which data types (volunteered, behavioral, external) Sibling can collect, with clear explanations for each.

**UI Suggestions:**
- Component: Form
- Elements:
  - Checkbox: 'Volunteered Data (e.g., profile info)' + tooltip: 'Data you manually provide'
  - Checkbox: 'Behavioral Data (e.g., app usage)' + tooltip: 'How you interact with Sibling'
  - Checkbox: 'External Data (e.g., social media)' + tooltip: 'Imported from third parties'
  - Button: 'Save Preferences' (disabled until at least one checked)

**GDPR/CCPA Alignment:** GDPR Art. 5(1)(c): Enforces data minimization by letting users opt in per category. CCPA §1798.120: Supports consumer opt-out rights (opt-in here exceeds requirement). Preferences encrypted via CSFLE.

### 3. Consent Confirmation

**Description:** Confirms user’s selections with a summary before finalizing, offering a chance to revise.

**UI Suggestions:**
- Component: Dialog
- Elements:
  - Text: 'You’ve agreed to: [list selected data types]. Continue?'
  - Button: 'Confirm' (proceeds to save)
  - Button: 'Edit' (returns to opt-in form)

**GDPR/CCPA Alignment:** GDPR Art. 7(1): Ensures consent is freely given and verifiable. CCPA §1798.135: Provides clear notice before collection. Logs confirmation in MongoDB with CSFLE.

### 4. Consent Management Dashboard

**Description:** A persistent UI section where users review and update consent settings anytime.

**UI Suggestions:**
- Component: Settings Page
- Elements:
  - Table: Current consents (data type, status, date)
  - Toggle: Enable/disable per data type
  - Button: 'Update Preferences' (saves changes)

**GDPR/CCPA Alignment:** GDPR Art. 7(3): Allows consent withdrawal as easily as it’s given. CCPA §1798.105: Supports data access and deletion rights. Updates encrypted in MongoDB.

### 5. Consent Revocation

**Description:** Lets users fully revoke consent, stopping all data collection and triggering data deletion where required.

**UI Suggestions:**
- Component: Confirmation Modal
- Elements:
  - Text: 'Revoke all consent? This stops data collection and may delete stored data.'
  - Button: 'Revoke' (red, requires second click to confirm)
  - Button: 'Cancel' (closes modal)

**GDPR/CCPA Alignment:** GDPR Art. 17: Right to erasure (‘right to be forgotten’). CCPA §1798.105: Right to delete personal info. Deletion flags set in MongoDB, respecting CSFLE-encrypted fields.

## Metadata
- Worker: Compliance Clara
- Date: 2025-03-01
- Source File: consent_flows_sibling_2025-03-01.json
