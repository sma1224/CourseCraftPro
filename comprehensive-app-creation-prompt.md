# Course Creation Suite - Complete Application Recreation Prompt

## Project Overview
Build a comprehensive Course Creation Suite application - a professional SaaS web application that transforms how educators, trainers, and instructional designers create courses. The platform should guide users through the complete course development workflow from initial concept to detailed course outlines using AI assistance.

## Core Architecture Requirements

### Technology Stack
- **Frontend**: React 18 with TypeScript, Wouter routing, Vite build system
- **Backend**: Node.js with Express.js, TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Radix UI primitives with shadcn/ui components, Tailwind CSS
- **State Management**: TanStack Query v5 for server state
- **Authentication**: Replit Auth with OpenID Connect
- **AI Integration**: OpenAI GPT-4o API
- **Real-time**: WebSocket support for voice chat

### Project Structure
```
├── client/src/
│   ├── components/
│   │   ├── content/ (Content generation components)
│   │   ├── course/ (Course creation components)
│   │   ├── editor/ (Rich text editor)
│   │   ├── layout/ (Sidebar, navigation)
│   │   └── ui/ (shadcn/ui components)
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   └── App.tsx
├── server/
│   ├── services/
│   │   ├── openai.ts
│   │   ├── contentGenerator.ts
│   │   └── voiceChat.ts
│   ├── db.ts
│   ├── index.ts
│   ├── routes.ts
│   └── storage.ts
├── shared/
│   └── schema.ts
```

## Database Schema Requirements

### Core Tables
1. **Users Table**: Store user profiles from Replit Auth
2. **Projects Table**: Course project management with status tracking
3. **Course Outlines Table**: AI-generated course structures and content
4. **Module Content Table**: Detailed content for each course module
5. **Content Sessions Table**: Track content generation sessions
6. **Sessions Table**: Authentication session persistence

### Schema Implementation
- Use Drizzle ORM with PostgreSQL
- Create insert/select schemas with drizzle-zod
- Implement proper relations between tables
- Include timestamps for created/updated tracking

## Authentication System

### Features Required
- Replit Auth integration with OpenID Connect
- PostgreSQL-backed session storage using connect-pg-simple
- Complete user profile management with avatar support
- HTTP-only cookies and secure session management
- Protected routes with authentication middleware

### Implementation Details
- Use passport.js with OpenID Connect strategy
- Implement user upsert functionality
- Create authentication middleware for protected routes
- Handle session management and logout functionality

## AI Integration Requirements

### OpenAI Integration
- **Model**: GPT-4o for course generation
- **Token Limit**: 8000 tokens for detailed responses
- **Temperature**: 0.9 for creative technical content
- **Features**:
  - Course outline generation from natural language
  - Interactive clarification through follow-up questions
  - Section enhancement and refinement
  - Audio transcription for voice input
  - Real-time WebSocket voice chat

### Enhanced Prompts
- Demand deep subject matter expertise with specific technical details
- Require 5+ specific tools per lesson and 3+ real company examples per module
- Include industry-specific content with real frameworks and methodologies
- Add professional depth including certifications, job roles, career paths
- Include regulatory compliance, standards, and governance requirements

## User Interface Requirements

