# MockPro - AI-Powered Mock Interview Platform

## Overview

MockPro is a full-stack web application that provides AI-powered virtual mock interview practice for students and freshers. The platform offers a comprehensive interview experience with coding challenges, voice-based HR questions, and detailed result analysis.

## User Preferences

Preferred communication style: Simple, everyday language.
UI Design Preferences: Modern, vibrant tech palette with light gray background (#f9fafb), white cards, accent blue (#2563eb), success green (#22c55e), Inter font, rounded corners (12px-16px), soft shadows, smooth hover effects with 1.05 scale.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Schema Management**: Drizzle Kit for migrations and schema management

### Component Structure
- **Single Page Application**: Home page with multiple interactive sections
- **Modular Components**: Separate components for Hero, Coding Round, Voice Round, and Result Scorecard
- **Responsive Design**: Mobile-first approach with breakpoint-based layouts

## Key Components

### 1. Interview Session Management
- **Session Creation**: Creates interview sessions with unique IDs
- **Session Tracking**: Monitors progress through coding and voice rounds
- **Score Calculation**: Aggregates scores from both rounds for final evaluation

### 2. Coding Round
- **Code Editor**: Placeholder for Monaco/CodeMirror integration with modern dark theme
- **Test Execution**: Simulated code execution with pass/fail verdicts
- **Test Cases**: Multiple test case validation with detailed feedback
- **Real-time Results**: Immediate feedback on code execution

### 3. Voice Round
- **Audio Recording**: Browser-based microphone access for voice capture
- **Speech Processing**: Audio transcription and AI analysis
- **Feedback Generation**: AI-powered evaluation of spoken responses
- **File Upload**: Alternative audio file upload option

### 4. One-on-One Live Interview Mode
- **Question System**: 8 realistic HR interview questions with progression tracking
- **Interactive Interface**: Simulated interviewer-candidate conversation layout
- **Progress Visualization**: Real-time progress bar with percentage completion
- **Response Area**: Dedicated space for candidate response preparation

### 5. Result System
- **Score Aggregation**: Combines coding and voice scores (out of 100)
- **Report Generation**: Downloadable JSON reports with detailed analysis
- **Progress Tracking**: Real-time updates of interview completion status

## Data Flow

### 1. Session Initialization
1. User clicks "Start Mock Interview"
2. System creates new interview session via POST `/api/interview-sessions`
3. Session ID is stored in frontend state for subsequent requests

### 2. Coding Round Flow
1. User writes code in editor and provides test input
2. Code submission via POST `/api/run-code` with session ID
3. Backend simulates code execution and returns verdict
4. Results stored in `coding_results` table linked to session

### 3. Voice Round Flow
1. User records audio or uploads file
2. Audio processing via POST `/api/analyze-voice` with session ID
3. AI analysis generates transcript and feedback
4. Results stored in `voice_results` table linked to session

### 4. Result Compilation
1. System aggregates scores from both rounds
2. Final score calculation via POST `/api/calculate-score/{sessionId}`
3. Report generation via GET `/api/download-report/{sessionId}`
4. Session status updated to "completed"

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessible components
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation
- **Icons**: Lucide React for consistent iconography
- **Animations**: Framer Motion via class-variance-authority
- **Typography**: Inter font loaded via Google Fonts for modern appearance

### Backend Dependencies
- **Database**: Neon PostgreSQL serverless database
- **ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod for runtime type validation
- **Session Management**: Express session with PostgreSQL store

### Development Tools
- **Build System**: Vite with React plugin
- **Development**: tsx for TypeScript execution
- **Database Tools**: Drizzle Kit for schema management
- **Code Quality**: TypeScript strict mode enabled

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Database Setup**: Drizzle migrations applied via `db:push`

### Environment Configuration
- **Database**: Requires `DATABASE_URL` environment variable
- **Development**: Uses tsx for hot reloading
- **Production**: Node.js serves bundled application

### File Structure
- **Client**: React application in `client/` directory
- **Server**: Express backend in `server/` directory
- **Shared**: Common schemas and types in `shared/` directory
- **Database**: Schema definitions and migrations

### Development vs Production
- **Development**: Vite dev server with HMR and error overlay
- **Production**: Static file serving with Express fallback
- **Database**: PostgreSQL with connection pooling via Neon

The application follows a monorepo structure with clear separation between frontend, backend, and shared code, enabling efficient development and deployment workflows.

## Recent Changes (January 2025)

### UI/UX Enhancements
- **Modern Color Palette**: Implemented vibrant tech color scheme with #2563eb (blue) and #22c55e (green) accents
- **Typography**: Upgraded to Inter font for clean, modern appearance
- **Layout Improvements**: Enhanced spacing, larger headings, improved button sizing
- **Visual Effects**: Added smooth hover animations with 1.05 scale transform and enhanced shadows
- **Component Styling**: Unified design system with consistent rounded corners (12px-16px)
- **Background Design**: Light gray background (#f9fafb) with white card containers

### New Features
- **Live Interview Mode**: Added One-on-One Live Interview section with 8 sample questions
- **Progress Tracking**: Real-time progress visualization with gradient progress bars
- **Enhanced Interactivity**: Improved button states, form inputs, and user feedback

### Technical Improvements
- **CSS Architecture**: Implemented utility classes for consistent styling
- **TypeScript Fixes**: Resolved storage layer type compatibility issues
- **Component Structure**: Standardized component layouts and spacing