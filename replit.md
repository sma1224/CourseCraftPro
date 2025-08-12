# Course Creation Suite - AI-Powered Course Development Platform

## Overview

Course Creation Suite is a comprehensive SaaS web application that transforms how educators, trainers, and instructional designers create courses. The platform guides users through the complete course development workflow: from initial concept to detailed course outlines using AI assistance. Built with modern web technologies, it provides an intuitive interface for creating professional course content efficiently.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with custom Tailwind CSS styling
- **Design System**: shadcn/ui component library with "new-york" style
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Build Tool**: Vite with React plugin

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple

### Monorepo Structure
- **client/**: React frontend application
- **server/**: Express.js backend API
- **shared/**: Shared TypeScript schemas and types

## Key Components

### Authentication System
- **Provider**: Replit Auth using OpenID Connect flow
- **Session Storage**: PostgreSQL-backed sessions for persistent authentication
- **User Management**: Complete user profile management with avatar support
- **Security**: HTTP-only cookies, secure session management

### Database Schema
- **Users Table**: Stores user profiles from Replit Auth
- **Projects Table**: Course project management with status tracking
- **Course Outlines Table**: AI-generated course structures and content
- **Sessions Table**: Authentication session persistence

### AI Integration
- **Provider**: OpenAI GPT-4o for course generation
- **Features**: 
  - Course outline generation from natural language prompts
  - Interactive clarification through follow-up questions
  - Section enhancement and refinement
  - Audio transcription for voice input support

### User Interface Design
- **Theme**: Professional course creation focused design
- **Color Scheme**: Blue primary (#3B82F6), green secondary (#10B981), purple accent (#8B5CF6)
- **Components**: Comprehensive UI component library based on Radix UI
- **Responsive**: Mobile-first design with adaptive layouts
- **Accessibility**: Full keyboard navigation and screen reader support

## Data Flow

### Course Creation Workflow
1. **Initial Input**: User provides course concept in natural language
2. **AI Analysis**: System analyzes prompt and identifies missing information
3. **Interactive Clarification**: AI asks follow-up questions via chat or voice
4. **Information Gathering**: System collects comprehensive course requirements
5. **Outline Generation**: AI creates detailed course structure with modules, lessons, and activities
6. **Review & Refinement**: User can edit, regenerate sections, or request modifications
7. **Project Storage**: Generated outlines are saved as course projects

### API Architecture
- **RESTful Design**: Standard HTTP methods for resource management
- **Authentication Middleware**: Protected routes requiring valid sessions
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **File Upload**: Multer integration for audio file processing
- **Request Validation**: Zod schema validation for all API inputs

## External Dependencies

### Core Technologies
- **React Ecosystem**: React, React DOM, React Query
- **UI Framework**: Radix UI component primitives
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Database**: Drizzle ORM, Neon Database serverless driver
- **Authentication**: Passport.js with OpenID Connect strategy
- **File Processing**: Multer for multipart form handling

### Development Tools
- **Build System**: Vite with TypeScript support
- **Code Quality**: TypeScript strict mode, ESLint configuration
- **Development**: Hot module replacement, runtime error overlay
- **Deployment**: ESBuild for production bundling

### AI and Audio
- **OpenAI API**: GPT-4o model for course generation
- **Audio Processing**: Support for voice input transcription
- **Real-time Features**: WebSocket support for interactive conversations

## Deployment Strategy

### Production Build
- **Frontend**: Vite production build with optimized assets
- **Backend**: ESBuild bundling for Node.js deployment
- **Static Assets**: Served from dist/public directory
- **Environment**: Production mode with optimized configurations

### Database Management
- **Migrations**: Drizzle Kit for schema migrations
- **Connection**: Connection pooling with Neon serverless
- **Schema Sync**: Push-based schema updates for development

### Environment Configuration
- **Database**: DATABASE_URL for PostgreSQL connection
- **Authentication**: Replit-specific OIDC configuration
- **AI Services**: OpenAI API key configuration
- **Sessions**: Secure session secret management

## Changelog

- June 30, 2025: Initial setup and complete implementation
  - Built comprehensive Course Creation Suite with AI integration
  - Implemented Replit Auth with user management
  - Created AI course generator with OpenAI GPT-4o integration
  - Added voice input transcription capabilities
  - Built interactive course outline viewer with module navigation
  - Implemented project management with PostgreSQL storage
  - Deployed responsive UI with professional design
  - Successfully tested with user authentication and course generation
  - Added comprehensive save/retrieve functionality for course outlines
  - Implemented advanced editing capabilities with module/lesson management
  - Added AI-powered editing prompts for intelligent outline enhancement
  - Integrated OpenAI Live API for natural voice conversations
  - Built real-time WebSocket voice chat with speech-to-text and text-to-speech

- January 1, 2025: Fixed outline history and authentication issues
  - Fixed critical issue where course outlines weren't appearing in user's project history
  - Removed duplicate `/api/generate-outline` endpoint that was only generating outlines without saving projects
  - Fixed voice chat to use authenticated user ID instead of creating anonymous users
  - Unified course generation workflow to save both text and voice-based projects automatically
  - Added WebSocket authentication for voice chat sessions
  - Both text-based and voice-based course outlines now appear in Recent Projects list
  - Course creation workflow now properly authenticated and saves to database consistently

- January 1, 2025: Implemented Interactive Content Generator with Depth Analysis
  - Created comprehensive Smart Generator system for detailed content creation
  - Added interactive chat interface for content depth analysis and customization
  - Implemented multi-phase workflow: Analysis → Requirements → Generation → Review
  - Built requirements checklist system with priority-based content selection
  - Created comprehensive content generation producing 3,000-5,000+ word educational material
  - Added intelligent chat responses for depth, examples, industry focus, and assessments
  - Integrated progress tracking and real-time feedback during content generation
  - Content includes: Theoretical Foundations, Practical Examples, Interactive Exercises, Case Studies, Assessments
  - Smart Generator accessible via blue-purple gradient buttons on all modules in Content Creator
  - Replaces brief, generic content with professional, comprehensive educational material

- January 1, 2025: Enhanced Content Generation with Textbook-Style Output
  - Modified LLM prompts to generate comprehensive textbook-style explanations instead of bullet points
  - Updated system prompts to require 800-1200 words per lesson with detailed narrative explanations
  - Enhanced content generation to produce full paragraphs with embedded examples
  - Increased token limits to 8000 tokens to accommodate longer educational content
  - Added proper scrolling capabilities to Content Review & Finalization screen
  - Fixed content display logic to handle both string and object content formats
  - Improved rich text editor integration with proper scrolling in content viewer dialogs
  - Content now generates as publication-ready educational material with academic depth

- January 1, 2025: Fixed Content Formatting and Detail Level Controls
  - Enhanced content generation prompts to enforce proper markdown formatting with headers and line breaks
  - Fixed content detail level controls to generate appropriate word counts (brief: 300-500, quick: 500-800, detailed: 800-1200, comprehensive: 1200+)
  - Updated system prompts to require proper paragraph structure with 80-150 words per paragraph
  - Improved content generation to include proper section headers (##, ###) and blank lines between sections
  - Increased token limits to 6000 tokens to accommodate longer, more detailed content
  - Enhanced content structure requirements to ensure professional courseware formatting
  - Fixed TipTap rich text editor import issues for proper Google Docs-like editing experience

- January 1, 2025: Implemented 6-Step Professional Course Development Workflow
  - Restructured Content Creator interface to match professional course development pipeline
  - Added comprehensive 6-tab workflow system: Course Outline → Detail Development → Audio Scripts → Slides/Recording → AI Voiceover → TV Voiceover
  - Integrated visual workflow progress indicator showing current step and completion status
  - Fixed content display issue where JSON content wasn't rendering in RichTextEditor by adding extractContentForDisplay function
  - Enhanced tab navigation with smaller, more compact design to accommodate 6 workflow steps
  - Added detailed feature descriptions and "Coming Soon" indicators for future workflow steps
  - Maintained existing Smart Generator functionality while expanding into complete production workflow
  - Aligned application architecture with professional course creation industry standards

- January 1, 2025: Integrated Video Producer as Standalone Application
  - Created independent Video Producer page accessible via `/video-producer/:outlineId` route
  - Added Video Producer buttons to Dashboard and Outline Viewer for seamless navigation
  - Integrated Video Producer into existing course creation workflow as part of 6-step process
  - Maintained modular architecture where Video Producer functions as independent app within framework
  - Enhanced user experience with direct access to video production tools from any course project
  - Preserved existing functionality while expanding production capabilities
  - Removed Video Producer from sidebar navigation to prevent 404 errors since it requires outline ID parameter
  - Video Producer now only accessible through project-specific buttons ensuring proper functionality

- July 15, 2025: Completely Overhauled OpenAI Course Generation Prompts for Expert-Level Content
  - Rewrote system prompts to demand deep subject matter expertise with specific technical details
  - Enhanced user prompts with mandatory requirements for industry-specific content
  - Increased token limit from 4000 to 8000 to accommodate more detailed responses
  - Added requirements for specific tools, frameworks, technologies, and methodologies by name
  - Implemented demands for real company examples, case studies, and industry scenarios
  - Added professional depth requirements including certifications, job roles, and career paths
  - Included regulatory compliance, standards, and governance framework requirements
  - Enhanced quality benchmarks requiring 5+ specific tools per lesson and 3+ company examples per module
  - Adjusted temperature to 0.9 for more creative and detailed technical content generation
  - Course outlines now generate with authentic professional-level content instead of generic templates

- August 12, 2025: Fixed Critical Outline Editor Issues and Completed Save Functionality
  - Resolved outline editor blank page crashes caused by undefined property access
  - Added missing PATCH endpoint `/api/course-outlines/:id` for direct outline updates with proper authentication
  - Fixed API request parameter ordering in apiRequest function calls
  - Added missing `isSaving` prop to OutlineViewerModal component
  - Implemented comprehensive error handling and safety checks for undefined outline data
  - Enhanced user experience with proper authentication verification and ownership checks
  - Outline editing now works seamlessly: users can edit course details, add modules, modify lessons, and save changes
  - Both dashboard and sidebar delete functionality confirmed working with three-dot menus and confirmation dialogs
  - Course creation and editing workflow now fully functional end-to-end

## User Preferences

Preferred communication style: Simple, everyday language.