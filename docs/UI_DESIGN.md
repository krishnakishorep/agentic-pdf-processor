# 🎨 UI Design System & Mockups

## 🌟 Overview

This document presents the complete UI design for the **Agentic PDF Processor** using **Adobe React Spectrum** components. The design emphasizes clean, modern aesthetics with intelligent workflow visualization and seamless agent interaction.

---

## 🎨 Design System Foundation

### **Color Palette**
```typescript
// Primary Colors (Adobe Spectrum Blue)
const colors = {
  primary: {
    50: '#E1F5FE',
    100: '#B3E5FC', 
    200: '#81D4FA',
    500: '#2196F3',   // Primary brand
    700: '#1976D2',   // Primary dark
    900: '#0D47A1'    // Primary darker
  },
  
  // Agent Colors
  agents: {
    content: '#9C27B0',      // Purple - Content Agent
    pdfEditor: '#FF9800',    // Orange - PDF Editor
    gmail: '#4CAF50',        // Green - Gmail Agent
    signature: '#F44336',    // Red - E-signature
    intelligence: '#3F51B5'  // Indigo - Intelligence Agent
  },
  
  // Status Colors
  status: {
    success: '#4CAF50',
    warning: '#FF9800', 
    error: '#F44336',
    info: '#2196F3',
    neutral: '#9E9E9E'
  }
}
```

### **Typography Scale**
```typescript
// React Spectrum Typography
const typography = {
  heading1: { size: 'XXXL', weight: 'bold' },    // 36px
  heading2: { size: 'XXL', weight: 'bold' },     // 28px 
  heading3: { size: 'XL', weight: 'medium' },    // 24px
  heading4: { size: 'L', weight: 'medium' },     // 20px
  body: { size: 'M', weight: 'normal' },         // 16px
  caption: { size: 'S', weight: 'normal' },      // 14px
  code: { family: 'mono', size: 'M' }            // Monospace
}
```

### **Spacing System**
```typescript
// Adobe Spectrum Spacing
const spacing = {
  xs: 'size-50',    // 4px
  sm: 'size-100',   // 8px 
  md: 'size-200',   // 16px
  lg: 'size-300',   // 24px
  xl: 'size-400',   // 32px
  xxl: 'size-500'   // 40px
}
```

---

## 🏠 Main Dashboard Layout

### **Desktop Layout (1440px+)**
```typescript
// Main Application Shell
<Provider theme={defaultTheme} colorScheme="light">
  <View backgroundColor="gray-75" minHeight="100vh">
    
    {/* Top Navigation Bar */}
    <View backgroundColor="gray-50" borderBottomWidth="thin" borderBottomColor="gray-300">
      <Flex 
        alignItems="center" 
        justifyContent="space-between" 
        paddingX="size-400" 
        paddingY="size-200"
        maxWidth="size-7200"
        marginX="auto"
      >
        {/* Logo & Brand */}
        <Flex alignItems="center" gap="size-200">
          <Image src="/logo.svg" alt="Logo" width="40" height="40" />
          <Heading level={2} margin={0}>
            <Text color="blue-700">Agentic</Text>
            <Text color="gray-800">PDF</Text>
          </Heading>
        </Flex>
        
        {/* Navigation */}
        <TabList selectedKey="dashboard">
          <Item key="dashboard">
            <Icon>🏠</Icon>
            <Text>Dashboard</Text>
          </Item>
          <Item key="documents">
            <Icon>📄</Icon>
            <Text>Documents</Text>
          </Item>
          <Item key="agents">
            <Icon>🤖</Icon>
            <Text>Agents</Text>
          </Item>
          <Item key="templates">
            <Icon>📋</Icon>
            <Text>Templates</Text>
          </Item>
        </TabList>
        
        {/* User Actions */}
        <Flex alignItems="center" gap="size-200">
          <ActionButton isQuiet aria-label="Notifications">
            <Icon>🔔</Icon>
            <Badge variant="positive">3</Badge>
          </ActionButton>
          
          <ActionButton isQuiet aria-label="Settings">
            <Icon>⚙️</Icon>
          </ActionButton>
          
          <MenuTrigger>
            <ActionButton isQuiet>
              <Avatar src="/user-avatar.jpg" alt="User" />
              <Text>John Smith</Text>
            </ActionButton>
            <Menu>
              <Item key="profile">Profile</Item>
              <Item key="preferences">Preferences</Item>
              <Item key="logout">Sign Out</Item>
            </Menu>
          </MenuTrigger>
        </Flex>
      </Flex>
    </View>
    
    {/* Main Content Area */}
    <View paddingX="size-400" paddingY="size-300" maxWidth="size-7200" marginX="auto">
      <Grid areas={["sidebar content"]} columns={["300px", "1fr"]} gap="size-400">
        
        {/* Left Sidebar - Agent Status */}
        <GridArea gridArea="sidebar">
          <AgentStatusSidebar />
        </GridArea>
        
        {/* Main Content */}
        <GridArea gridArea="content">
          <MainDashboardContent />
        </GridArea>
        
      </Grid>
    </View>
  </View>
</Provider>
```

### **Agent Status Sidebar**
```typescript
const AgentStatusSidebar = () => (
  <View backgroundColor="white" borderRadius="medium" padding="size-300">
    <Flex direction="column" gap="size-300">
      
      {/* Header */}
      <Flex alignItems="center" justifyContent="space-between">
        <Heading level={4}>🤖 AI Agents</Heading>
        <ActionButton size="S" isQuiet>
          <Icon>⚙️</Icon>
        </ActionButton>
      </Flex>
      
      <Divider />
      
      {/* Agent List */}
      <Flex direction="column" gap="size-200">
        
        {/* Content Agent */}
        <View backgroundColor="purple-100" borderRadius="medium" padding="size-200">
          <Flex alignItems="center" gap="size-150">
            <StatusLight variant="positive" />
            <View flex="1">
              <Text weight="bold">🎨 Content Agent</Text>
              <Text color="gray-700" fontSize="small">Ready for creation</Text>
            </View>
            <Badge variant="positive">Active</Badge>
          </Flex>
          
          <ProgressBar 
            label="Current Task" 
            value={0} 
            marginTop="size-100" 
            size="S" 
          />
        </View>
        
        {/* PDF Editor Agent */}
        <View backgroundColor="orange-100" borderRadius="medium" padding="size-200">
          <Flex alignItems="center" gap="size-150">
            <StatusLight variant="notice" />
            <View flex="1">
              <Text weight="bold">✏️ PDF Editor</Text>
              <Text color="gray-700" fontSize="small">Processing contract.pdf</Text>
            </View>
            <Badge variant="notice">Busy</Badge>
          </Flex>
          
          <ProgressBar 
            label="Editing Progress" 
            value={67} 
            marginTop="size-100" 
            size="S" 
          />
        </View>
        
        {/* Gmail Agent */}
        <View backgroundColor="green-100" borderRadius="medium" padding="size-200">
          <Flex alignItems="center" gap="size-150">
            <StatusLight variant="positive" />
            <View flex="1">
              <Text weight="bold">📧 Gmail Agent</Text>
              <Text color="gray-700" fontSize="small">Monitoring inbox</Text>
            </View>
            <Badge variant="positive">Active</Badge>
          </Flex>
          
          <Flex alignItems="center" gap="size-150" marginTop="size-100">
            <Text fontSize="small">Unread: </Text>
            <Badge variant="informative">5</Badge>
          </Flex>
        </View>
        
        {/* E-signature Agent */}
        <View backgroundColor="red-100" borderRadius="medium" padding="size-200">
          <Flex alignItems="center" gap="size-150">
            <StatusLight variant="neutral" />
            <View flex="1">
              <Text weight="bold">✍️ E-signature</Text>
              <Text color="gray-700" fontSize="small">Idle</Text>
            </View>
            <Badge variant="neutral">Standby</Badge>
          </Flex>
        </View>
        
        {/* Intelligence Agent */}
        <View backgroundColor="indigo-100" borderRadius="medium" padding="size-200">
          <Flex alignItems="center" gap="size-150">
            <StatusLight variant="positive" />
            <View flex="1">
              <Text weight="bold">🧠 Intelligence</Text>
              <Text color="gray-700" fontSize="small">Analyzing patterns</Text>
            </View>
            <Badge variant="positive">Active</Badge>
          </Flex>
        </View>
      </Flex>
      
      {/* Quick Actions */}
      <Divider />
      <ActionGroup orientation="vertical" isQuiet>
        <Item key="create">🆕 Create Document</Item>
        <Item key="upload">📤 Upload PDF</Item>
        <Item key="connect">📧 Connect Gmail</Item>
      </ActionGroup>
      
    </Flex>
  </View>
)
```

