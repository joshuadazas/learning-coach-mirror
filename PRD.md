# Product Requirements Document (PRD)
## Learning Coach Agentic Workflow System

**Version:** 1.0  
**Date:** October 6, 2025  
**Status:** Draft  
**Owner:** Learning Coach Development Team

---

## Executive Summary

This PRD defines an AI-powered learning coach application that uses an agentic workflow to provide verified, personalized learning recommendations to internal users. The system addresses the critical issue of URL hallucination by implementing a multi-agent architecture that discovers, validates, and curates learning resources from multiple sources before presenting them to users.

---

## 1. Problem Statement

The current learning coach application generates hallucinated or invalid URLs when recommending learning resources. Users receive broken links or irrelevant content, undermining trust in the system and reducing adoption.

**Root Cause:** Single-step AI generation without verification, validation, or structured resource discovery.

---

## 2. Goals & Success Metrics

### Primary Goals
1. **Eliminate URL hallucination**: 95%+ of returned URLs must be valid and accessible
2. **Deliver relevant recommendations**: 80%+ user satisfaction with resource relevance
3. **Fast MVP delivery**: Production-ready system within 4-6 weeks

### Success Metrics
- URL validity rate: >95%
- Average response time: <10 seconds
- User satisfaction score: >4/5
- System uptime: >99%
- Cost per recommendation: <$0.10

---

## 3. Jobs to Be Done (JTBD)

| Actor | Job | Success Criteria |
|-------|-----|------------------|
| **Internal User** | Send learning needs and preferences to the learning coach | Receives personalized learning plan within 10 seconds |
| **Learning Coach Manager** | Use user input (country, material type, price preference) to focus resource search | 90%+ of resources match user preferences |
| **Learning Coach Manager** | Search web, library catalogues, and tools (Firecrawl) for learning resources | System finds 4+ relevant resources with valid URLs |
| **Learning Coach Manager** | Return stylized learning recommendation | User can view, save, and auto-send to Google Sheets via n8n |

---

## 4. User Stories

### User Story 1: Submit Learning Request
**As an** internal user  
**I want to** submit my learning goals, skills to develop, and preferences  
**So that** I receive personalized learning recommendations

**Acceptance Criteria:**
- Form captures: name, country, skills (hard/soft), preferences (format, price), time available
- Submission triggers agentic workflow
- User receives feedback that request is processing

### User Story 2: Receive Personalized Recommendations
**As an** internal user  
**I want to** receive 4 learning resources (2 hard skills, 2 soft skills) with valid URLs  
**So that** I can start my learning journey immediately

**Acceptance Criteria:**
- Response includes 4 resources matching preferences
- Each resource has: title, type, price, valid URL
- Response is stylized and easy to read
- Copy button available for sharing

### User Story 3: Resource Discovery & Validation
**As a** learning coach manager  
**I want** the system to search multiple sources and validate URLs  
**So that** users never receive broken or irrelevant links

**Acceptance Criteria:**
- System searches: Open Library API, Microsoft Learn API, Google Search, Brave Search
- All URLs are validated before presentation
- Invalid URLs are filtered out automatically

### User Story 4: Data Persistence
**As a** learning coach manager  
**I want** all recommendations saved to Google Sheets via n8n  
**So that** we can track usage and improve recommendations

**Acceptance Criteria:**
- Successful recommendations sent to n8n webhook
- Data includes: user request + AI response
- Fire-and-forget pattern (no blocking)

---

## 5. Technical Architecture

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                        │
│              React + TypeScript + Tailwind                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              API ROUTES (Vercel Serverless)                  │
│              /api/learning-drop (POST)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 AGENT ORCHESTRATOR                           │
│              (Vercel Serverless Function)                    │
└───┬─────────────┬─────────────┬────────────────┬───────────┘
    │             │             │                │
    ▼             ▼             ▼                ▼
┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────────┐
│Resource │  │  URL    │  │ Content  │  │   Quality    │
│Discovery│  │Validation│  │Generation│  │  Assurance   │
│ Agent   │  │ Agent   │  │  Agent   │  │    Agent     │
└─────────┘  └─────────┘  └──────────┘  └──────────────┘
```

### 5.2 Agent Framework Selection

#### **Recommended: LangGraph (LangChain)**

**Rationale:**
- ✅ **Vercel Compatible**: Works in Node.js serverless functions
- ✅ **State Management**: Built-in state persistence across agent steps
- ✅ **Error Handling**: Robust retry and fallback mechanisms
- ✅ **Conditional Routing**: Supports branching logic for validation failures
- ✅ **Streaming Support**: Can stream responses for better UX
- ✅ **Tool Integration**: Easy integration with search APIs and MCPs
- ✅ **Monitoring**: Built-in observability with LangSmith

**Alternatives Considered:**
- ❌ **CrewAI**: Too heavyweight for Vercel serverless constraints
- ❌ **AutoGen**: Better for conversational agents, overkill for this use case
- ⚠️ **Custom Implementation**: Faster to start but lacks robustness features

**Decision**: Use LangGraph for production-ready features with rapid MVP delivery

### 5.3 Agent Architecture Details

#### **Agent 1: Resource Discovery Agent**

**Purpose:** Find learning resources from multiple sources

**Tools:**
1. **Open Library API Tool** ([Open Library Search API](https://openlibrary.org/dev/docs/api/search))
   - Search for books by subject/author
   - Filter by availability
   - Returns: title, author, ISBN, subject, cover image

2. **Microsoft Learn API Tool** ([Microsoft Learn Catalog API](https://learn.microsoft.com/en-us/training/support/catalog-api))
   - Search modules, learning paths, certifications
   - Filter by level, products, roles
   - Returns: title, type, URL, duration, level

3. **Google Search Tool** (Gemini's built-in Google Search)
   - Web-wide search for courses, articles, videos
   - Returns: URLs, snippets, titles

4. **Brave Search API Tool** (Fallback)
   - Privacy-focused search
   - Alternative when Google Search unavailable
   - Returns: web results, news, videos

5. **Firecrawl Tool** (Content extraction)
   - Scrapes and structures web content
   - Validates page content exists
   - Returns: clean markdown, metadata

**Implementation:**
```typescript
class ResourceDiscoveryAgent {
  private tools = {
    openLibrary: new OpenLibraryTool(),
    microsoftLearn: new MicrosoftLearnTool(),
    googleSearch: new GoogleSearchTool(),
    braveSearch: new BraveSearchTool(),
    firecrawl: new FirecrawlTool()
  };

  async execute(state: WorkflowState): Promise<WorkflowState> {
    const { hard_skills, soft_skills, learning_preferences, price_preference } = state.userRequest;
    
    // Parallel search across all sources
    const searchPromises = [
      this.searchOpenLibrary(hard_skills, soft_skills),
      this.searchMicrosoftLearn(hard_skills, soft_skills),
      this.searchGoogle(hard_skills, soft_skills, learning_preferences),
      this.searchBrave(hard_skills, soft_skills)
    ];
    
    const results = await Promise.allSettled(searchPromises);
    
    // Merge, deduplicate, and rank
    state.discoveredResources = this.mergeAndRank(results, state.userRequest);
    
    return state;
  }
}
```

#### **Agent 2: URL Validation Agent**

**Purpose:** Verify all URLs are accessible and relevant

**Tools:**
1. **HTTP Validation Tool**
   - HEAD request to check URL accessibility
   - Validates status code 200
   - Checks for redirects

2. **Firecrawl Content Validator**
   - Extracts page content
   - Validates content exists (not 404 page)
   - Checks for paywalls/login requirements

3. **Relevance Scorer**
   - Uses lightweight NLP (TF-IDF or embeddings)
   - Scores content relevance to user skills
   - Filters resources below threshold

**Implementation:**
```typescript
class URLValidationAgent {
  async execute(state: WorkflowState): Promise<WorkflowState> {
    const validationPromises = state.discoveredResources.map(
      resource => this.validateResource(resource)
    );
    
    const results = await Promise.allSettled(validationPromises);
    
    state.validatedResources = results
      .filter(r => r.status === 'fulfilled' && r.value.isValid)
      .map(r => r.value.resource);
    
    // If less than 4 resources, trigger re-discovery
    if (state.validatedResources.length < 4) {
      state.needsMoreResources = true;
    }
    
    return state;
  }

