# 🛠️ Tech Stack Documentation

## 🎨 Frontend Architecture

### Next.js 14+ (App Router)
- **Why**: Server-side rendering, API routes, optimal performance, and excellent developer experience
- **Features Used**:
  - App Router for modern routing
  - Server Components for better performance
  - API Routes for backend functionality
  - Streaming UI for real-time agent updates
  - Middleware for authentication and request handling

### Adobe React Spectrum
- **Why**: Enterprise-grade design system, accessibility-first, mobile responsive
- **Key Components**:
  - `ActionButton`, `Button` - Agent action triggers
  - `ComboBox`, `Picker` - Document type selection
  - `ProgressBar`, `ProgressCircle` - Agent task progress
  - `ListView`, `Table` - Document listings and data views
  - `DialogTrigger`, `Dialog` - Agent interaction modals
  - `StatusLight` - Agent status indicators
  - `Flex`, `Grid` - Layout components
  - `Provider` - Theme and locale management

#### React Spectrum Configuration
```json
{
  "@adobe/react-spectrum": "^3.34.0",
  "@spectrum-icons/illustrations": "^3.6.0",
  "@spectrum-icons/workflow": "^4.2.0"
}
```

## 🤖 AI/ML Stack

### OpenAI GPT-4 Turbo
- **Role**: Primary reasoning engine for agents
- **Use Cases**:
  - Document analysis and categorization
  - Task planning and decomposition
  - Content generation and summarization
  - Decision making logic

### Anthropic Claude 3
- **Role**: Secondary AI for complex reasoning and safety
- **Use Cases**:
  - Document review and validation
  - Complex analytical tasks
  - Ethical decision making
  - Long-form content generation

### LangChain
- **Why**: Agent orchestration, prompt management, tool integration
- **Features**:
  - Multi-agent workflows
  - Tool calling and function execution
  - Memory management
  - Prompt templates and optimization

## 📄 PDF Processing Stack

### PDF Reading & Analysis

#### PDF.js
- **Role**: Client-side PDF rendering and basic text extraction
- **Features**:
  - Secure PDF rendering in browser
  - Text layer extraction
  - Metadata parsing
  - Page-level processing

#### pdf2pic
- **Role**: PDF to image conversion for OCR processing
- **Use Cases**:
  - Scanned document processing
  - Visual element extraction
  - Page thumbnails generation

#### pdf-poppler
- **Role**: Server-side PDF manipulation and advanced extraction
- **Features**:
  - High-quality PDF parsing
  - Form field extraction
  - Advanced metadata handling
  - Multi-format conversion

#### Tesseract.js (OCR)
- **Role**: Optical character recognition for scanned documents
- **Features**:
  - Multi-language support
  - Table recognition
  - Layout preservation

## 🎨 PDF Creation & Generation Stack

### PDFKit
- **Role**: Programmatic PDF generation with full control
- **Features**:
  - Vector graphics and text rendering
  - Custom fonts and styling
  - Image embedding and manipulation
  - Form field creation

### jsPDF
- **Role**: Client-side PDF generation
- **Use Cases**:
  - Browser-based document creation
  - Quick report generation
  - Chart and graph export to PDF

### Puppeteer
- **Role**: HTML-to-PDF conversion for complex layouts
- **Features**:
  - High-fidelity HTML/CSS rendering
  - Dynamic content support
  - Chart and visualization export
  - Print-ready formatting

### React PDF
- **Role**: React-based PDF document creation
- **Features**:
  - Component-based PDF structure
  - Reusable document templates
  - Dynamic data binding
  - Responsive PDF layouts

### PDF-lib
- **Role**: PDF manipulation and form filling
- **Features**:
  - Modify existing PDFs
  - Fill interactive forms
  - Merge and split documents
  - Add signatures and annotations

### HummusJS
- **Role**: Advanced PDF editing and manipulation
- **Features**:
  - Text editing in existing PDFs
  - Page manipulation (crop, rotate, resize)
  - Advanced form field editing
  - Watermark and annotation support