---

## 📊 Main Dashboard Content

### **Quick Actions Hero Section**
```typescript
const MainDashboardContent = () => (
  <Flex direction="column" gap="size-400">
    
    {/* Hero Section */}
    <View 
      backgroundColor="blue-600" 
      borderRadius="large"
      padding="size-500"
      UNSAFE_style={{
        background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)'
      }}
    >
      <Flex direction="column" gap="size-300" alignItems="center">
        <Heading level={1} color="white" textAlign="center">
          What would you like to create today?
        </Heading>
        
        <Text color="blue-100" fontSize="large" textAlign="center">
          Your AI agents are ready to help with documents, emails, and signatures
        </Text>
        
        {/* Quick Action Cards */}
        <Grid columns="repeat(4, 1fr)" gap="size-300" marginTop="size-400" width="100%">
          
          <ActionCard
            icon="🎨"
            title="Create Document"
            description="AI-powered content creation"
            color="purple"
            onClick={() => setActiveModal('create')}
          />
          
          <ActionCard
            icon="✏️"
            title="Edit PDF"
            description="Smart document editing"
            color="orange"
            onClick={() => setActiveModal('edit')}
          />
          
          <ActionCard
            icon="📧"
            title="Process Emails"
            description="Gmail integration & responses"
            color="green"
            onClick={() => setActiveModal('email')}
          />
          
          <ActionCard
            icon="✍️"
            title="Get Signatures"
            description="Adobe Acrobat Sign workflow"
            color="red"
            onClick={() => setActiveModal('sign')}
          />
          
        </Grid>
      </Flex>
    </View>
    
    {/* Recent Activity */}
    <RecentActivitySection />
    
    {/* Analytics Dashboard */}
    <AnalyticsDashboard />
    
  </Flex>
)

const ActionCard = ({ icon, title, description, color, onClick }) => (
  <Pressable onPress={onClick}>
    <View 
      backgroundColor="white"
      borderRadius="medium"
      padding="size-300"
      UNSAFE_style={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
        }
      }}
    >
      <Flex direction="column" alignItems="center" gap="size-200">
        <View 
          backgroundColor={`${color}-100`}
          borderRadius="full"
          padding="size-300"
        >
          <Text fontSize="XXL">{icon}</Text>
        </View>
        
        <Heading level={4} textAlign="center">{title}</Heading>
        <Text color="gray-600" fontSize="small" textAlign="center">
          {description}
        </Text>
      </Flex>
    </View>
  </Pressable>
)
```

### **Recent Activity Section**
```typescript
const RecentActivitySection = () => (
  <View backgroundColor="white" borderRadius="medium" padding="size-400">
    <Flex direction="column" gap="size-300">
      
      <Flex alignItems="center" justifyContent="space-between">
        <Heading level={3}>📈 Recent Activity</Heading>
        <ActionButton size="S" isQuiet>
          <Text>View All</Text>
          <Icon>→</Icon>
        </ActionButton>
      </Flex>
      
      <Divider />
      
      {/* Activity Timeline */}
      <Flex direction="column" gap="size-200">
        
        <ActivityItem
          icon="🎨"
          title="Marketing Proposal Created"
          description="AI generated 8-page proposal for TechCorp client"
          timestamp="5 minutes ago"
          status="completed"
          color="purple"
        />
        
        <ActivityItem
          icon="✏️"
          title="Contract Amendment Processed"
          description="Updated payment terms from NET 30 to NET 45"
          timestamp="12 minutes ago"
          status="completed"
          color="orange"
        />
        
        <ActivityItem
          icon="📧"
          title="Email Response Generated"
          description="Replied to john.smith@techcorp.com with attachments"
          timestamp="23 minutes ago"
          status="completed"
          color="green"
        />
        
        <ActivityItem
          icon="✍️"
          title="Signature Request Sent"
          description="Adobe Sign workflow initiated for Service Agreement"
          timestamp="1 hour ago"
          status="pending"
          color="red"
        />
        
      </Flex>
    </Flex>
  </View>
)

const ActivityItem = ({ icon, title, description, timestamp, status, color }) => (
  <Flex alignItems="center" gap="size-200">
    <View 
      backgroundColor={`${color}-100`}
      borderRadius="medium"
      padding="size-150"
      minWidth="size-500"
      UNSAFE_style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Text>{icon}</Text>
    </View>
    
    <View flex="1">
      <Text weight="bold">{title}</Text>
      <Text color="gray-700" fontSize="small">{description}</Text>
    </View>
    
    <View UNSAFE_style={{ textAlign: 'right' }}>
      <Badge variant={status === 'completed' ? 'positive' : 'notice'}>
        {status === 'completed' ? '✅ Done' : '⏳ Pending'}
      </Badge>
      <Text color="gray-600" fontSize="small" marginTop="size-50">
        {timestamp}
      </Text>
    </View>
  </Flex>
)
```

---

## 🎨 Content Creation Interface