  private async validateResource(resource: LearningResource): Promise<ValidationResult> {
    // 1. HTTP check
    const isAccessible = await this.httpCheck(resource.url);
    if (!isAccessible) return { resource, isValid: false, reason: 'inaccessible' };
    
    // 2. Content extraction with Firecrawl
    const content = await this.firecrawl.scrape(resource.url);
    if (!content || content.length < 100) {
      return { resource, isValid: false, reason: 'no_content' };
    }
    
    // 3. Relevance check
    const relevanceScore = await this.scoreRelevance(content, resource);
    if (relevanceScore < 0.6) {
      return { resource, isValid: false, reason: 'not_relevant' };
    }
    
    return { resource, isValid: true };
  }
}
```

#### **Agent 3: Content Generation Agent**

**Purpose:** Create personalized, stylized learning drop message

**Tools:**
1. **Gemini LLM**
   - Generates personalized message
   - Formats in required markdown style
   - Adds motivational content

**Implementation:**
```typescript
class ContentGenerationAgent {
  private gemini: GeminiService;

  async execute(state: WorkflowState): Promise<WorkflowState> {
    const { validatedResources, userRequest } = state;
    
    // Select optimal 4 resources (2 hard, 2 soft)
    const selectedResources = this.selectOptimal(validatedResources, userRequest);
    
    // Generate personalized message
    const prompt = this.buildPrompt(selectedResources, userRequest);
    const response = await this.gemini.generateContent(prompt);
    
    state.finalMessage = response.text;
    state.finalResources = selectedResources;
    
    return state;
  }

  private buildPrompt(resources: LearningResource[], userRequest: FormData): string {
    return `
Generate a personalized learning drop for ${userRequest.name}.

VERIFIED RESOURCES (use EXACTLY these URLs):
${resources.map(r => `- ${r.title}: ${r.url} (${r.type}, ${r.price})`).join('\n')}

USER PROFILE:
- Hard Skills: ${userRequest.hard_skills}
- Soft Skills: ${userRequest.soft_skills}
- Time Available: ${userRequest.time_available_per_week}

FORMAT (EXACT):
Hey ${userRequest.name}, your next challenge awaits.
Your Learning Drop 🚀

**Hard Skills**
**[Skill Name]** — [Price] — ([Type 🎓](URL))
**[Skill Name]** — [Price] — ([Type 📚](URL))

**Soft Skills**
**[Skill Name]** — [Price] — ([Type 📰](URL))
**[Skill Name]** — [Price] — ([Type 🎬](URL))

[1-2 sentence explanation why these resources are perfect]
[Motivational closing]

CRITICAL: Use ONLY the URLs provided above. Do not invent or modify URLs.
`;
  }
}
```

#### **Agent 4: Quality Assurance Agent**

**Purpose:** Final validation before delivery to user

**Tools:**
1. **Format Validator**
   - Checks markdown formatting
   - Validates all required sections present
   - Ensures 4 resources included

2. **URL Re-checker**
   - Final URL validation
   - Ensures no hallucinated URLs slipped through

**Implementation:**
```typescript
class QualityAssuranceAgent {
  async execute(state: WorkflowState): Promise<WorkflowState> {
    const validationResults = {
      formatValid: this.validateFormat(state.finalMessage),
      urlsValid: await this.validateUrls(state.finalMessage, state.finalResources),
      resourceCount: this.countResources(state.finalMessage) === 4
    };
    
    const isValid = Object.values(validationResults).every(v => v === true);
    
    if (!isValid) {
      state.errors.push('QA validation failed');
      state.retryCount++;
      
      if (state.retryCount < 2) {
        // Trigger regeneration
        return state; // Will be routed back to content generation
      }
    }
    
    state.qaApproved = isValid;
    return state;
  }
}
```

### 5.4 Workflow State Machine

```typescript
interface WorkflowState {
  // Input
  userRequest: FormData;
  
  // Agent outputs
  discoveredResources: LearningResource[];
  validatedResources: LearningResource[];
  finalResources: LearningResource[];
  finalMessage: string;
  
