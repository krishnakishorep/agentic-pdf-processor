# 🔌 API Documentation

## Overview

The Agentic PDF Processor exposes a RESTful API and WebSocket connections for real-time agent communication. All endpoints are built on Next.js API routes with full TypeScript support.

## Base URL
```
Production: https://agentic-pdf-processor.vercel.app/api
Development: http://localhost:3000/api
```

## Authentication

All API endpoints require authentication using Supabase Auth tokens.

```typescript
// Request headers
{
  "Authorization": "Bearer <supabase_jwt_token>",
  "Content-Type": "application/json"
}
```

---

## 📄 Document Management Endpoints

### Upload Document
Upload a new PDF document for processing.

```http
POST /api/documents/upload
```

**Request Body (multipart/form-data):**
```typescript
{
  file: File;           // PDF file (max 50MB)
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}
```

**Response:**
```typescript
{
  success: true,
  document: {
    id: string;
    filename: string;
    fileSize: number;
    status: 'uploaded' | 'processing' | 'completed' | 'error';
    uploadedAt: string;
    metadata?: DocumentMetadata;
  }
}
```

### Get Documents
Retrieve user's documents with filtering and pagination.

```http
GET /api/documents?page=1&limit=20&type=contract&status=completed
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `type` (optional): Document type filter
- `status` (optional): Processing status filter
- `search` (optional): Search query

**Response:**
```typescript
{
  success: true,
  documents: Document[],
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
```

### Get Document Details
Retrieve detailed information about a specific document.

```http
GET /api/documents/:id
```

**Response:**
```typescript
{
  success: true,
  document: {
    id: string;
    filename: string;
    status: string;
    analysis?: DocumentAnalysis;
    extractedData?: StructuredData;
    generatedContent?: GeneratedContent;
    processingHistory: ProcessingEvent[];
  }
}
```

### Delete Document
Delete a document and all associated data.

```http
DELETE /api/documents/:id
```

**Response:**
```typescript
{
  success: true,
  message: "Document deleted successfully"
}
```

---

## 🎨 PDF Creation Endpoints

### Create PDF from Template
Generate a new PDF document using a predefined template.

```http
POST /api/documents/create-from-template
```

**Request Body:**
```typescript
{
  templateId: string;
  data: {
    [key: string]: any;
  };
  options?: {
    filename?: string;
    outputFormat?: 'pdf' | 'preview';
    customStyling?: StyleOverrides;
  };
}
```

**Response:**
```typescript
{
  success: true,
  document: {
    id: string;
    filename: string;
    downloadUrl: string;
    previewUrl: string;
    status: 'generating' | 'completed';
    templateUsed: string;
  }
}
```

### Create PDF from Description
Generate a PDF document from natural language description using AI.

```http
POST /api/documents/create-from-description
```

**Request Body:**
```typescript
{
  description: string;
  documentType?: 'contract' | 'invoice' | 'report' | 'form' | 'custom';
  additionalData?: {
    [key: string]: any;
  };
  stylePreferences?: {
    template?: string;
    branding?: BrandingSpec;
    layout?: 'portrait' | 'landscape';
  };
}
```

**Response:**
```typescript
{
  success: true,
  taskId: string;
  estimatedDuration: number;
  generationSteps: string[];
}
```

### Get Document Templates
Retrieve available document templates.

```http
GET /api/templates?category=contract&user_only=true
```

**Query Parameters:**
- `category` (optional): Template category filter
- `user_only` (optional): Show only user's custom templates
- `public_only` (optional): Show only public templates

**Response:**
```typescript
{
  success: true,
  templates: {
    id: string;
    name: string;
    description: string;
    category: string;
    previewUrl: string;
    variables: TemplateVariable[];
    isPublic: boolean;
    createdBy: string;
  }[];
}
```

### Create Custom Template
Create a new document template.

```http
POST /api/templates/create
```

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  documentType: string;
  templateData: TemplateSpec;
  styleSheet?: StyleSheet;
  isPublic?: boolean;
  variables: VariableDefinition[];
}
```

**Response:**
```typescript
{
  success: true,
  template: {
    id: string;
    name: string;
    version: number;
    createdAt: string;
    previewUrl: string;
  }
}
```

### Fill Existing PDF Form
Fill an existing PDF form with data.

```http
POST /api/documents/fill-form
```

**Request Body:**
```typescript
{
  sourceDocumentId: string;
  fieldData: {
    [fieldName: string]: string | number | boolean;
  };
  options?: {
    flatten?: boolean;
    filename?: string;
  };
}
```

**Response:**
```typescript
{
  success: true,
  document: {
    id: string;
    filename: string;
    downloadUrl: string;
    fieldsCompleted: number;
    totalFields: number;
  }
}
```

### Generate Content with AI Writing
Create intelligent content using AI-driven writing with smart prompts and brainstorming.

```http
POST /api/content/ai-generate
```

**Request Body:**
```typescript
{
  documentType: 'marketing_proposal' | 'legal_contract' | 'technical_report' | 'grant_proposal' | 'business_plan' | 'custom';
  contentSection: string; // e.g., 'executive_summary', 'technical_approach', 'value_proposition'
  userInput: string; // Initial user description or requirements
  context?: {
    audience: 'executive' | 'technical' | 'legal' | 'academic' | 'general';
    tone: 'professional' | 'casual' | 'technical' | 'persuasive' | 'academic';
    length: 'brief' | 'standard' | 'comprehensive';
    existingData?: DataSource[]; // Reference to user's documents/data
  };
  promptPreference?: 'guided' | 'autonomous'; // Let AI suggest prompts vs. use as-is
}
```

**Response:**
```typescript
{
  success: true,
  taskId: string;
  suggestedPrompts?: PromptSuggestion[]; // If promptPreference is 'guided'
  generatedContent?: GeneratedContent; // If promptPreference is 'autonomous'
  brainstormingSession?: {
    sessionId: string;
    initialIdeas: string[];
    nextStepSuggestions: string[];
  };
}
```

### Get Smart Prompt Suggestions
Get AI-generated prompt suggestions based on document type and context.

```http
POST /api/content/suggest-prompts
```

**Request Body:**
```typescript
{
  documentType: string;
  contentSection?: string;
  userInput: string;
  context: {
    industry?: string;
    audience: AudienceType;
    purpose: string;
    existingData?: DataReference[];
  };
}
```

**Response:**
```typescript
{
  success: true,
  promptSuggestions: {
    category: string;
    prompts: {
      text: string;
      confidence: number;
      expectedOutcome: string;
      complexity: 'simple' | 'intermediate' | 'advanced';
    }[];
  }[];
  customPromptBuilder: {
    template: string;
    variables: VariableDefinition[];
  };
}
```

### Start Brainstorming Session
Begin an interactive content brainstorming session with AI assistance.

```http
POST /api/content/brainstorm/start
```

**Request Body:**
```typescript
{
  topic: string;
  documentType: string;
  constraints?: {
    budget?: number;
    timeline?: string;
    targetOutcome?: string;
    restrictions?: string[];
  };
  collaborationStyle: 'structured' | 'free_form' | 'guided';
}
```

**Response:**
```typescript
{
  success: true,
  sessionId: string;
  initialQuestions: string[];
  ideaSeeds: string[];
  suggestedDirections: string[];
  estimatedDuration: number;
}
```

### Continue Brainstorming Session
Continue an active brainstorming session with idea expansion and refinement.

```http
POST /api/content/brainstorm/{sessionId}/continue
```

**Request Body:**
```typescript
{
  selectedIdeas: string[];
  userFeedback: string;
  direction: 'expand' | 'refine' | 'combine' | 'explore_alternatives';
  additionalContext?: string;
}
```

**Response:**
```typescript
{
  success: true,
  expandedIdeas?: string[];
  refinedConcepts?: string[];
  hybridSolutions?: string[];
  nextStepOptions: string[];
  readinessScore: number; // 0-100, how ready for content generation
}
```

### Optimize Content Quality
Improve existing content using AI optimization techniques.

```http
POST /api/content/optimize
```

**Request Body:**
```typescript
{
  content: string;
  optimizationCriteria: {
    clarity: boolean;
    engagement: boolean;
    persuasiveness: boolean;
    technicalAccuracy: boolean;
    grammarStyle: boolean;
  };
  targetAudience: AudienceProfile;
  desiredTone?: ToneProfile;
  existingData?: DataSource[]; // For fact-checking and enrichment
}
```

**Response:**
```typescript
{
  success: true,
  optimizedContent: string;
  improvements: {
    type: 'clarity' | 'engagement' | 'grammar' | 'structure' | 'factual';
    description: string;
    beforeText: string;
    afterText: string;
    impact: 'low' | 'medium' | 'high';
  }[];
  qualityScore: {
    before: number;
    after: number;
    categories: {
      clarity: number;
      engagement: number;
      accuracy: number;
      coherence: number;
    };
  };
}
```

### Adapt Content for Multiple Audiences
Generate multiple versions of content optimized for different audiences.

```http
POST /api/content/multi-adapt
```

**Request Body:**
```typescript
{
  sourceContent: string;
  targetAudiences: {
    name: string;
    profile: AudienceProfile;
    priority: 'high' | 'medium' | 'low';
  }[];
  preserveCore: boolean; // Keep core message consistent
}
```

**Response:**
```typescript
{
  success: true,
  adaptedVersions: {
    audienceName: string;
    content: string;
    adaptationSummary: string;
    keyChanges: string[];
  }[];
  coreMessagePreserved: boolean;
}
```

---

## ✏️ PDF Editing Endpoints

### Edit PDF Text
Modify text content in existing PDF documents.

```http
PUT /api/documents/{id}/edit-text
```

**Request Body:**
```typescript
{
  edits: {
    pageNumber: number;
    position: { x: number; y: number };
    operation: 'replace' | 'insert' | 'delete';
    oldText?: string;
    newText: string;
    formatting?: TextFormatting;
  }[];
  preserveLayout: boolean;
  createVersion: boolean;
}
```

**Response:**
```typescript
{
  success: true,
  document: {
    id: string;
    versionNumber: number;
    downloadUrl: string;
    previewUrl: string;
    changes: EditSummary[];
  }
}
```

### Add Annotations
Add comments, highlights, and markup to PDF documents.

```http
POST /api/documents/{id}/annotations
```

**Request Body:**
```typescript
{
  annotations: {
    type: 'highlight' | 'comment' | 'drawing' | 'stamp';
    pageNumber: number;
    position: Position;
    content: string;
    style?: AnnotationStyle;
  }[];
  author: string;
}
```

### Edit PDF Forms
Modify form fields and their properties.

```http
PUT /api/documents/{id}/forms
```

**Request Body:**
```typescript
{
  formEdits: {
    fieldName: string;
    operation: 'add' | 'modify' | 'delete';
    fieldType?: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'signature';
    properties?: FormFieldProperties;
  }[];
}
```

---

## 📚 PDF Organization Endpoints

### Merge Documents
Combine multiple PDF documents into one.

```http
POST /api/documents/merge
```

**Request Body:**
```typescript
{
  documentIds: string[];
  mergeOptions: {
    insertBookmarks: boolean;
    preserveFormFields: boolean;
    pageNumbering: 'continue' | 'restart' | 'custom';
    customTitle?: string;
  };
}
```

**Response:**
```typescript
{
  success: true,
  mergedDocument: {
    id: string;
    filename: string;
    pageCount: number;
    downloadUrl: string;
    sourceDocuments: string[];
  }
}
```

### Split Document
Split a PDF document into multiple files.

```http
POST /api/documents/{id}/split
```

**Request Body:**
```typescript
{
  splitMethod: 'page_ranges' | 'bookmark_levels' | 'content_detection';
  ranges?: { start: number; end: number; title?: string }[];
  bookmarkLevel?: number;
  contentPattern?: string;
}
```

**Response:**
```typescript
{
  success: true,
  splitDocuments: {
    id: string;
    filename: string;
    pageRange: string;
    downloadUrl: string;
  }[];
}
```

### Reorder Pages
Rearrange pages within a PDF document.

```http
PUT /api/documents/{id}/reorder-pages
```

**Request Body:**
```typescript
{
  newPageOrder: number[];
  createVersion: boolean;
}
```

### Extract Pages
Extract specific pages to create a new document.

```http
POST /api/documents/{id}/extract-pages
```

**Request Body:**
```typescript
{
  pageRanges: { start: number; end: number }[];
  outputFilename: string;
}
```

---

## ✍️ E-signature Endpoints

### Create Signature Fields
Add signature fields to a PDF document.

```http
POST /api/documents/{id}/signature-fields
```

**Request Body:**
```typescript
{
  signatureFields: {
    pageNumber: number;
    position: Position;
    size: Size;
    signerEmail: string;
    required: boolean;
    fieldName: string;
  }[];
}
```

### Initiate Signing Session
Start a document signing workflow using Adobe Acrobat Sign.

```http
POST /api/documents/{id}/signing-session
```

**Request Body:**
```typescript
{
  signers: {
    email: string;
    name: string;
    role: string;
    signingOrder?: number;
    authMethod: 'email' | 'sms' | 'phone' | 'knowledge_based' | 'government_id' | 'adobe_sign_auth';
    adobeSignGroup?: string; // For enterprise accounts
  }[];
  signingWorkflow: {
    type: 'sequential' | 'parallel' | 'hybrid';
    deadline?: Date;
    reminderSettings?: {
      firstReminderDelay: number; // hours
      reminderFrequency: number; // hours
    };
    password?: string;
    messageToSigners?: string;
  };
  completionActions?: {
    sendCopyToSenders: boolean;
    sendCopyToSigners: boolean;
    notifyCompletionEmail?: string;
    webhookUrl?: string;
    archiveDocument?: boolean;
  };
  adobeSignOptions?: {
    mergeFieldInfo?: MergeField[];
    securityOptions?: SecurityOptions;
    vaultingInfo?: VaultingOptions;
  };
}
```

**Response:**
```typescript
{
  success: true,
  agreementId: string; // Adobe Sign Agreement ID
  sessionId: string; // Internal tracking ID
  signingUrls: {
    signerEmail: string;
    signingUrl: string;
    embeddedSigningUrl?: string; // For iframe embedding
    expiresAt: Date;
  }[];
  agreementStatusUrl: string;
  documentHistoryUrl: string;
}
```

### Check Signature Status
Get the current status of a signing session.

```http
GET /api/signatures/session/{sessionId}/status
```

**Response:**
```typescript
{
  success: true,
  session: {
    id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
    completionPercentage: number;
    signerProgress: {
      email: string;
      status: 'not_started' | 'viewed' | 'signed';
      signedAt?: Date;
    }[];
    completedAt?: Date;
    signedDocumentUrl?: string;
  }
}
```

---

## 📧 Gmail Integration Endpoints

### Connect Gmail Account
Authenticate and connect user's Gmail account.

```http
POST /api/gmail/connect
```

**Request Body:**
```typescript
{
  authCode: string; // OAuth2 authorization code from Gmail
}
```

**Response:**
```typescript
{
  success: true,
  connectionStatus: 'connected',
  emailAddress: string;
  permissions: string[];
}
```

### Read Emails
Retrieve emails based on query parameters.

```http
GET /api/gmail/emails?q=from:client@company.com&maxResults=10&unreadOnly=true
```

**Query Parameters:**
- `q` (optional): Gmail search query
- `maxResults` (optional): Number of emails to return (default: 20, max: 100)
- `unreadOnly` (optional): Only return unread emails
- `hasAttachments` (optional): Only return emails with attachments

**Response:**
```typescript
{
  success: true,
  emails: {
    id: string;
    threadId: string;
    subject: string;
    from: ContactInfo;
    to: ContactInfo[];
    date: Date;
    snippet: string;
    isUnread: boolean;
    hasAttachments: boolean;
    labels: string[];
  }[];
  nextPageToken?: string;
}
```

### Extract Email Context
Parse email content for AI writing context.

```http
POST /api/gmail/extract-context
```

**Request Body:**
```typescript
{
  emailId: string;
  contextType: 'response_generation' | 'document_creation' | 'data_extraction';
}
```

**Response:**
```typescript
{
  success: true,
  context: {
    sender: ContactInfo;
    subject: string;
    extractedEntities: Entity[];
    sentiment: 'positive' | 'neutral' | 'negative';
    urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
    keyTopics: string[];
    suggestedResponseType: 'acknowledgment' | 'detailed_response' | 'document_request' | 'meeting_request';
    relevantDocuments?: DocumentSuggestion[];
  }
}
```

### Generate Email Response
Create AI-powered email responses based on context.

```http
POST /api/gmail/generate-response
```

**Request Body:**
```typescript
{
  emailId: string;
  responseType: 'acknowledgment' | 'detailed_response' | 'decline' | 'custom';
  customInstructions?: string;
  tone: 'professional' | 'friendly' | 'formal' | 'casual';
  includeAttachments?: boolean;
  attachDocumentIds?: string[];
}
```

**Response:**
```typescript
{
  success: true,
  emailDraft: {
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
    attachments: {
      filename: string;
      documentId: string;
      size: number;
    }[];
  };
  confidence: number;
  suggestedImprovements?: string[];
}
```

### Send Email with Attachments
Send email with PDF document attachments.

```http
POST /api/gmail/send
```

**Request Body:**
```typescript
{
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyType: 'plain' | 'html';
  attachDocumentIds?: string[];
  scheduleSend?: Date;
}
```

---

## 🧠 Smart Suggestions Endpoints

### Get Document Suggestions
Get AI-powered suggestions based on document type and content.

```http
GET /api/documents/{id}/suggestions
```

**Response:**
```typescript
{
  success: true,
  suggestions: {
    category: 'edit' | 'organize' | 'sign' | 'email' | 'analyze' | 'create';
    action: string;
    description: string;
    confidence: number;
    estimatedDuration: number;
    requiredPermissions?: string[];
    actionUrl?: string;
    previewData?: any;
  }[];
  documentContext: {
    type: string;
    complexity: 'simple' | 'medium' | 'complex';
    suggestedWorkflow: string;
  };
}
```

### Execute Suggested Action
Execute a smart suggestion action.

```http
POST /api/suggestions/{suggestionId}/execute
```

**Request Body:**
```typescript
{
  parameters?: {
    [key: string]: any;
  };
  userConfirmation: boolean;
}
```

**Response:**
```typescript
{
  success: true,
  taskId: string;
  executionStatus: 'started' | 'completed' | 'failed';
  result?: any;
  nextSuggestions?: SmartSuggestion[];
}
```

### Provide Suggestion Feedback
Give feedback on suggestion quality and relevance.

```http
POST /api/suggestions/{suggestionId}/feedback
```

**Request Body:**
```typescript
{
  feedback: 'helpful' | 'not_helpful' | 'incorrect' | 'irrelevant';
  rating: number; // 1-5 scale
  comments?: string;
  alternativeAction?: string;
}
```

---

## 🤖 Agent Interaction Endpoints

### Start Analysis
Manually trigger document analysis by specific agents.

```http
POST /api/agents/analyze/:documentId
```

**Request Body:**
```typescript
{
  agents: ('document-analysis' | 'data-extraction' | 'content-generation')[];
  options?: {
    priority?: 'low' | 'medium' | 'high';
    customPrompt?: string;
    outputFormat?: 'json' | 'markdown' | 'html';
  };
}
```

**Response:**
```typescript
{
  success: true,
  taskId: string;
  estimatedDuration: number; // seconds
  queuePosition: number;
}
```

### Get Agent Status
Check the status of agent tasks.

```http
GET /api/agents/status/:taskId
```

**Response:**
```typescript
{
  success: true,
  task: {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number; // 0-100
    currentStep: string;
    result?: any;
    error?: string;
    estimatedTimeRemaining?: number;
  }
}
```

### Execute Workflow
Execute a custom workflow with multiple agents.

```http
POST /api/workflows/execute
```

**Request Body:**
```typescript
{
  documentIds: string[];
  workflowType: 'contract-analysis' | 'invoice-processing' | 'report-summary' | 'custom';
  customWorkflow?: {
    steps: WorkflowStep[];
    dependencies: Dependency[];
  };
  options?: {
    parallel?: boolean;
    priority?: 'low' | 'medium' | 'high';
  };
}
```

**Response:**
```typescript
{
  success: true,
  workflowId: string;
  estimatedDuration: number;
  steps: {
    stepId: string;
    agent: string;
    status: 'pending' | 'running' | 'completed';
    estimatedDuration: number;
  }[];
}
```

---

## 📊 Data & Analytics Endpoints

### Get Extracted Data
Retrieve structured data extracted from documents.

```http
GET /api/data/extracted/:documentId
```

**Response:**
```typescript
{
  success: true,
  extractedData: {
    tables: TableData[];
    fields: FieldData[];
    entities: EntityData[];
    confidence: ConfidenceMetrics;
  }
}
```

### Export Data
Export extracted data in various formats.

```http
POST /api/data/export
```

**Request Body:**
```typescript
{
  documentIds: string[];
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  includeMetadata?: boolean;
  customFields?: string[];
}
```

**Response:**
```typescript
{
  success: true,
  downloadUrl: string;
  expiresAt: string;
}
```

### Get Analytics
Retrieve processing analytics and performance metrics.

```http
GET /api/analytics?period=7d&metric=processing-time
```

**Query Parameters:**
- `period`: Time period ('24h', '7d', '30d', '90d')
- `metric`: Specific metric to retrieve

**Response:**
```typescript
{
  success: true,
  analytics: {
    totalDocuments: number;
    processingTime: {
      average: number;
      min: number;
      max: number;
    };
    accuracyRates: {
      [agentType: string]: number;
    };
    userSatisfaction: number;
    trends: TimeSeriesData[];
  }
}
```

---

## 📝 Content Generation Endpoints

### Generate Summary
Generate document summaries with different styles.

```http
POST /api/content/summary
```

**Request Body:**
```typescript
{
  documentId: string;
  style: 'executive' | 'technical' | 'brief' | 'detailed';
  customPrompt?: string;
  maxLength?: number;
}
```

**Response:**
```typescript
{
  success: true,
  summary: {
    executiveSummary: string;
    keyPoints: string[];
    recommendations: string[];
    riskFactors: string[];
    nextSteps: ActionItem[];
    confidence: number;
  }
}
```

### Compare Documents
Generate comparative analysis between multiple documents.

```http
POST /api/content/compare
```

**Request Body:**
```typescript
{
  documentIds: string[];
  comparisonType: 'side-by-side' | 'differential' | 'summary';
  focusAreas?: string[];
}
```

**Response:**
```typescript
{
  success: true,
  comparison: {
    documents: DocumentSummary[];
    similarities: string[];
    differences: string[];
    recommendations: string[];
    visualization?: ChartData;
  }
}
```

### Generate Presentation
Create presentation slides from document data.

```http
POST /api/content/presentation
```

**Request Body:**
```typescript
{
  documentIds: string[];
  template: 'business' | 'technical' | 'executive' | 'custom';
  slideCount?: number;
  customTemplate?: PresentationTemplate;
}
```

**Response:**
```typescript
{
  success: true,
  presentation: {
    slides: Slide[];
    metadata: PresentationMetadata;
    downloadUrl: string;
  }
}
```

---

## ⚡ Real-Time WebSocket API

### Connection
Connect to the WebSocket server for real-time agent updates.

```javascript
const ws = new WebSocket('wss://agentic-pdf-processor.vercel.app/api/ws');

// Authentication
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### Message Types

#### Agent Progress Update
```typescript
{
  type: 'agent-progress',
  taskId: string,
  agentType: string,
  progress: number,
  currentStep: string,
  estimatedTimeRemaining: number
}
```

#### Task Completion
```typescript
{
  type: 'task-completed',
  taskId: string,
  result: any,
  success: boolean,
  duration: number
}
```

#### Proactive Suggestion
```typescript
{
  type: 'proactive-suggestion',
  suggestion: {
    id: string,
    type: string,
    title: string,
    description: string,
    confidence: number,
    actions: string[]
  }
}
```

#### System Status
```typescript
{
  type: 'system-status',
  status: 'online' | 'maintenance' | 'degraded',
  message?: string,
  agentStatus: {
    [agentType: string]: 'online' | 'offline' | 'busy'
  }
}
```

---

## 🔧 Configuration Endpoints

### Get User Preferences
Retrieve user's processing preferences and settings.

```http
GET /api/user/preferences
```

**Response:**
```typescript
{
  success: true,
  preferences: {
    defaultProcessingMode: 'autonomous' | 'guided';
    preferredSummaryStyle: 'executive' | 'technical' | 'brief';
    autoSuggestActions: boolean;
    notificationSettings: NotificationSettings;
    privacySettings: PrivacySettings;
  }
}
```

### Update User Preferences
Update user's processing preferences.

```http
PUT /api/user/preferences
```

**Request Body:**
```typescript
{
  preferences: Partial<UserPreferences>
}
```

### Provide Feedback
Submit feedback to improve agent performance.

```http
POST /api/feedback
```

**Request Body:**
```typescript
{
  taskId: string;
  rating: number; // 1-5
  feedback: string;
  category: 'accuracy' | 'speed' | 'relevance' | 'usability';
  suggestions?: string;
}
```

---

## 🚨 Error Handling

All API endpoints follow consistent error response format:

```typescript
{
  success: false,
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

### Common Error Codes

- `INVALID_AUTH`: Authentication token invalid or expired
- `DOCUMENT_NOT_FOUND`: Requested document doesn't exist
- `PROCESSING_FAILED`: Agent processing failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_FILE_FORMAT`: Unsupported file format
- `FILE_TOO_LARGE`: File exceeds size limit
- `QUOTA_EXCEEDED`: User quota exceeded

---

## 📈 Rate Limits

| Endpoint Category | Rate Limit | Window |
|------------------|------------|---------|
| Document Upload | 20 requests | 1 hour |
| Agent Processing | 100 requests | 1 hour |
| Data Export | 10 requests | 1 hour |
| General API | 1000 requests | 1 hour |

---

## 🔒 Security

### Data Encryption
- All API traffic uses HTTPS/TLS 1.3
- Document content encrypted at rest
- JWT tokens for authentication
- API key authentication for server-to-server

### Privacy Controls
- User data isolation
- Automatic data cleanup options
- GDPR compliance endpoints
- Audit trail for all actions

### Best Practices
- Always use HTTPS endpoints
- Store JWT tokens securely
- Implement proper error handling
- Use pagination for large datasets
- Implement client-side rate limiting
