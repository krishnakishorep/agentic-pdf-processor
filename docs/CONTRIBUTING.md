# 🤝 Contributing to Agentic PDF Processor

Thank you for your interest in contributing to the Agentic PDF Processor! This document provides guidelines and information for contributors.

## 🌟 Ways to Contribute

### 🐛 Bug Reports
- Report bugs through GitHub issues
- Include detailed reproduction steps
- Provide system information and logs
- Attach sample documents when relevant (ensure no sensitive data)

### 💡 Feature Requests
- Propose new agent capabilities
- Suggest workflow improvements
- Request integration enhancements
- Share use case scenarios

### 📝 Documentation
- Improve existing documentation
- Add examples and tutorials
- Translate documentation
- Create video guides

### 💻 Code Contributions
- Fix bugs and issues
- Implement new features
- Improve performance
- Add test coverage

### 🧪 Testing & QA
- Test new features and releases
- Report usability issues
- Validate agent accuracy
- Performance testing

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

```bash
# Node.js (v18 or higher)
node --version

# npm (v9 or higher)
npm --version

# Git
git --version
```

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/agentic-pdf-processor.git
   cd agentic-pdf-processor
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Add your API keys and configuration
   # See TECH_STACK.md for required environment variables
   ```

4. **Set Up Database**
   ```bash
   # Initialize Supabase locally (optional for development)
   npx supabase init
   npx supabase start
   
   # Or connect to your Supabase instance
   # Update .env.local with your Supabase credentials
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Verify Setup**
   - Open http://localhost:3000
   - Upload a test PDF
   - Verify agents are working

---

## 📋 Development Workflow

### Branch Naming

Use descriptive branch names:

```bash
# Feature branches
git checkout -b feature/improve-data-extraction
git checkout -b feature/add-presentation-generation

# Bug fix branches  
git checkout -b fix/document-upload-timeout
git checkout -b fix/agent-memory-leak

# Documentation branches
git checkout -b docs/update-api-documentation
git checkout -b docs/add-user-examples
```

### Commit Messages

Follow conventional commit format:

```bash
# Features
feat(agents): add document comparison capability
feat(ui): implement drag-and-drop file upload

# Bug fixes
fix(extraction): handle empty PDF pages correctly
fix(api): resolve timeout issues for large documents

# Documentation
docs(readme): update installation instructions
docs(api): add webhook documentation

# Tests
test(agents): add unit tests for content generation
test(e2e): add document processing workflow tests

# Refactoring
refactor(agents): extract common agent functionality
refactor(ui): simplify component structure

# Performance
perf(processing): optimize PDF parsing pipeline
perf(ui): improve large document list rendering
```

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

### Testing

Run tests before submitting pull requests:

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

---

## 🤖 Agent Development Guidelines

### Creating New Agents

When developing new agents, follow this structure:

```typescript
// packages/agents/src/MyNewAgent.ts
import { BaseAgent } from './base/BaseAgent';

export class MyNewAgent extends BaseAgent {
  constructor() {
    super({
      name: 'MyNewAgent',
      version: '1.0.0',
      capabilities: ['capability1', 'capability2'],
      dependencies: ['DocumentAnalysisAgent']
    });
  }

  async processDocument(
    document: ProcessedDocument,
    options?: ProcessingOptions
  ): Promise<AgentResult> {
    try {
      // Validate inputs
      this.validateInput(document, options);

      // Process document
      const result = await this.performProcessing(document, options);

      // Validate outputs
      this.validateOutput(result);

      return {
        success: true,
        data: result,
        confidence: this.calculateConfidence(result),
        metadata: this.generateMetadata()
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error),
        metadata: this.generateErrorMetadata(error)
      };
    }
  }

  private async performProcessing(
    document: ProcessedDocument,
    options?: ProcessingOptions
  ): Promise<any> {
    // Implement your agent logic here
    // Use AI models, process data, generate content, etc.
  }
}
```

### Agent Best Practices

**🎯 Single Responsibility**
- Each agent should have a clear, focused purpose
- Avoid overlapping functionality between agents
- Keep agents modular and reusable

**⚡ Performance**
- Implement proper caching mechanisms
- Handle large documents efficiently
- Use streaming for real-time updates

**🔒 Error Handling**
- Graceful degradation on failures
- Detailed error logging and reporting
- Fallback strategies for critical functionality

**📊 Monitoring**
- Track performance metrics
- Log processing steps for debugging
- Provide confidence scores for results

### AI Model Integration

When integrating AI models:

```typescript
// Example OpenAI integration
import OpenAI from 'openai';

export class ContentGenerationAgent extends BaseAgent {
  private openai: OpenAI;

  constructor() {
    super({ name: 'ContentGenerationAgent' });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateSummary(content: string): Promise<Summary> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert document summarizer...'
          },
          {
            role: 'user',
            content: content
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return this.parseSummaryResponse(response.choices[0].message.content);
    } catch (error) {
      throw new AgentError('Failed to generate summary', error);
    }
  }
}
```

---

## 🎨 UI Development Guidelines

### React Spectrum Components

Use Adobe React Spectrum consistently:

```tsx
// Good: Use React Spectrum components
import { Button, View, Heading } from '@adobe/react-spectrum';

export function DocumentCard({ document }: { document: Document }) {
  return (
    <View borderWidth="thin" borderColor="dark" borderRadius="medium" padding="size-200">
      <Heading level={3}>{document.filename}</Heading>
      <Button variant="cta" onPress={() => processDocument(document)}>
        Process Document
      </Button>
    </View>
  );
}

// Bad: Don't use custom styling that conflicts with Spectrum
const CustomButton = styled.button`
  // Avoid custom styling that breaks design system consistency
`;
```

### Accessibility

Ensure all UI components are accessible:

```tsx
// Good: Proper accessibility attributes
<Button 
  onPress={handleUpload}
  aria-label="Upload PDF document"
  isDisabled={isUploading}
>
  {isUploading ? 'Uploading...' : 'Upload Document'}
</Button>

// Good: Semantic HTML structure
<View role="main">
  <Heading level={1}>Document Analysis Results</Heading>
  <View role="region" aria-labelledby="extraction-results">
    <Heading level={2} id="extraction-results">Extracted Data</Heading>
    {/* Content */}
  </View>
</View>
```

### Real-time Updates

Implement real-time features properly:

```tsx
// Good: Proper WebSocket handling
import { useWebSocket } from '../hooks/useWebSocket';

export function AgentStatus({ taskId }: { taskId: string }) {
  const { subscribe, unsubscribe } = useWebSocket();
  const [status, setStatus] = useState<AgentTaskStatus>();

  useEffect(() => {
    const handleUpdate = (message: WebSocketMessage) => {
      if (message.type === 'agent-progress' && message.taskId === taskId) {
        setStatus(message.status);
      }
    };

    subscribe(handleUpdate);
    return () => unsubscribe(handleUpdate);
  }, [taskId, subscribe, unsubscribe]);

  return (
    <View>
      <ProgressBar 
        value={status?.progress || 0}
        label={status?.currentStep || 'Initializing...'}
      />
    </View>
  );
}
```

---

## 📊 Database Guidelines

### Schema Changes

When modifying the database schema:

1. **Create Migration Scripts**
   ```sql
   -- migrations/001_add_agent_performance_table.sql
   CREATE TABLE agent_performance (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     agent_type TEXT NOT NULL,
     task_type TEXT NOT NULL,
     performance_metrics JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   CREATE INDEX idx_agent_performance_type ON agent_performance(agent_type, task_type);
   ```

2. **Update TypeScript Types**
   ```typescript
   // packages/database/src/types.ts
   export interface AgentPerformance {
     id: string;
     agentType: AgentType;
     taskType: string;
     performanceMetrics: PerformanceMetrics;
     createdAt: Date;
   }
   ```

3. **Add Database Helpers**
   ```typescript
   // packages/database/src/queries/agentPerformance.ts
   export async function createPerformanceRecord(
     record: Omit<AgentPerformance, 'id' | 'createdAt'>
   ): Promise<AgentPerformance> {
     const { data, error } = await supabase
       .from('agent_performance')
       .insert(record)
       .select()
       .single();
   
     if (error) throw error;
     return data;
   }
   ```

### Data Privacy

Always consider data privacy:

```typescript
// Good: Implement proper data filtering
export async function getUserDocuments(userId: string, options?: QueryOptions) {
  return supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId) // Always filter by user
    .range(options?.offset || 0, options?.limit || 50);
}

// Bad: Don't expose all user data
export async function getAllDocuments() {
  return supabase.from('documents').select('*'); // Security risk!
}
```

---

## 🧪 Testing Guidelines

### Unit Tests

Write comprehensive unit tests:

```typescript
// packages/agents/src/__tests__/DocumentAnalysisAgent.test.ts
import { DocumentAnalysisAgent } from '../DocumentAnalysisAgent';

describe('DocumentAnalysisAgent', () => {
  let agent: DocumentAnalysisAgent;

  beforeEach(() => {
    agent = new DocumentAnalysisAgent();
  });

  describe('analyzeDocument', () => {
    it('should classify contract documents correctly', async () => {
      const mockDocument = {
        textContent: 'This Agreement is entered into...',
        metadata: { pageCount: 5 }
      };

      const result = await agent.analyzeDocument(mockDocument);

      expect(result.documentType).toBe('contract');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle empty documents gracefully', async () => {
      const mockDocument = {
        textContent: '',
        metadata: { pageCount: 0 }
      };

      const result = await agent.analyzeDocument(mockDocument);

      expect(result.documentType).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });
});
```