  // Control flow
  needsMoreResources: boolean;
  retryCount: number;
  errors: string[];
  qaApproved: boolean;
  
  // Metadata
  startTime: number;
  agentTimings: Record<string, number>;
}
```

### 5.5 LangGraph Workflow Implementation

```typescript
// services/agenticWorkflow.ts
import { StateGraph, END } from "@langchain/langgraph";

export function createLearningCoachWorkflow() {
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      userRequest: { value: null },
      discoveredResources: { value: [] },
      validatedResources: { value: [] },
      finalResources: { value: [] },
      finalMessage: { value: "" },
      needsMoreResources: { value: false },
      retryCount: { value: 0 },
      errors: { value: [] },
      qaApproved: { value: false }
    }
  });

  // Add agent nodes
  workflow.addNode("resource_discovery", resourceDiscoveryAgent);
  workflow.addNode("url_validation", urlValidationAgent);
  workflow.addNode("content_generation", contentGenerationAgent);
  workflow.addNode("quality_assurance", qualityAssuranceAgent);

  // Define flow
  workflow.addEdge("resource_discovery", "url_validation");
  
  // Conditional: if not enough resources, re-discover
  workflow.addConditionalEdges(
    "url_validation",
    (state) => {
      if (state.needsMoreResources && state.retryCount < 2) {
        return "resource_discovery";
      }
      return "content_generation";
    }
  );
  
  workflow.addEdge("content_generation", "quality_assurance");
  
  // Conditional: if QA fails, regenerate
  workflow.addConditionalEdges(
    "quality_assurance",
    (state) => {
      if (!state.qaApproved && state.retryCount < 2) {
        return "content_generation";
      }
      return END;
    }
  );

  workflow.setEntryPoint("resource_discovery");
  
  return workflow.compile();
}
```

### 5.6 API Route Implementation

```typescript
// pages/api/learning-drop.ts
import { createLearningCoachWorkflow } from '../../services/agenticWorkflow';

export const config = {
  maxDuration: 30, // 30 seconds for Vercel Pro
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  
  try {
    const formData: FormData = req.body;
    
    // Initialize workflow
    const workflow = createLearningCoachWorkflow();
    
    // Execute workflow
    const initialState: WorkflowState = {
      userRequest: formData,
      discoveredResources: [],
      validatedResources: [],
      finalResources: [],
      finalMessage: "",
      needsMoreResources: false,
      retryCount: 0,
      errors: [],
      qaApproved: false,
      startTime,
      agentTimings: {}
    };
    
    const finalState = await workflow.invoke(initialState);
    
    // Build response
    const learningDrop: LearningDrop = {
      message: finalState.finalMessage,
      sources: finalState.finalResources.map(r => ({
        title: r.title,
        uri: r.url
      }))
    };
    
    // Send to n8n (fire-and-forget)
    sendToN8n(formData, learningDrop).catch(console.error);
    
    // Log metrics
    console.log('Workflow completed:', {
      duration: Date.now() - startTime,
      resourcesFound: finalState.discoveredResources.length,
      resourcesValidated: finalState.validatedResources.length,
      retries: finalState.retryCount
    });
    
    res.status(200).json(learningDrop);
    
  } catch (error) {
    console.error('Workflow error:', error);
    
    // Fallback to enhanced Gemini service
    try {
      const fallbackResult = await fallbackGeminiService(req.body);
      res.status(200).json(fallbackResult);
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Failed to generate learning drop',
        message: 'Please try again later'
      });
    }
  }
}
```

---

## 6. Tool Implementations

### 6.1 Open Library Tool

```typescript
// tools/openLibraryTool.ts
export class OpenLibraryTool {
  private baseUrl = 'https://openlibrary.org/search.json';

