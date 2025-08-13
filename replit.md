# Course Creation Suite - AI-Powered Course Development Platform

## Overview
Course Creation Suite is a comprehensive SaaS web application designed to revolutionize course development for educators, trainers, and instructional designers. It guides users from initial concept to detailed course outlines using AI assistance, providing an intuitive interface for efficient creation of professional course content. The platform aims to streamline the entire course development workflow, leveraging AI for outline generation, content refinement, and interactive clarification, ultimately delivering high-quality educational materials.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The Course Creation Suite is built as a monorepo, separating frontend, backend, and shared components.
- **Frontend**: Utilizes React 18 with TypeScript, Wouter for routing, Radix UI and shadcn/ui for components styled with Tailwind CSS, and TanStack Query for state management. Vite is used for building.
- **Backend**: Powered by Node.js with Express.js, TypeScript, and ES modules. It uses PostgreSQL (hosted on Neon Database) with Drizzle ORM for data persistence. Authentication is handled via Replit Auth (OpenID Connect) with PostgreSQL-backed sessions.
- **Monorepo Structure**: `client/` for the React app, `server/` for the Express API, and `shared/` for common TypeScript schemas and types.
- **Key Features**:
    - **Authentication**: Secure user management via Replit Auth, persistent sessions, and user profiles.
    - **Database Schema**: Includes tables for Users, Projects, Course Outlines, and Sessions, supporting the core functionalities.
    - **AI Integration**: Leverages OpenAI GPT-4o for natural language course outline generation, interactive clarification, section enhancement, and audio transcription for voice input. Content generation is now lesson-based, allowing for granular control and detailed educational material (800-1200 words per lesson) with a focus on deep subject matter expertise and industry relevance.
    - **User Interface**: Features a professional design with a specific color scheme (blue, green, purple accents), built with Radix UI components, ensuring responsiveness, mobile-first design, and accessibility.
    - **Data Flow**: The course creation workflow is an interactive process: User input leads to AI analysis, interactive clarification, comprehensive information gathering, AI-driven outline generation, user review/refinement, and project storage. API architecture is RESTful with authentication middleware, error handling, file upload (Multer), and Zod validation.
    - **Content Generation Workflow**: Restructured into a 6-step professional development pipeline: Course Outline, Detail Development, Audio Scripts, Slides/Recording, AI Voiceover, and TV Voiceover, with granular, lesson-level content generation.

## External Dependencies
- **Frontend**: React, React DOM, React Query, Radix UI, Tailwind CSS.
- **Backend**: Node.js, Express.js, PostgreSQL (Neon Database), Drizzle ORM, Passport.js, Multer.
- **AI/Audio**: OpenAI API (GPT-4o), support for voice input transcription, WebSocket for interactive conversations.
- **Development/Deployment**: Vite, TypeScript, ESLint, ESBuild.