### **Document Creation Modal**
```typescript
const DocumentCreationModal = ({ isOpen, onClose }) => (
  <Dialog size="L" isOpen={isOpen} onDismiss={onClose}>
    <Heading slot="title">
      🎨 Create New Document
    </Heading>
    
    <Content>
      <Flex direction="column" gap="size-400">
        
        {/* Document Type Selection */}
        <View>
          <Heading level={4} marginBottom="size-200">Choose Document Type</Heading>
          <Grid columns="repeat(3, 1fr)" gap="size-200">
            
            <DocumentTypeCard
              icon="📄"
              title="Business Contract"
              description="Service agreements, NDAs, partnerships"
              selected={docType === 'contract'}
              onClick={() => setDocType('contract')}
            />
            
            <DocumentTypeCard
              icon="📊"
              title="Marketing Proposal"
              description="Sales proposals, marketing plans"
              selected={docType === 'proposal'}
              onClick={() => setDocType('proposal')}
            />
            
            <DocumentTypeCard
              icon="📋"
              title="Technical Report"
              description="Analysis reports, documentation"
              selected={docType === 'report'}
              onClick={() => setDocType('report')}
            />
            
          </Grid>
        </View>
        
        {/* Content Input */}
        <View>
          <TextArea
            label="Describe what you want to create"
            description="Be as detailed as possible for better AI generation"
            placeholder="I need a marketing proposal for a new SaaS product targeting small businesses in the retail sector. The proposal should highlight cost savings, ROI, and implementation timeline..."
            necessityIndicator="label"
            rows={4}
            value={contentDescription}
            onChange={setContentDescription}
          />
        </View>
        
        {/* AI Configuration */}
        <View backgroundColor="purple-100" borderRadius="medium" padding="size-300">
          <Heading level={5} marginBottom="size-200">🤖 AI Configuration</Heading>
          
          <Grid columns="repeat(2, 1fr)" gap="size-200">
            <ComboBox 
              label="Writing Tone"
              selectedKey={tone}
              onSelectionChange={setTone}
            >
              <Item key="professional">Professional & Formal</Item>
              <Item key="persuasive">Persuasive & Compelling</Item>
              <Item key="technical">Technical & Detailed</Item>
              <Item key="friendly">Friendly & Approachable</Item>
            </ComboBox>
            
            <ComboBox 
              label="Target Audience"
              selectedKey={audience}
              onSelectionChange={setAudience}
            >
              <Item key="executives">C-Suite Executives</Item>
              <Item key="technical">Technical Decision Makers</Item>
              <Item key="financial">Financial Stakeholders</Item>
              <Item key="general">General Business Audience</Item>
            </ComboBox>
          </Grid>
          
          <Slider
            label="Content Length"
            value={contentLength}
            onChange={setContentLength}
            minValue={1}
            maxValue={20}
            step={1}
            formatOptions={{
              style: 'unit',
              unit: 'page',
              unitDisplay: 'long'
            }}
            marginTop="size-200"
          />
        </View>
        
        {/* Live Preview */}
        {contentDescription && (
          <View backgroundColor="blue-100" borderRadius="medium" padding="size-300">
            <Flex alignItems="center" gap="size-150" marginBottom="size-200">
              <ProgressCircle size="S" isIndeterminate />
              <Text weight="bold">🧠 AI Analysis Preview</Text>
            </Flex>
            
            <Text fontSize="small" color="gray-700">
              <strong>Detected Intent:</strong> {detectedIntent}<br/>
              <strong>Suggested Structure:</strong> {suggestedStructure}<br/>
              <strong>Estimated Generation Time:</strong> {estimatedTime}
            </Text>
          </View>
        )}
        
      </Flex>
    </Content>
    
    <ButtonGroup slot="buttonGroup">
      <Button variant="secondary" onPress={onClose}>
        Cancel
      </Button>
      <Button 
        variant="cta" 
        onPress={startGeneration}
        isDisabled={!contentDescription || !docType}
      >
        🚀 Start Creation
      </Button>
    </ButtonGroup>
  </Dialog>
)

const DocumentTypeCard = ({ icon, title, description, selected, onClick }) => (
  <Pressable onPress={onClick}>
    <View 
      backgroundColor={selected ? 'blue-100' : 'white'}
      borderColor={selected ? 'blue-500' : 'gray-300'}
      borderWidth="thin"
      borderRadius="medium"
      padding="size-300"
      UNSAFE_style={{
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
    >
      <Flex direction="column" alignItems="center" gap="size-150">
        <Text fontSize="XL">{icon}</Text>
        <Text weight="bold" textAlign="center">{title}</Text>
        <Text fontSize="small" color="gray-600" textAlign="center">
          {description}
        </Text>
      </Flex>
    </View>
  </Pressable>
)
```

---

## ✏️ PDF Editor Interface

### **PDF Editor Layout**
```typescript
const PDFEditorInterface = () => (
  <View height="100vh" backgroundColor="gray-100">
    <Flex direction="column" height="100%">
      
      {/* Editor Toolbar */}
      <View backgroundColor="gray-200" borderBottomWidth="thin" borderBottomColor="gray-300">
        <Flex 
          alignItems="center" 
          justifyContent="space-between" 
          paddingX="size-300" 
          paddingY="size-200"
        >
          <Flex alignItems="center" gap="size-300">
            <Text weight="bold">contract_amendment.pdf</Text>
            <Badge variant="positive">✅ Auto-saved</Badge>
          </Flex>
          
          <ActionGroup>
            <Item key="undo">↶ Undo</Item>
            <Item key="redo">↷ Redo</Item>
            <Item key="zoom-out">🔍-</Item>
            <Item key="zoom-in">🔍+</Item>
            <Item key="fit">📄 Fit</Item>
          </ActionGroup>
          
          <ButtonGroup>
            <Button variant="secondary">Preview</Button>
            <Button variant="cta">Save & Export</Button>
          </ButtonGroup>
        </Flex>
      </View>
      
      {/* Main Editor */}
      <Flex direction="row" flex="1">
        
        {/* PDF Viewer */}
        <View flex="3" backgroundColor="gray-300" position="relative">
          <PDFCanvas />
          <EditingOverlay />
        </View>
        
        {/* Editing Panel */}
        <View width="350px" backgroundColor="white" borderLeftWidth="thin" borderLeftColor="gray-300">
          <PDFEditingPanel />
        </View>
        
      </Flex>
    </Flex>
  </View>
)

const PDFEditingPanel = () => (
  <Flex direction="column" height="100%">
    
    {/* Panel Header */}
    <View backgroundColor="gray-100" padding="size-200">
      <Heading level={4}>✏️ Editing Tools</Heading>
    </View>
    
    <Flex direction="column" flex="1" padding="size-300" gap="size-300">
      
      {/* AI Suggestions */}
      <View backgroundColor="purple-100" borderRadius="medium" padding="size-200">
        <Flex alignItems="center" gap="size-150" marginBottom="size-200">
          <Icon>🧠</Icon>
          <Text weight="bold">Smart Suggestions</Text>
        </Flex>
        
        <ListView selectionMode="multiple" height="size-1200">
          <Item>
            <Flex direction="column" gap="size-50">
              <Text weight="bold" fontSize="small">Update Payment Terms</Text>
              <Text fontSize="small" color="gray-700">Page 3: Change "NET 30" to "NET 45"</Text>
              <Button size="S" variant="secondary">Apply</Button>
            </Flex>
          </Item>
          
          <Item>
            <Flex direction="column" gap="size-50">
              <Text weight="bold" fontSize="small">Add Signature Field</Text>
              <Text fontSize="small" color="gray-700">Page 8: Missing client signature</Text>
              <Button size="S" variant="secondary">Apply</Button>
            </Flex>
          </Item>
        </ListView>
      </View>
      
      {/* Editing Tools */}
      <Tabs>
        <TabList>
          <Item key="text">Text</Item>
          <Item key="annotations">Notes</Item>
          <Item key="forms">Forms</Item>
          <Item key="pages">Pages</Item>
        </TabList>
        
        <TabPanels>
          <Item key="text">
            <TextEditingTools />
          </Item>
          <Item key="annotations">
            <AnnotationTools />
          </Item>
          <Item key="forms">
            <FormTools />
          </Item>
          <Item key="pages">
            <PageTools />
          </Item>
        </TabPanels>
      </Tabs>
      
      {/* Version History */}
      <View backgroundColor="gray-100" borderRadius="medium" padding="size-200" marginTop="auto">
        <Heading level={5} marginBottom="size-150">📚 Version History</Heading>
        
        <ListView height="size-800">
          <Item>
            <Flex alignItems="center" gap="size-150">
              <StatusLight variant="positive" />
              <View flex="1">
                <Text weight="bold" fontSize="small">Current</Text>
                <Text fontSize="small" color="gray-600">Payment terms updated</Text>
              </View>
            </Flex>
          </Item>
          
          <Item>
            <Flex alignItems="center" gap="size-150">
              <StatusLight variant="neutral" />
              <View flex="1">
                <Text fontSize="small">Version 1.2</Text>
                <Text fontSize="small" color="gray-600">2 min ago</Text>
              </View>
            </Flex>
          </Item>
        </ListView>
      </View>
      
    </Flex>
  </Flex>
)
```