  async search(query: string, limit: number = 10): Promise<LearningResource[]> {
    const params = new URLSearchParams({
      q: query,
      fields: 'key,title,author_name,first_publish_year,subject,cover_i,ia',
      limit: limit.toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data = await response.json();

    return data.docs
      .filter((doc: any) => doc.ia && doc.ia.length > 0) // Only books with Internet Archive access
      .map((doc: any) => ({
        title: doc.title,
        type: 'Book' as const,
        url: `https://openlibrary.org${doc.key}`,
        price: 'Free',
        description: `By ${doc.author_name?.join(', ') || 'Unknown'}. Published ${doc.first_publish_year || 'date unknown'}.`,
        keywords: doc.subject || []
      }));
  }
}
```

### 6.2 Microsoft Learn Tool

```typescript
// tools/microsoftLearnTool.ts
export class MicrosoftLearnTool {
  private baseUrl = 'https://learn.microsoft.com/api/catalog';

  async search(skills: string[], limit: number = 10): Promise<LearningResource[]> {
    const query = skills.join(' OR ');
    const params = new URLSearchParams({
      q: query,
      $top: limit.toString(),
      locale: 'en-us'
    });

    const response = await fetch(`${this.baseUrl}?${params}`);
    const data = await response.json();

    return data.results.map((item: any) => ({
      title: item.title,
      type: this.mapType(item.type),
      url: `https://learn.microsoft.com${item.url}`,
      price: 'Free',
      description: item.summary || item.description,
      keywords: item.products || []
    }));
  }

  private mapType(type: string): 'Course' | 'Article' | 'Video' {
    if (type === 'learningPath') return 'Course';
    if (type === 'module') return 'Course';
    return 'Article';
  }
}
```

### 6.3 Firecrawl Tool

```typescript
// tools/firecrawlTool.ts
export class FirecrawlTool {
  private apiKey = process.env.FIRECRAWL_API_KEY;
  private baseUrl = 'https://api.firecrawl.dev/v1';

  async scrape(url: string): Promise<{ content: string; metadata: any }> {
    if (!this.apiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: data.markdown,
      metadata: data.metadata
    };
  }

  async validateUrl(url: string): Promise<boolean> {
    try {
      const result = await this.scrape(url);
      return result.content.length > 100; // Arbitrary threshold
    } catch {
      return false;
    }
  }
}
```

### 6.4 Google Search Tool (via Gemini)

```typescript
// tools/googleSearchTool.ts
export class GoogleSearchTool {
  private gemini: GoogleGenAI;

  constructor() {
    this.gemini = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async search(query: string, preferences: string[]): Promise<SearchSource[]> {
    const prompt = `Search for learning resources about: ${query}
    
Preferences: ${preferences.join(', ')}

Find high-quality courses, articles, videos, and books. Return only public, accessible resources.`;

    const response = await this.gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
        tools: [{ googleSearch: {} }]
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return groundingChunks.map((chunk: any) => ({
      title: chunk.web?.title || '',
      uri: chunk.web?.uri || ''
    })).filter(source => source.uri);
  }
}
```

### 6.5 Brave Search Tool

```typescript
// tools/braveSearchTool.ts
export class BraveSearchTool {
  private apiKey = process.env.BRAVE_SEARCH_API_KEY;
  private baseUrl = 'https://api.search.brave.com/res/v1/web/search';

  async search(query: string, count: number = 10): Promise<LearningResource[]> {
    if (!this.apiKey) {
      console.warn('Brave Search API key not configured, skipping');
      return [];
    }

    const params = new URLSearchParams({
      q: query + ' course OR tutorial OR book',
      count: count.toString()
    });

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': this.apiKey
      }
    });

    const data = await response.json();

    return data.web?.results?.map((result: any) => ({
      title: result.title,
      type: this.inferType(result.url, result.description),
      url: result.url,
      price: this.inferPrice(result.description),
      description: result.description,
      keywords: []
    })) || [];
  }

  private inferType(url: string, description: string): 'Course' | 'Article' | 'Video' | 'Book' {
    if (url.includes('youtube.com') || url.includes('vimeo.com')) return 'Video';
    if (url.includes('udemy.com') || url.includes('coursera.org')) return 'Course';
    if (description.toLowerCase().includes('book')) return 'Book';
    return 'Article';
  }