### PDFtk Server
- **Role**: Server-side PDF operations
- **Features**:
  - PDF merging and splitting
  - Page extraction and rotation
  - Form field manipulation
  - Password protection and encryption

### Template Engine Stack

#### Handlebars.js
- **Role**: Template processing for document generation
- **Features**:
  - Variable substitution
  - Conditional content
  - Loop structures
  - Helper functions

#### Mustache.js
- **Role**: Logic-less templates for simple document generation
- **Features**:
  - Simple variable replacement
  - Lightweight processing
  - Cross-platform compatibility

## ✏️ PDF Editing & Organization Stack

### PDFAnnotate
- **Role**: PDF annotation and editing toolkit
- **Features**:
  - Text highlighting and annotations
  - Drawing tools and markup
  - Comment and review systems
  - Collaborative editing features

### PDF2JSON
- **Role**: PDF structure analysis for intelligent editing
- **Features**:
  - Extract PDF structure as JSON
  - Identify text blocks and formatting
  - Enable precise text editing
  - Preserve document layout

### Sharp
- **Role**: Image processing for PDF thumbnails and previews
- **Features**:
  - High-performance image processing
  - Format conversion and optimization
  - Thumbnail generation
  - Image annotation support

## ✍️ E-signature & Authentication Stack

### Adobe Acrobat Sign API
- **Role**: Enterprise e-signature solution with Adobe ecosystem integration
- **Features**:
  - Legal compliance (ESIGN, eIDAS, 21 CFR Part 11)
  - Multi-party signing workflows with advanced routing
  - Authentication and identity verification (Adobe ID, government ID)
  - Comprehensive audit trail and compliance reporting
  - Native PDF integration and advanced form handling
  - Global compliance (supports 44+ countries)

### Adobe PDF Services API
- **Role**: PDF manipulation and e-signature preparation
- **Features**:
  - PDF form field creation and management
  - Document conversion and optimization
  - Signature field positioning and customization
  - Document integrity and security features

### node-forge
- **Role**: Cryptographic operations for signatures
- **Features**:
  - Digital certificate handling
  - PKI infrastructure support
  - Encryption and decryption
  - Signature validation

## 📧 Email Integration Stack

### Gmail API
- **Role**: Gmail integration and email management
- **Features**:
  - Read and send emails
  - Attachment management
  - Label and thread management
  - Search and filtering

### Nodemailer
- **Role**: Email sending and SMTP integration
- **Features**:
  - Multi-transport support
  - HTML and plain text emails
  - Attachment handling
  - Email templating

### IMAP/POP3 Libraries
- **Role**: Universal email protocol support
- **Features**:
  - Multi-provider email access
  - Real-time email monitoring
  - Folder and message management
  - Offline email processing

## 🗄️ Backend & Database

### Supabase
- **Why**: Complete backend-as-a-service with real-time capabilities
- **Components**:
  - **PostgreSQL Database**: Document metadata, user data, agent states
  - **Supabase Storage**: PDF file storage with CDN
  - **Supabase Auth**: User authentication and authorization
  - **Real-time Subscriptions**: Live agent status updates
  - **Row Level Security**: Secure data access