---

## 📧 Gmail Integration Interface

### **Email Dashboard**
```typescript
const EmailDashboard = () => (
  <View>
    <Flex direction="column" gap="size-400">
      
      {/* Gmail Connection Status */}
      <View backgroundColor="green-100" borderRadius="medium" padding="size-300">
        <Flex alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" gap="size-200">
            <StatusLight variant="positive" />
            <View>
              <Text weight="bold">📧 Gmail Connected</Text>
              <Text fontSize="small" color="gray-700">john.smith@company.com</Text>
            </View>
          </Flex>
          
          <Flex alignItems="center" gap="size-300">
            <View UNSAFE_style={{ textAlign: 'center' }}>
              <Text weight="bold" color="blue-600">23</Text>
              <Text fontSize="small">Unread</Text>
            </View>
            <View UNSAFE_style={{ textAlign: 'center' }}>
              <Text weight="bold" color="green-600">8</Text>
              <Text fontSize="small">Processed</Text>
            </View>
            <View UNSAFE_style={{ textAlign: 'center' }}>
              <Text weight="bold" color="purple-600">5</Text>
              <Text fontSize="small">Responses</Text>
            </View>
          </Flex>
          
          <Button variant="secondary" size="S">
            🔄 Refresh
          </Button>
        </Flex>
      </View>
      
      {/* Email Processing Interface */}
      <Grid columns="repeat(2, 1fr)" gap="size-400">
        
        {/* Email List */}
        <View backgroundColor="white" borderRadius="medium" padding="size-300">
          <Heading level={4} marginBottom="size-200">📨 Incoming Emails</Heading>
          
          <ListView 
            selectionMode="single" 
            selectedKeys={[selectedEmail]}
            onSelectionChange={setSelectedEmail}
            height="size-4600"
          >
            {emailList.map(email => (
              <Item key={email.id}>
                <EmailListItem email={email} />
              </Item>
            ))}
          </ListView>
        </View>
        
        {/* Email Analysis */}
        <View backgroundColor="white" borderRadius="medium" padding="size-300">
          <EmailAnalysisPanel selectedEmail={selectedEmailData} />
        </View>
        
      </Grid>
      
      {/* Response Generation */}
      {showResponseGenerator && (
        <ResponseGeneratorInterface />
      )}
      
    </Flex>
  </View>
)

const EmailListItem = ({ email }) => (
  <Flex direction="column" gap="size-100">
    <Flex alignItems="center" justifyContent="space-between">
      <Text weight="bold" fontSize="small">{email.sender}</Text>
      <Text fontSize="small" color="gray-600">{email.timestamp}</Text>
    </Flex>
    
    <Text>{email.subject}</Text>
    
    <Text fontSize="small" color="gray-700" UNSAFE_style={{
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }}>
      {email.preview}
    </Text>
    
    <Flex gap="size-100" marginTop="size-100">
      {email.tags.map(tag => (
        <Badge key={tag.name} variant={tag.variant}>
          {tag.name}
        </Badge>
      ))}
    </Flex>
  </Flex>
)

const EmailAnalysisPanel = ({ selectedEmail }) => (
  <Flex direction="column" gap="size-300">
    <Heading level={4}>🧠 AI Email Analysis</Heading>
    
    {selectedEmail ? (
      <>
        {/* Analysis Results */}
        <View backgroundColor="blue-100" borderRadius="medium" padding="size-200">
          <Grid columns="repeat(2, 1fr)" gap="size-200">
            <View>
              <Text weight="bold" fontSize="small">Sentiment:</Text>
              <Flex alignItems="center" gap="size-100">
                <Text fontSize="small">{selectedEmail.sentiment}</Text>
                <StatusLight variant="positive" />
              </Flex>
            </View>
            
            <View>
              <Text weight="bold" fontSize="small">Urgency:</Text>
              <Flex alignItems="center" gap="size-100">
                <Text fontSize="small">{selectedEmail.urgency}</Text>
                <StatusLight variant={selectedEmail.urgencyLevel} />
              </Flex>
            </View>
            
            <View>
              <Text weight="bold" fontSize="small">Intent:</Text>
              <Text fontSize="small">{selectedEmail.intent}</Text>
            </View>
            
            <View>
              <Text weight="bold" fontSize="small">Document Type:</Text>
              <Text fontSize="small">{selectedEmail.documentType}</Text>
            </View>
          </Grid>
        </View>
        
        {/* Extracted Entities */}
        <View backgroundColor="white" border="thin" borderRadius="medium" padding="size-200">
          <Heading level={5} marginBottom="size-150">🔍 Key Information</Heading>
          
          <Flex direction="column" gap="size-100">
            {selectedEmail.extractedEntities.map((entity, index) => (
              <Flex key={index} alignItems="center" gap="size-150">
                <Badge variant="informative">{entity.type}</Badge>
                <Text fontSize="small">{entity.value}</Text>
              </Flex>
            ))}
          </Flex>
        </View>
        
        {/* Suggested Actions */}
        <View backgroundColor="purple-100" borderRadius="medium" padding="size-200">
          <Heading level={5} marginBottom="size-150">💡 Suggested Actions</Heading>
          
          <CheckboxGroup>
            <Checkbox>✏️ Edit contract with requested changes</Checkbox>
            <Checkbox>📝 Generate professional response</Checkbox>
            <Checkbox>✍️ Prepare e-signature workflow</Checkbox>
            <Checkbox>📧 Schedule follow-up reminder</Checkbox>
          </CheckboxGroup>
          
          <Button variant="cta" marginTop="size-200">
            🚀 Execute Selected Actions
          </Button>
        </View>
      </>
    ) : (
      <Well>
        <Text color="gray-600">Select an email to see AI analysis</Text>
      </Well>
    )}
  </Flex>
)
```