  private inferPrice(description: string): string {
    if (description.toLowerCase().includes('free')) return 'Free';
    if (description.toLowerCase().match(/\$\d+/)) {
      const match = description.match(/\$\d+/);
      return match ? match[0] : 'Paid';
    }
    return 'Unknown';
  }
}
```

---

## 7. Technology Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React useState/useCallback
- **Build Tool:** Vite

### Backend
- **Runtime:** Node.js (Vercel Serverless Functions)
- **Agent Framework:** LangGraph (LangChain)
- **AI Service:** Google Gemini 2.5 Flash
- **TypeScript:** v5.8+

### External Services
- **Hosting:** Vercel
- **AI Provider:** Google Gemini API
- **Search APIs:**
  - Open Library API (free)
  - Microsoft Learn Catalog API (free)
  - Google Search (via Gemini, free tier available)
  - Brave Search API (free tier: 2000 queries/month)
  - Firecrawl API (optional, paid)
- **Data Storage:** n8n webhook → Google Sheets

### Development Tools
- **Version Control:** Git
- **Package Manager:** npm
- **Monitoring:** Vercel Analytics
- **Logging:** Console + Vercel Logs

---

## 8. Implementation Plan

### Phase 1: Foundation (Week 1-2)
**Goal:** Basic agentic workflow with 2 agents

**Tasks:**
1. Set up LangGraph framework
   - Install dependencies: `@langchain/langgraph`, `@langchain/core`
   - Create workflow state types
   - Build basic orchestrator

2. Implement Resource Discovery Agent
   - Build Open Library tool
   - Build Microsoft Learn tool
   - Integrate Google Search (existing)
   - Create agent logic to merge results

3. Implement URL Validation Agent
   - HTTP validation tool
   - Basic content validation
   - Filter invalid URLs

4. Update API route
   - Replace direct Gemini call with workflow
   - Add error handling
   - Maintain backward compatibility

**Deliverable:** MVP with verified URLs from multiple sources

### Phase 2: Enhancement (Week 3-4)
**Goal:** Complete 4-agent workflow with QA

**Tasks:**
1. Implement Content Generation Agent
   - Build prompt templates
   - Integrate with Gemini
   - Format response properly

2. Implement Quality Assurance Agent
   - Format validation
   - Final URL verification
   - Retry logic

3. Add Brave Search tool
   - API integration
   - Result parsing
   - Fallback logic

4. Add Firecrawl tool (optional)
   - API integration
   - Content extraction
   - Validation enhancement

**Deliverable:** Full agentic workflow with quality controls

### Phase 3: Optimization (Week 5-6)
**Goal:** Performance, reliability, and monitoring

**Tasks:**
1. Performance optimization
   - Parallel execution where possible
   - Caching frequently requested resources
   - Timeout handling

2. Enhanced error handling
   - Graceful degradation
   - Fallback to simpler workflow
   - User-friendly error messages

3. Monitoring and logging
   - Track agent execution times
   - Log resource discovery success rates
   - Monitor URL validation pass rates

4. Testing and refinement
   - Test with various user inputs
   - Validate across different countries
   - Refine relevance scoring

**Deliverable:** Production-ready system

---

## 9. Deployment Strategy

### Environment Variables

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key
BRAVE_SEARCH_API_KEY=your_brave_api_key # Optional
FIRECRAWL_API_KEY=your_firecrawl_api_key # Optional
N8N_WEBHOOK_URL=https://n8n.tools.getontop.com/webhook/...
```

### Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "pages/api/learning-drop.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "GEMINI_API_KEY": "@gemini-api-key",
    "BRAVE_SEARCH_API_KEY": "@brave-search-api-key",
    "FIRECRAWL_API_KEY": "@firecrawl-api-key",
    "N8N_WEBHOOK_URL": "@n8n-webhook-url"
  }
}
```

### Deployment Steps

1. **Development:**
   ```bash
   npm install
   npm run dev
   ```

2. **Testing:**
   ```bash
   npm run build
   npm run preview
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

---

## 10. Dependencies