### Integration Tests

Test agent coordination:

```typescript
// packages/agents/src/__tests__/AgentOrchestrator.integration.test.ts
import { AgentOrchestrator } from '../AgentOrchestrator';

describe('AgentOrchestrator Integration', () => {
  it('should coordinate document processing workflow', async () => {
    const orchestrator = new AgentOrchestrator();
    const mockDocument = createMockDocument();

    const result = await orchestrator.processDocument(mockDocument, {
      workflow: 'contract-analysis'
    });

    expect(result.analysis).toBeDefined();
    expect(result.extractedData).toBeDefined();
    expect(result.generatedContent).toBeDefined();
  });
});
```

### E2E Tests

Test complete user workflows:

```typescript
// tests/e2e/document-processing.spec.ts
import { test, expect } from '@playwright/test';

test('complete document processing workflow', async ({ page }) => {
  await page.goto('/');

  // Upload document
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-files/sample-contract.pdf');

  // Wait for analysis
  await expect(page.locator('[data-testid="analysis-complete"]')).toBeVisible();

  // Verify extracted data
  await expect(page.locator('[data-testid="extracted-parties"]')).toContainText('John Smith');

  // Generate summary
  await page.click('[data-testid="generate-summary"]');
  await expect(page.locator('[data-testid="summary-content"]')).toBeVisible();
});
```

---

## 📚 Documentation Standards

### Code Documentation

Use JSDoc for functions and classes:

```typescript
/**
 * Extracts structured data from a processed document
 * @param document - The document to extract data from
 * @param options - Extraction options and preferences
 * @returns Promise resolving to extracted structured data
 * @throws {AgentError} When document processing fails
 * @example
 * ```typescript
 * const extractor = new DataExtractionAgent();
 * const data = await extractor.extractData(document, {
 *   includeConfidence: true,
 *   validateResults: true
 * });
 * ```
 */
async extractStructuredData(
  document: ProcessedDocument,
  options?: ExtractionOptions
): Promise<StructuredData> {
  // Implementation
}
```

### API Documentation

Document all endpoints thoroughly:

```typescript
/**
 * @swagger
 * /api/documents/{id}/analyze:
 *   post:
 *     summary: Analyze a document with specified agents
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agents:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["document-analysis", "data-extraction"]
 */
```

---

## 🚀 Pull Request Process

### Before Submitting

1. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```

2. **Update Documentation**
   - Update relevant documentation files
   - Add JSDoc comments to new functions
   - Update API documentation if needed

3. **Write Descriptive Commit Messages**
   ```bash
   git commit -m "feat(agents): add document comparison capability

   - Implement side-by-side document comparison
   - Add confidence scoring for similarity metrics  
   - Update API endpoints for comparison requests
   - Add unit tests for comparison logic

   Closes #123"
   ```

### Pull Request Template

Use this template for pull requests:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Changes Made
- Specific change 1
- Specific change 2
- Specific change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Documentation
- [ ] Code comments updated
- [ ] API documentation updated
- [ ] User guide updated
- [ ] Architecture docs updated

## Screenshots (if applicable)
Include screenshots for UI changes.

## Related Issues
Closes #123
Relates to #456
```

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Verify functionality works as expected
4. **Documentation**: Ensure documentation is updated
5. **Approval**: Maintainer approval before merge

---

## 🏆 Recognition

### Contributor Levels

**🌟 Contributor**
- First contribution merged
- Listed in contributors list

**🚀 Active Contributor** 
- 5+ meaningful contributions
- Helps with code reviews
- Repository collaborator access

**🎯 Core Maintainer**
- 20+ contributions
- Maintains specific areas
- Merge permissions

### Hall of Fame

Outstanding contributors are recognized in:
- README.md contributors section
- Annual contributor spotlight
- Conference presentation credits
- Swag and rewards program

---

## 📞 Getting Help

### Community Support

- **Discord**: Join our development community
- **GitHub Discussions**: Ask questions and share ideas
- **Office Hours**: Weekly developer meetups

### Mentorship Program

New contributors can request mentorship:
- Pair programming sessions
- Code review guidance
- Architecture discussions
- Career development advice

---

## 📝 License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to the Agentic PDF Processor! Your help makes this project better for everyone. 🎉