---

## 📄 PDF Viewer Integration

### **PDF Viewer Placement & Contexts**

#### **Context 1: PDF Editing Mode**
```typescript
// Full-screen PDF editor with integrated viewer
const PDFEditingMode = () => (
  <View height="100vh" backgroundColor="gray-100">
    <Flex direction="column" height="100%">
      
      {/* PDF Editor Header */}
      <View backgroundColor="gray-200" borderBottomWidth="thin" paddingX="size-300" paddingY="size-200">
        <Flex alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" gap="size-200">
            <ActionButton isQuiet onPress={handleBackToDashboard}>
              <Icon>←</Icon>
              <Text>Back</Text>
            </ActionButton>
            <Text weight="bold">contract_amendment.pdf</Text>
            <Badge variant="positive">✅ Auto-saved</Badge>
          </Flex>
          
          <Flex alignItems="center" gap="size-200">
            <ActionGroup>
              <Item key="undo">↶</Item>
              <Item key="redo">↷</Item>
              <Item key="zoom-out">🔍-</Item>
              <Item key="zoom-in">🔍+</Item>
              <Item key="fit-page">📄</Item>
              <Item key="fit-width">↔️</Item>
            </ActionGroup>
            
            <ButtonGroup>
              <Button variant="secondary">Preview</Button>
              <Button variant="cta">Save & Export</Button>
            </ButtonGroup>
          </Flex>
        </Flex>
      </View>
      
      {/* Main PDF Editing Area */}
      <Flex direction="row" flex="1">
        
        {/* PDF Viewer - Takes up 70% of screen */}
        <View flex="3" backgroundColor="gray-300" position="relative">
          <PDFViewerCanvas />
        </View>
        
        {/* Editing Sidebar - Takes up 30% of screen */}
        <View width="400px" backgroundColor="white" borderLeftWidth="thin">
          <PDFEditingSidebar />
        </View>
        
      </Flex>
    </Flex>
  </View>
)

const PDFViewerCanvas = () => (
  <View height="100%" position="relative" overflow="auto">
    {/* PDF Viewer Controls */}
    <View 
      position="absolute" 
      top="size-200" 
      right="size-200" 
      zIndex={10}
      backgroundColor="white"
      borderRadius="medium"
      padding="size-150"
      UNSAFE_style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
    >
      <Flex direction="column" gap="size-100">
        <Text fontSize="small" weight="bold">Page {currentPage} of {totalPages}</Text>
        <Flex gap="size-100">
          <ActionButton size="S" onPress={previousPage}>←</ActionButton>
          <ActionButton size="S" onPress={nextPage}>→</ActionButton>
        </Flex>
        <Text fontSize="small">Zoom: {zoomLevel}%</Text>
      </Flex>
    </View>
    
    {/* PDF Canvas Area */}
    <View 
      backgroundColor="white"
      margin="size-400"
      borderRadius="small"
      UNSAFE_style={{
        minHeight: '800px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        position: 'relative'
      }}
    >
      {/* Simulated PDF Content */}
      <View padding="size-400" UNSAFE_style={{ fontFamily: 'serif', lineHeight: 1.6 }}>
        <View marginBottom="size-300">
          <Heading level={3}>SERVICE AGREEMENT</Heading>
          <Text color="gray-600">Contract No: SA-2024-001</Text>
        </View>
        
        <View marginBottom="size-300">
          <Heading level={4}>Payment Terms</Heading>
          <Text>
            Payment shall be due within{' '}
            {/* Editable Text Overlay */}
            <span style={{ 
              backgroundColor: selectedText === 'NET 30' ? '#ffeb3b' : 'transparent',
              position: 'relative',
              cursor: 'pointer',
              borderRadius: '2px',
              padding: '2px 4px'
            }}
            onClick={() => handleTextSelection('NET 30', { page: 1, x: 200, y: 150 })}
            >
              NET 30
            </span>
            {' '}days of invoice receipt. Late payments will incur a service charge...
          </Text>
        </View>
        
        {/* Live Annotation Overlay */}
        {annotations.map(annotation => (
          <View
            key={annotation.id}
            position="absolute"
            top={annotation.y}
            left={annotation.x}
            backgroundColor="orange-200"
            borderRadius="small"
            padding="size-100"
            maxWidth="200px"
            UNSAFE_style={{ 
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 5
            }}
          >
            <Text fontSize="small">💬 {annotation.comment}</Text>
            <Text fontSize="small" color="gray-600">- {annotation.author}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
)
```