### Design System
- **Color Scheme**: Blue primary (#3B82F6), green secondary (#10B981), purple accent (#8B5CF6)
- **Components**: Professional shadcn/ui components with Radix UI primitives
- **Responsive**: Mobile-first design with adaptive layouts
- **Accessibility**: Full keyboard navigation and screen reader support
- **Theme**: Professional course creation focused design

### Core Pages
1. **Landing Page**: Welcome screen with authentication
2. **Dashboard**: Main hub showing recent projects and tools
3. **Course Generator**: AI-powered course outline creation
4. **Content Creator**: 6-step professional workflow system
5. **Outline Viewer**: Interactive course outline management
6. **Video Producer**: Video production tools (requires outline ID)
7. **Analytics**: Course performance and engagement metrics
8. **Assessment Builder**: Quiz and assessment creation tools
9. **Resource Manager**: File and resource management

## Professional Sidebar Navigation

### Structure
- **Collapsible sections** for each tool category
- **Recent projects** listed under each tool with:
  - Course title and description
  - Last updated timestamp
  - Status indicators
  - Three-dot dropdown menu with actions:
    - View Course
    - Open in [Tool Name]
    - Delete Course (with confirmation dialog)
- **User profile section** with avatar, name, email, logout

### Implementation Details
- Use Radix UI Collapsible for expandable sections
- Implement hover states and visual feedback
- Add proper loading states during operations
- Include delete confirmation with AlertDialog

## Content Creation Workflow

### 6-Step Professional Pipeline
1. **Course Outline**: Initial AI-generated structure
2. **Detail Development**: Smart Generator for comprehensive content
3. **Audio Scripts**: Script generation for voice content
4. **Slides/Recording**: Presentation material creation
5. **AI Voiceover**: Automated voice generation
6. **TV Voiceover**: Professional voice production

### Smart Generator Features
- **Interactive chat interface** for content customization
- **Multi-phase workflow**: Analysis → Requirements → Generation → Review
- **Requirements checklist** with priority-based selection
- **Comprehensive content generation** (3,000-5,000+ words)
- **Content types**: Theoretical foundations, practical examples, exercises, case studies, assessments

## Voice Chat Integration

### WebSocket Implementation
- Real-time voice chat with speech-to-text and text-to-speech
- Session management with user authentication
- Audio buffer handling and processing
- Conversation history tracking
- Course creation through voice commands

### Features
- Voice-to-text transcription using OpenAI Whisper
- Natural language course creation
- Interactive clarification conversations
- Real-time audio processing
- Session persistence across conversations

## Rich Text Editor

### Implementation
- **TipTap editor** with Google Docs-like experience
- **Extensions**: Color, font family, highlight, tables, task lists, text alignment
- **Features**: Typography, underline, table editing, task management
- **Integration**: Proper content display and editing capabilities
- **Export**: Markdown export functionality

## API Architecture

### RESTful Endpoints
- `GET /api/auth/user` - Get current user
- `POST /api/generate-outline` - Generate course outline
- `POST /api/enhance-outline` - Enhance outline sections
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/course-outlines/:id` - Get course outline
- `POST /api/generate-comprehensive-content` - Generate module content
- `POST /api/analyze-content-requirements` - Analyze content needs

### Features
- Comprehensive error handling with proper HTTP status codes
- Request validation using Zod schemas
- Authentication middleware for protected routes
- File upload support with Multer
- CORS configuration for cross-origin requests

## Advanced Features

### Export Capabilities
- Markdown export for course outlines
- PDF generation for professional documents
- JSON export for data portability
- Integration with external platforms

### Analytics Dashboard
- Course engagement metrics
- User activity tracking
- Performance analytics
- Progress visualization with Recharts

### Assessment Builder
- Quiz creation with multiple question types
- Automatic grading systems
- Performance tracking
- Integration with course content

## Development Setup

### Package Configuration
```json
{
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js",
    "db:push": "drizzle-kit push"
  }
}
```

### Essential Dependencies
- **React Ecosystem**: react, react-dom, react-hook-form, react-icons
- **UI Components**: All @radix-ui/react-* components, lucide-react icons
- **Styling**: tailwindcss, tailwindcss-animate, class-variance-authority
- **Backend**: express, drizzle-orm, @neondatabase/serverless
- **Authentication**: passport, passport-local, openid-client
- **AI Integration**: openai, ws (WebSocket)
- **Rich Text**: @tiptap/react, @tiptap/starter-kit, all tiptap extensions
- **Forms**: @hookform/resolvers, zod, zod-validation-error

## Quality Requirements

### Code Quality
- TypeScript strict mode throughout
- Proper error handling and validation
- Comprehensive type safety
- Clean component architecture
- Proper separation of concerns

### User Experience
- Responsive design for all screen sizes
- Loading states and skeleton components
- Proper error messages and user feedback
- Intuitive navigation and workflow
- Professional visual design

### Performance
- Optimized bundle sizes
- Efficient database queries
- Proper caching strategies
- Fast initial page loads
- Smooth user interactions

## Future Enhancements

### Planned Features
- Advanced video editing capabilities
- Collaborative course creation
- Integration with external LMS platforms
- Advanced analytics and reporting
- Mobile application development
- Multi-language support
- Advanced assessment types
- Community features and sharing

### Scalability Considerations
- Modular architecture for easy feature additions
- Database optimization for large datasets
- CDN integration for static assets
- Caching strategies for improved performance
- Microservices architecture preparation

## Implementation Priority

### Phase 1: Core Foundation
1. Database schema and authentication
2. Basic UI components and layout
3. Course generation with AI
4. Project management system

### Phase 2: Advanced Features
1. Smart content generator
2. Rich text editor integration
3. Voice chat implementation
4. Professional workflow system

### Phase 3: Production Features
1. Export capabilities
2. Analytics dashboard
3. Assessment builder
4. Advanced user management

### Phase 4: Enhancement
1. Video production tools
2. Advanced collaboration features
3. External integrations
4. Performance optimizations

## Success Criteria

### Technical Success
- All features implemented and functional
- Proper error handling and user feedback
- Responsive design across all devices
- Secure authentication and data protection
- Efficient performance and loading times

### User Experience Success
- Intuitive course creation workflow
- Professional-quality generated content
- Seamless integration between features
- Comprehensive project management
- Effective AI assistance throughout

### Business Success
- Scalable architecture for growth
- Professional design and branding
- Comprehensive feature set
- Efficient development workflow
- Maintainable codebase

## Technical Notes

### Important Implementation Details
- Use Replit Auth for authentication (not custom auth)
- Implement proper session management with PostgreSQL
- Use Drizzle ORM for all database operations
- Follow React best practices with hooks and functional components
- Implement proper error boundaries and loading states
- Use TanStack Query for all API calls
- Implement proper TypeScript types throughout
- Use Radix UI components with shadcn/ui styling
- Implement proper accessibility features
- Use proper SEO optimization techniques

### Development Guidelines
- Follow the existing file structure and naming conventions
- Implement proper component composition
- Use proper state management patterns
- Follow React Query best practices
- Implement proper form validation
- Use proper error handling patterns
- Follow TypeScript best practices
- Implement proper testing strategies
- Use proper deployment configurations
- Follow security best practices

This comprehensive prompt should enable recreation of the entire Course Creation Suite application with all its existing features and planned enhancements. The application represents a professional-grade SaaS platform for AI-powered course development with modern web technologies and best practices.