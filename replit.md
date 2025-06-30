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

- June 30, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.