#### **Context 2: PDF Creation Preview Mode**
```typescript
// Split-screen: Content writing on left, PDF preview on right
const PDFCreationMode = () => (
  <View height="100vh" backgroundColor="gray-75">
    <Flex direction="column" height="100%">
      
      {/* Creation Mode Header */}
      <View backgroundColor="purple-100" borderBottomWidth="thin" paddingX="size-300" paddingY="size-200">
        <Flex alignItems="center" justifyContent="space-between">
          <Flex alignItems="center" gap="size-200">
            <ActionButton isQuiet onPress={handleBackToDashboard}>
              <Icon>←</Icon>
              <Text>Back to Dashboard</Text>
            </ActionButton>
            <Text weight="bold">🎨 Creating: Marketing Proposal</Text>
            <Badge variant="notice">✨ AI Generating</Badge>
          </Flex>
          
          <ButtonGroup>
            <Button variant="secondary">Save Draft</Button>
            <Button variant="cta">Generate PDF</Button>
          </ButtonGroup>
        </Flex>
      </View>
      
      {/* Split Content Area */}
      <Flex direction="row" flex="1" gap="size-200" padding="size-200">
        
        {/* Left Side: Content Writing Interface */}
        <View flex="1" backgroundColor="white" borderRadius="medium">
          <ContentWritingInterface />
        </View>
        
        {/* Right Side: Live PDF Preview */}
        <View flex="1" backgroundColor="white" borderRadius="medium" position="relative">
          <LivePDFPreview />
        </View>
        
      </Flex>
    </Flex>
  </View>
)

const LivePDFPreview = () => (
  <Flex direction="column" height="100%">
    {/* Preview Header */}
    <View backgroundColor="gray-100" padding="size-200" borderTopRadius="medium">
      <Flex alignItems="center" justifyContent="between">
        <Text weight="bold">📄 Live PDF Preview</Text>
        <Flex alignItems="center" gap="size-150">
          <ActionButton size="S" isQuiet>
            <Icon>🔍-</Icon>
          </ActionButton>
          <Text fontSize="small">75%</Text>
          <ActionButton size="S" isQuiet>
            <Icon>🔍+</Icon>
          </ActionButton>
        </Flex>
      </Flex>
    </View>
    
    {/* PDF Preview Area */}
    <View flex="1" padding="size-200" overflow="auto" backgroundColor="gray-200">
      <View 
        backgroundColor="white"
        borderRadius="small"
        padding="size-400"
        marginX="auto"
        width="85%"
        UNSAFE_style={{
          minHeight: '600px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          fontFamily: 'serif'
        }}
      >
        {/* Live PDF Content Preview */}
        <View marginBottom="size-300">
          <Heading level={2}>Marketing Proposal</Heading>
          <Text color="gray-600">TechCorp SaaS Solution</Text>
          <Divider marginY="size-200" />
        </View>
        
        <View marginBottom="size-300">
          <Heading level={3}>Executive Summary</Heading>
          <Text UNSAFE_style={{ lineHeight: 1.6 }}>
            {generatedContent.executiveSummary || (
              <Text color="blue-600" fontStyle="italic">
                Content will appear here as AI generates it...
              </Text>
            )}
          </Text>
        </View>
        
        {generatedContent.sections.map((section, index) => (
          <View key={index} marginBottom="size-300">
            <Heading level={4}>{section.title}</Heading>
            <Text UNSAFE_style={{ lineHeight: 1.6 }}>
              {section.content || (
                <Text color="blue-600" fontStyle="italic">
                  {section.isGenerating ? "AI is writing this section..." : "Waiting to generate..."}
                </Text>
              )}
            </Text>
          </View>
        ))}
      </View>
    </View>
  </Flex>
)
```

#### **Context 3: Dashboard PDF Viewer (Quick View)**
```typescript
// Modal PDF viewer for quick document preview
const QuickPDFViewer = ({ isOpen, document, onClose }) => (
  <Dialog size="fullscreen" isOpen={isOpen} onDismiss={onClose}>
    <Heading slot="title">
      📄 {document.name}
      <Badge variant="informative" marginStart="size-150">Quick View</Badge>
    </Heading>
    
    <Content>
      <Flex direction="row" height="80vh" gap="size-300">
        {/* PDF Viewer */}
        <View flex="3" backgroundColor="gray-200" borderRadius="medium" overflow="hidden">
          <PDFQuickViewCanvas document={document} />
        </View>
        
        {/* Document Info Panel */}
        <View flex="1" backgroundColor="gray-100" borderRadius="medium" padding="size-300">
          <Flex direction="column" gap="size-300">
            <View>
              <Text weight="bold">Document Info</Text>
              <Divider marginY="size-150" />
              <Flex direction="column" gap="size-100">
                <Text fontSize="small"><strong>Type:</strong> {document.type}</Text>
                <Text fontSize="small"><strong>Pages:</strong> {document.pages}</Text>
                <Text fontSize="small"><strong>Size:</strong> {document.size}</Text>
                <Text fontSize="small"><strong>Modified:</strong> {document.modified}</Text>
              </Flex>
            </View>
            
            <View>
              <Text weight="bold">Quick Actions</Text>
              <Divider marginY="size-150" />
              <ActionGroup orientation="vertical" isQuiet>
                <Item key="edit">✏️ Edit Document</Item>
                <Item key="sign">✍️ Request Signature</Item>
                <Item key="email">📧 Send via Email</Item>
                <Item key="download">📥 Download PDF</Item>
              </ActionGroup>
            </View>
            
            <View>
              <Text weight="bold">AI Suggestions</Text>
              <Divider marginY="size-150" />
              <ListView height="size-1600">
                {document.suggestions.map(suggestion => (
                  <Item key={suggestion.id}>
                    <Text fontSize="small">{suggestion.text}</Text>
                  </Item>
                ))}
              </ListView>
            </View>
          </Flex>
        </View>
      </Flex>
    </Content>
    
    <ButtonGroup slot="buttonGroup">
      <Button variant="secondary" onPress={onClose}>Close</Button>
      <Button variant="cta" onPress={() => handleFullEdit(document)}>
        ✏️ Open in Editor
      </Button>
    </ButtonGroup>
  </Dialog>
)
```

---

## ✍️ Content Writing Interface

### **Hybrid AI + Manual Writing System**