```json
{
  "dependencies": {
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "@google/genai": "^1.20.0",
    "@langchain/langgraph": "^0.2.0",
    "@langchain/core": "^0.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

**New Dependencies to Add:**
- `@langchain/langgraph`: Agent orchestration framework
- `@langchain/core`: Core LangChain utilities
- `zod`: Schema validation for agent state

---

## 11. Success Criteria & Testing

### Functional Requirements
- ✅ System returns 4 learning resources (2 hard, 2 soft)
- ✅ All URLs are valid and accessible (>95% success rate)
- ✅ Resources match user preferences (format, price, skills)
- ✅ Response time < 10 seconds
- ✅ Stylized markdown output format
- ✅ Data sent to n8n webhook

### Non-Functional Requirements
- ✅ Works within Vercel serverless constraints (30s timeout)
- ✅ Graceful degradation on failures
- ✅ Cost per request < $0.10
- ✅ Mobile-responsive frontend
- ✅ Accessible UI (WCAG 2.1 AA)

### Test Cases

| Test Case | Input | Expected Output |
|-----------|-------|-----------------|
| Basic request | Hard skill: Python, Soft skill: Communication | 4 resources (2 Python, 2 Communication), all URLs valid |
| Free resources only | Price preference: Free | All 4 resources are free |
| Specific country | Country: Brazil | Resources available in Brazil |
| Video preference | Learning preference: Videos | At least 2 video resources |
| Edge case: niche skill | Hard skill: Rust programming | System finds resources or gracefully falls back |
| API failure | One API down | System uses other sources, still returns 4 resources |
| Timeout scenario | Slow network | System completes within 30s or returns partial results |

---

## 12. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Vercel timeout (30s limit) | High | Medium | Implement parallel execution, caching, early returns |
| API rate limits | Medium | Medium | Implement fallbacks, rotate between search APIs |
| Invalid URLs still slip through | High | Low | Multi-layer validation, QA agent, user feedback loop |
| LangGraph complexity | Medium | Low | Start simple, iterate; maintain fallback to direct Gemini |
| Cost overruns | Medium | Low | Monitor usage, implement caching, set budget alerts |
| Search API downtime | Medium | Medium | Use multiple search providers, graceful degradation |

---

## 13. Future Enhancements (Post-MVP)

### Phase 4: Intelligence (Month 2)
- User feedback collection and learning
- Resource quality scoring based on usage
- Personalization engine (user history)
- A/B testing framework

### Phase 5: Scale (Month 3)
- Caching layer (Vercel KV or Redis)
- Background resource discovery (cron jobs)
- Curated resource database (supplement searches)
- Multi-language support

### Phase 6: Advanced Features (Month 4+)
- Learning path tracking
- Progress monitoring integration
- Social features (share paths)
- Admin dashboard for managers

---

## 14. Open Questions

1. **Firecrawl Requirement:** Is Firecrawl API budget approved? (Optional for MVP)
2. **Brave Search:** Should we use free tier (2K/month) or paid?
3. **Response Streaming:** Should we stream results to user as agents complete?
4. **User Feedback:** How do we collect feedback on resource quality?
5. **Analytics:** What metrics should we track beyond URL validity?

---

## 15. Appendix

### A. API Endpoint Specification

**POST /api/learning-drop**

Request Body:
```typescript
{
  name: string;
  email: string;
  country: string;
  area: string;
  current_position: string;
  time_in_current_role: string;
  short_term_goals: string;
  long_term_goals: string;
  hard_skills: string;
  soft_skills: string;
  learning_preferences: string[];
  price_preference: 'Any' | 'Free' | 'Paid';
  time_available_per_week: string;
  additional_comments: string;
}
```

Response:
```typescript
{
  message: string; // Markdown formatted learning drop
  sources: Array<{
    title: string;
    uri: string;
  }>;
}
```

### B. Resource Schema

```typescript
interface LearningResource {
  title: string;
  type: 'Podcast' | 'Book' | 'Course' | 'Article' | 'Video';
  url: string;
  price: string;
  description: string;
  keywords: string[];
  source: 'open_library' | 'microsoft_learn' | 'google_search' | 'brave_search';
  validatedAt?: Date;
  relevanceScore?: number;
}
```

### C. References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Open Library Search API](https://openlibrary.org/dev/docs/api/search)
- [Microsoft Learn Catalog API](https://learn.microsoft.com/en-us/training/support/catalog-api)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Gemini API Documentation](https://ai.google.dev/docs)

---

**Document Status:** Ready for Review  
**Next Steps:** Team review → Approval → Begin Phase 1 implementation