#### Database Schema
```sql
-- Documents table (now handles both uploaded and created documents)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  document_type TEXT,
  source_type TEXT DEFAULT 'uploaded', -- 'uploaded' or 'created'
  template_id UUID REFERENCES document_templates(id),
  status TEXT DEFAULT 'processing',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Templates table
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  template_data JSONB NOT NULL,
  style_sheet JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Tasks table
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  agent_type TEXT NOT NULL,
  task_data JSONB,
  status TEXT DEFAULT 'pending',
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Usage tracking
CREATE TABLE template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES document_templates(id),
  user_id UUID REFERENCES auth.users(id),
  document_id UUID REFERENCES documents(id),
  usage_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Versions for editing history
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  version_number INTEGER NOT NULL,
  change_summary TEXT,
  file_path TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E-signature Sessions
CREATE TABLE signature_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  session_type TEXT DEFAULT 'single', -- 'single' or 'workflow'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
  signers JSONB NOT NULL,
  signing_order TEXT DEFAULT 'parallel', -- 'parallel', 'sequential'
  completion_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Integration
CREATE TABLE email_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email_id TEXT NOT NULL, -- Gmail message ID
  thread_id TEXT,
  sender_email TEXT NOT NULL,
  subject TEXT,
  extracted_context JSONB,
  sentiment_score DECIMAL(3,2),
  urgency_level TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Smart Suggestions  
CREATE TABLE smart_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  suggestion_type TEXT NOT NULL,
  suggestion_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2),
  user_feedback TEXT, -- 'accepted', 'rejected', 'modified'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🏗️ State Management

### Zustand
- **Why**: Simple, lightweight, and TypeScript-friendly
- **Stores**:
  - `useDocumentStore`: Document management and processing state
  - `useTemplateStore`: Template management and creation state
  - `useCreationStore`: PDF creation workflow state
  - `useAgentStore`: Agent status and task management
  - `useUIStore`: UI state and user preferences
  - `useAuthStore`: Authentication state

#### Example Store Structure
```typescript
interface DocumentStore {
  documents: Document[];
  currentDocument: Document | null;
  processingStatus: AgentStatus;
  addDocument: (doc: Document) => void;
  updateStatus: (id: string, status: ProcessingStatus) => void;
}