#### **Main Content Writing Workspace**
```typescript
const ContentWritingInterface = () => (
  <Flex direction="column" height="100%">
    
    {/* Writing Toolbar */}
    <View backgroundColor="purple-50" padding="size-200" borderTopRadius="medium">
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" gap="size-200">
          <Text weight="bold">🎨 Content Editor</Text>
          <Badge variant={isAIActive ? 'positive' : 'neutral'}>
            {isAIActive ? '🤖 AI Active' : '✍️ Manual Mode'}
          </Badge>
        </Flex>
        
        <ActionGroup>
          <Item key="ai-assist" isSelected={isAIActive}>🤖 AI Assist</Item>
          <Item key="manual" isSelected={!isAIActive}>✍️ Manual</Item>
          <Item key="hybrid" isSelected={isHybridMode}>🔄 Hybrid</Item>
        </ActionGroup>
      </Flex>
    </View>
    
    {/* Content Writing Area */}
    <Flex direction="row" flex="1">
      
      {/* Main Writing Panel */}
      <View flex="2" padding="size-300">
        <WritingEditor />
      </View>
      
      {/* AI Assistant Sidebar */}
      <View width="300px" backgroundColor="purple-100" padding="size-300">
        <AIWritingAssistant />
      </View>
      
    </Flex>
  </Flex>
)

const WritingEditor = () => (
  <Flex direction="column" height="100%" gap="size-200">
    
    {/* Document Structure */}
    <View backgroundColor="gray-100" borderRadius="medium" padding="size-200">
      <Text weight="bold" marginBottom="size-150">📋 Document Structure</Text>
      
      <ListView 
        selectionMode="single" 
        selectedKeys={[activeSection]}
        onSelectionChange={setActiveSection}
        height="size-1000"
      >
        <Item key="executive-summary">
          <Flex alignItems="center" justifyContent="space-between">
            <Text>1. Executive Summary</Text>
            <Badge variant={sections.executiveSummary.status}>{sections.executiveSummary.status}</Badge>
          </Flex>
        </Item>
        <Item key="problem-statement">
          <Flex alignItems="center" justifyContent="space-between">
            <Text>2. Problem Statement</Text>
            <Badge variant={sections.problemStatement.status}>{sections.problemStatement.status}</Badge>
          </Flex>
        </Item>
        <Item key="solution-overview">
          <Flex alignItems="center" justifyContent="space-between">
            <Text>3. Solution Overview</Text>
            <Badge variant={sections.solutionOverview.status}>{sections.solutionOverview.status}</Badge>
          </Flex>
        </Item>
        <Item key="roi-analysis">
          <Flex alignItems="center" justifyContent="space-between">
            <Text>4. ROI Analysis</Text>
            <Badge variant={sections.roiAnalysis.status}>{sections.roiAnalysis.status}</Badge>
          </Flex>
        </Item>
      </ListView>
    </View>
    
    {/* Main Text Editor */}
    <View flex="1" backgroundColor="white" borderRadius="medium" position="relative">
      <RichTextEditor />
    </View>
    
    {/* Writing Controls */}
    <View backgroundColor="gray-100" borderRadius="medium" padding="size-200">
      <Flex alignItems="center" justifyContent="space-between">
        <Flex alignItems="center" gap="size-200">
          <Text fontSize="small">Words: <strong>{wordCount}</strong></Text>
          <Text fontSize="small">Characters: <strong>{charCount}</strong></Text>
          <Text fontSize="small">Reading Time: <strong>{readingTime}</strong></Text>
        </Flex>
        
        <ButtonGroup size="S">
          <Button variant="secondary">Save Draft</Button>
          <Button variant="primary">Continue with AI</Button>
        </ButtonGroup>
      </Flex>
    </View>
    
  </Flex>
)

const RichTextEditor = () => (
  <View height="100%" position="relative">
    
    {/* Rich Text Toolbar */}
    <View 
      backgroundColor="white" 
      borderBottomWidth="thin" 
      borderBottomColor="gray-300"
      padding="size-150"
    >
      <Flex alignItems="center" gap="size-150">
        <ActionGroup size="S">
          <Item key="bold"><strong>B</strong></Item>
          <Item key="italic"><em>I</em></Item>
          <Item key="underline"><u>U</u></Item>
        </ActionGroup>
        
        <Divider orientation="vertical" size="S" />
        
        <ActionGroup size="S">
          <Item key="h1">H1</Item>
          <Item key="h2">H2</Item>
          <Item key="h3">H3</Item>
        </ActionGroup>
        
        <Divider orientation="vertical" size="S" />
        
        <ActionGroup size="S">
          <Item key="bullet">• List</Item>
          <Item key="number">1. List</Item>
          <Item key="quote">"Quote</Item>
        </ActionGroup>
        
        <View flex="1" />
        
        <ActionButton size="S" variant="cta" onPress={triggerAIAssist}>
          ✨ AI Assist
        </ActionButton>
      </Flex>
    </View>
    
    {/* Text Editor Area */}
    <View flex="1" position="relative">
      <TextArea
        placeholder="Start writing your content here, or use AI assistance to generate text..."
        value={editorContent}
        onChange={handleContentChange}
        height="100%"
        width="100%"
        UNSAFE_style={{
          border: 'none',
          resize: 'none',
          fontSize: '16px',
          lineHeight: '1.6',
          fontFamily: 'system-ui',
          padding: '20px'
        }}
      />
      
      {/* AI Writing Overlay */}
      {isAIGenerating && (
        <View
          position="absolute"
          top={aiCursorPosition.y}
          left={aiCursorPosition.x}
          backgroundColor="blue-100"
          borderRadius="medium"
          padding="size-150"
          UNSAFE_style={{ 
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            zIndex: 10,
            animation: 'pulse 2s infinite'
          }}
        >
          <Flex alignItems="center" gap="size-100">
            <ProgressCircle size="S" isIndeterminate />
            <Text fontSize="small">🤖 AI is writing...</Text>
            <ActionButton size="S" isQuiet onPress={stopAIGeneration}>
              <Icon>×</Icon>
            </ActionButton>
          </Flex>
        </View>
      )}
      
      {/* Live Suggestions Popup */}
      {showSuggestions && (
        <View
          position="absolute"
          top={suggestionPosition.y}
          left={suggestionPosition.x}
          backgroundColor="white"
          borderRadius="medium"
          padding="size-200"
          width="300px"
          UNSAFE_style={{ 
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 15
          }}
        >
          <Text weight="bold" marginBottom="size-150">💡 AI Suggestions</Text>
          
          <ListView selectionMode="single" height="size-1200">
            {aiSuggestions.map(suggestion => (
              <Item key={suggestion.id}>
                <Pressable onPress={() => applySuggestion(suggestion)}>
                  <Text fontSize="small">{suggestion.text}</Text>
                </Pressable>
              </Item>
            ))}
          </ListView>
          
          <Flex alignItems="center" justifyContent="between" marginTop="size-150">
            <Button variant="secondary" size="S" onPress={dismissSuggestions}>
              Dismiss
            </Button>
            <Button variant="primary" size="S" onPress={getMoreSuggestions}>
              More Ideas
            </Button>
          </Flex>
        </View>
      )}
    </View>
  </View>
)

const AIWritingAssistant = () => (
  <Flex direction="column" height="100%" gap="size-200">
    
    {/* AI Status */}
    <View backgroundColor="white" borderRadius="medium" padding="size-200">
      <Flex alignItems="center" gap="size-150">
        <StatusLight variant={aiStatus.variant} />
        <View flex="1">
          <Text weight="bold" fontSize="small">🤖 AI Assistant</Text>
          <Text fontSize="small" color="gray-700">{aiStatus.message}</Text>
        </View>
      </Flex>
    </View>
    
    {/* Writing Configuration */}
    <View backgroundColor="white" borderRadius="medium" padding="size-200">
      <Text weight="bold" fontSize="small" marginBottom="size-150">⚙️ Writing Settings</Text>
      
      <Flex direction="column" gap="size-150">
        <ComboBox 
          label="Tone" 
          labelPosition="side"
          size="S"
          selectedKey={writingTone}
          onSelectionChange={setWritingTone}
        >
          <Item key="professional">Professional</Item>
          <Item key="persuasive">Persuasive</Item>
          <Item key="technical">Technical</Item>
          <Item key="friendly">Friendly</Item>
        </ComboBox>
        
        <ComboBox 
          label="Length"
          labelPosition="side"
          size="S"
          selectedKey={contentLength}
          onSelectionChange={setContentLength}
        >
          <Item key="brief">Brief</Item>
          <Item key="moderate">Moderate</Item>
          <Item key="detailed">Detailed</Item>
          <Item key="comprehensive">Comprehensive</Item>
        </ComboBox>
        
        <CheckboxGroup size="S">
          <Checkbox isSelected={includeData}>Include statistics</Checkbox>
          <Checkbox isSelected={includeExamples}>Add examples</Checkbox>
          <Checkbox isSelected={includeCTA}>Call-to-action</Checkbox>
        </CheckboxGroup>
      </Flex>
    </View>
    
    {/* Quick Actions */}
    <View backgroundColor="white" borderRadius="medium" padding="size-200">
      <Text weight="bold" fontSize="small" marginBottom="size-150">⚡ Quick Actions</Text>
      
      <ActionGroup orientation="vertical" isQuiet>
        <Item key="generate-section">🎨 Generate Section</Item>
        <Item key="improve-text">✨ Improve Selected</Item>
        <Item key="expand">📝 Expand Content</Item>
        <Item key="summarize">📋 Summarize</Item>
        <Item key="translate">🌐 Translate</Item>
      </ActionGroup>
    </View>
    
    {/* Content Templates */}
    <View backgroundColor="white" borderRadius="medium" padding="size-200" flex="1">
      <Text weight="bold" fontSize="small" marginBottom="size-150">📋 Templates</Text>
      
      <ListView height="100%" selectionMode="single">
        <Item key="intro">
          <View>
            <Text weight="bold" fontSize="small">Introduction</Text>
            <Text fontSize="small" color="gray-600">Opening statement</Text>
          </View>
        </Item>
        <Item key="problem">
          <View>
            <Text weight="bold" fontSize="small">Problem Statement</Text>
            <Text fontSize="small" color="gray-600">Define the issue</Text>
          </View>
        </Item>
        <Item key="solution">
          <View>
            <Text weight="bold" fontSize="small">Solution Overview</Text>
            <Text fontSize="small" color="gray-600">Present your solution</Text>
          </View>
        </Item>
        <Item key="benefits">
          <View>
            <Text weight="bold" fontSize="small">Benefits & ROI</Text>
            <Text fontSize="small" color="gray-600">Value proposition</Text>
          </View>
        </Item>
      </ListView>
    </View>
    
  </Flex>
)
```

---

## 📱 Mobile Responsive Design

### **Mobile Layout (768px and below)**
```typescript
const MobileLayout = () => (
  <Provider theme={defaultTheme} colorScheme="light">
    <View backgroundColor="gray-75" minHeight="100vh">
      
      {/* Mobile Header */}
      <View backgroundColor="blue-600" paddingX="size-200" paddingY="size-200">
        <Flex alignItems="center" justifyContent="space-between">
          <MenuTrigger>
            <ActionButton isQuiet UNSAFE_style={{ color: 'white' }}>
              <Icon>☰</Icon>
            </ActionButton>
            <Menu>
              <Item key="dashboard">🏠 Dashboard</Item>
              <Item key="documents">📄 Documents</Item>
              <Item key="agents">🤖 Agents</Item>
              <Item key="templates">📋 Templates</Item>
            </Menu>
          </MenuTrigger>
          
          <Heading level={3} color="white">AgenticPDF</Heading>
          
          <ActionButton isQuiet UNSAFE_style={{ color: 'white' }}>
            <Icon>👤</Icon>
          </ActionButton>
        </Flex>
      </View>
      
      {/* Mobile Content */}
      <View padding="size-200">
        <MobileDashboard />
      </View>
      
      {/* Mobile Bottom Navigation */}
      <View 
        position="fixed" 
        bottom={0} 
        left={0} 
        right={0}
        backgroundColor="white"
        borderTopWidth="thin"
        borderTopColor="gray-300"
        paddingY="size-150"
      >
        <Flex justifyContent="space-around">
          <TabList orientation="horizontal" density="compact">
            <Item key="create">
              <Icon>🎨</Icon>
              <Text>Create</Text>
            </Item>
            <Item key="edit">
              <Icon>✏️</Icon>
              <Text>Edit</Text>
            </Item>
            <Item key="email">
              <Icon>📧</Icon>
              <Text>Email</Text>
            </Item>
            <Item key="sign">
              <Icon>✍️</Icon>
              <Text>Sign</Text>
            </Item>
          </TabList>
        </Flex>
      </View>
      
    </View>
  </Provider>
)

const MobileDashboard = () => (
  <Flex direction="column" gap="size-300">
    
    {/* Mobile Hero */}
    <View 
      backgroundColor="blue-100" 
      borderRadius="medium"
      padding="size-300"
    >
      <Heading level={3} textAlign="center" marginBottom="size-200">
        🤖 Your AI Agents
      </Heading>
      
      <Grid columns="repeat(2, 1fr)" gap="size-200">
        <MobileAgentCard icon="🎨" title="Content" status="ready" />
        <MobileAgentCard icon="✏️" title="Editor" status="busy" />
        <MobileAgentCard icon="📧" title="Gmail" status="active" />
        <MobileAgentCard icon="✍️" title="Sign" status="idle" />
      </Grid>
    </View>
    
    {/* Mobile Quick Actions */}
    <View backgroundColor="white" borderRadius="medium" padding="size-300">
      <Heading level={4} marginBottom="size-200">Quick Actions</Heading>
      
      <Flex direction="column" gap="size-200">
        <Button variant="cta" width="100%">
          🆕 Create New Document
        </Button>
        <Button variant="secondary" width="100%">
          📤 Upload PDF
        </Button>
        <Button variant="secondary" width="100%">
          📧 Check Emails
        </Button>
      </Flex>
    </View>
    
    {/* Mobile Recent Activity */}
    <View backgroundColor="white" borderRadius="medium" padding="size-300">
      <Heading level={4} marginBottom="size-200">Recent Activity</Heading>
      
      <Flex direction="column" gap="size-200">
        {recentActivity.slice(0, 3).map((activity, index) => (
          <MobileActivityItem key={index} activity={activity} />
        ))}
        
        <Button variant="secondary" size="S">
          View All Activity
        </Button>
      </Flex>
    </View>
    
  </Flex>
)
```

---

## 🎯 Accessibility Features

### **ARIA Implementation**
```typescript
// Comprehensive accessibility features
const AccessibleComponents = {
  
  // Screen Reader Support
  agentStatus: {
    'aria-live': 'polite',
    'aria-label': 'AI Agent status updates',
    'role': 'status'
  },
  
  // Keyboard Navigation
  quickActions: {
    'tabIndex': 0,
    'onKeyDown': handleKeyboardNavigation,
    'aria-describedby': 'quick-actions-help'
  },
  
  // High Contrast Mode
  theme: {
    colorScheme: preferredColorScheme,
    reducedMotion: prefersReducedMotion
  },
  
  // Focus Management
  modal: {
    'aria-modal': true,
    'role': 'dialog',
    'aria-labelledby': 'modal-title',
    'aria-describedby': 'modal-description'
  }
}

// Color Contrast Ratios (WCAG AA Compliant)
const accessibleColors = {
  primary: '#1976D2',     // 4.5:1 on white
  success: '#2E7D32',     // 4.6:1 on white
  warning: '#F57C00',     // 3.1:1 on white (large text only)
  error: '#C62828',       // 5.5:1 on white
  text: '#212121'         // 15.8:1 on white
}
```

---

This comprehensive UI design provides:

✅ **Complete Visual System** - Colors, typography, spacing
✅ **Responsive Layouts** - Desktop, tablet, and mobile
✅ **Interactive Components** - Real React Spectrum components
✅ **Agent Interfaces** - Specialized UI for each agent
✅ **Live Demonstrations** - How interactions actually work
✅ **Accessibility Features** - WCAG compliant design
✅ **Modern UX Patterns** - Progressive disclosure, contextual actions

Ready to start building this beautiful, intelligent interface! 🎨✨