interface TemplateStore {
  templates: DocumentTemplate[];
  currentTemplate: DocumentTemplate | null;
  templateCategories: TemplateCategory[];
  createTemplate: (template: DocumentTemplate) => Promise<void>;
  updateTemplate: (id: string, updates: Partial<DocumentTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

interface CreationStore {
  activeCreation: CreationSession | null;
  creationHistory: CreationSession[];
  designElements: DesignElement[];
  startCreation: (template: DocumentTemplate) => void;
  updateDesign: (element: DesignElement) => void;
  generatePDF: () => Promise<PDFDocument>;
}

interface EditorStore {
  activeDocument: PDFDocument | null;
  editHistory: DocumentEdit[];
  versionHistory: DocumentVersion[];
  openEditor: (document: PDFDocument) => void;
  applyEdit: (edit: DocumentEdit) => void;
  saveVersion: (summary: string) => Promise<void>;
}

interface SignatureStore {
  activeSessions: SignatureSession[];
  completedSessions: SignatureSession[];
  signatureTemplates: SignatureTemplate[];
  initiateSession: (document: PDFDocument, signers: Signer[]) => Promise<void>;
  trackProgress: (sessionId: string) => SignatureProgress;
}

interface EmailStore {
  emailContexts: EmailContext[];
  draftResponses: EmailDraft[];
  attachmentQueue: DocumentAttachment[];
  connectGmail: () => Promise<void>;
  readEmails: (query: EmailQuery) => Promise<Email[]>;
  generateResponse: (context: EmailContext) => Promise<EmailDraft>;
  sendWithAttachments: (draft: EmailDraft, attachments: PDFDocument[]) => Promise<void>;
}

interface SuggestionStore {
  smartSuggestions: SmartSuggestion[];
  suggestionHistory: SuggestionHistory[];
  userPreferences: SuggestionPreferences;
  generateSuggestions: (document: PDFDocument) => Promise<SmartSuggestion[]>;
  acceptSuggestion: (suggestionId: string) => void;
  provideFeedback: (suggestionId: string, feedback: SuggestionFeedback) => void;
}
```

## 🌐 Deployment & Infrastructure

### Vercel
- **Why**: Seamless Next.js deployment, edge functions, global CDN
- **Features**:
  - Automatic deployments from Git
  - Edge Runtime for API routes
  - Environment variable management
  - Analytics and monitoring

### Environment Configuration
```env
# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# File Processing
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=pdf

# Agent Configuration
MAX_CONCURRENT_AGENTS=5
TASK_TIMEOUT=300000

# Gmail Integration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token

# Adobe Acrobat Sign Services
ADOBE_SIGN_CLIENT_ID=your_adobe_sign_client_id
ADOBE_SIGN_CLIENT_SECRET=your_adobe_sign_client_secret
ADOBE_SIGN_ACCESS_TOKEN=your_access_token
ADOBE_SIGN_BASE_URL=https://api.na1.adobesign.com/api/rest/v6
ADOBE_SIGN_WEBHOOK_URL=your_webhook_url

# PDF Processing
PDFTK_PATH=/usr/local/bin/pdftk
HUMMUS_TEMP_DIR=/tmp/pdf-processing

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

## 📦 Package Management

### Dependencies Structure
```json
{
  "dependencies": {
    "@adobe/react-spectrum": "^3.34.0",
    "@supabase/supabase-js": "^2.38.0",
    "next": "14.0.0",
    "react": "^18.2.0",
    "zustand": "^4.4.0",
    "langchain": "^0.0.190",
    
    // PDF Processing
    "pdf.js": "^4.0.0",
    "tesseract.js": "^4.1.0",
    "pdf2pic": "^2.1.4",
    
    // PDF Creation & Generation  
    "pdfkit": "^0.14.0",
    "jspdf": "^2.5.1",
    "puppeteer": "^21.5.2",
    "@react-pdf/renderer": "^3.1.12",
    "pdf-lib": "^1.17.1",
    
    // PDF Editing & Organization
    "hummusjs": "^1.0.111",
    "pdftk-server": "^1.0.0",
    "pdf2json": "^3.0.5",
    "pdf-annotate": "^1.0.0",
    "sharp": "^0.32.6",
    
    // E-signature (Adobe Acrobat Sign)
    "@adobe/acrobat-services-sdk": "^1.2.0",
    "adobe-sign-sdk": "^1.0.0", // Custom SDK wrapper
    "node-forge": "^1.3.1",
    "crypto-js": "^4.2.0",
    
    // Email Integration
    "googleapis": "^128.0.0", // Gmail API
    "nodemailer": "^6.9.7",
    "imap": "^0.8.19",
    
    // Template Processing
    "handlebars": "^4.7.8",
    "mustache": "^4.2.0",
    
    // Design & Layout
    "fabric": "^5.3.0",
    "konva": "^9.2.0",
    "react-konva": "^18.2.10"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/pdfkit": "^0.12.12",
    "@types/handlebars": "^4.1.0",
    "@types/nodemailer": "^6.4.14",
    "@types/node-forge": "^1.3.8",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0"
  }
}
```

## 🔧 Development Tools

### TypeScript
- **Configuration**: Strict mode enabled for better code quality
- **Features**: Full type safety across agents and PDF processing

### ESLint & Prettier
- **Code Quality**: Consistent formatting and error detection
- **React Spectrum**: Custom rules for accessibility compliance

### Husky & lint-staged
- **Git Hooks**: Pre-commit code quality checks
- **Automated**: Format and lint on commit

## 🚀 Performance Optimizations

### Next.js Optimizations
- **Image Optimization**: Automatic PDF thumbnail optimization
- **Bundle Splitting**: Code splitting for agent modules
- **Caching**: Aggressive caching for processed documents

### React Spectrum Performance
- **Virtualization**: Large document lists with virtual scrolling
- **Lazy Loading**: On-demand component loading
- **Memoization**: Expensive operations cached

### AI Performance
- **Streaming**: Real-time agent response streaming
- **Batching**: Multiple document processing optimization
- **Caching**: Intelligent prompt and result caching

## 📊 Monitoring & Analytics

### Vercel Analytics
- **Performance**: Core Web Vitals tracking
- **Usage**: Feature adoption metrics
- **Errors**: Real-time error monitoring

### Custom Analytics
- **Agent Performance**: Task completion rates and times
- **User Behavior**: Document processing patterns
- **System Health**: Resource usage and bottlenecks
