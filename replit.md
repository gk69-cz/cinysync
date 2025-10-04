# CineSync

## Overview

CineSync is a premium real-time collaborative streaming platform that enables users to watch movies together from Netflix, Amazon Prime Video, and Disney+ in perfect synchronization across any device. The application combines Discord-inspired social engagement patterns with Google Meet's professional video conferencing UI to create a cinematic streaming experience with real-time chat, video presence, and cross-platform screen sharing capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool, featuring client-side routing via Wouter.

**UI Component System**: Built on shadcn/ui components with Radix UI primitives, providing a comprehensive design system with 40+ pre-built components (dialogs, dropdowns, forms, navigation, etc.). The design follows a "New York" style with dark mode as the primary theme.

**Styling**: Tailwind CSS with a custom design system implementing a cinematic dark theme with HSL color variables for theming flexibility. The color palette features rich dark backgrounds (base: 15 5% 6%), magenta primary accents (338 100% 65%), and cyan secondary accents (186 100% 50%).

**Typography**: Dual font system using Poppins for display/headings and Inter for body/interface text, with defined type scales from micro to hero sizes.

**State Management**: TanStack Query (React Query) for server state management with custom query client configuration. Context API for authentication state via AuthContext and theme management via ThemeProvider.

**Authentication Flow**: Firebase Authentication integration supporting email/password, Google OAuth, and user profile management. Protected routes wrap authenticated pages and redirect unauthenticated users to login.

**Component Structure**: 
- Pages: Landing, Login, Register, Dashboard, Room, NotFound
- Feature Components: ChatMessage, VideoTile, RoomCard, CreateRoomDialog, FeatureCard
- Layout Components: Navbar, HeroSection, Sidebar
- Utility Components: ThemeToggle, ProtectedRoute

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js, serving both API endpoints and static frontend assets in production.

**Development Setup**: Vite middleware integration for hot module replacement during development, with custom logging middleware tracking API request duration and responses.

**Storage Layer**: In-memory storage implementation (MemStorage class) serving as a temporary data store, designed to be replaced with a persistent database solution. The interface defines CRUD operations for user management.

**API Structure**: RESTful API with `/api` prefix for all application routes. Currently includes placeholder route registration awaiting feature implementation.

**Session Management**: Express session middleware with connect-pg-simple for PostgreSQL-backed session storage (configured but not yet implemented).

### Database Schema

**ORM**: Drizzle ORM with PostgreSQL dialect configured for type-safe database operations.

**Schema Definition**: 
- Users table with UUID primary keys, unique usernames, and password storage
- Zod schema validation for insert operations ensuring type safety at runtime

**Migration Strategy**: Schema changes tracked in `/migrations` directory with drizzle-kit for database synchronization via `db:push` command.

### Real-time Communication Architecture

**Video Presence**: WebRTC implementation planned for peer-to-peer video streaming with participant video tiles showing avatars, mute status, and screen sharing indicators.

**Screen Sharing**: Cross-platform WebRTC-based screen sharing designed to work seamlessly across desktop, tablet, and mobile browsers.

**Chat System**: Real-time messaging with timestamp display, user avatars, and message grouping. Built to support typing indicators and emoji reactions.

**Synchronization**: Planned playback synchronization engine to maintain perfect timing across all participants watching streaming content.

## External Dependencies

### Firebase Services
- **Firebase Authentication**: User authentication with email/password and Google OAuth provider support
- **Firebase Firestore/Realtime Database**: Planned for persistent data storage of rooms, messages, and user data
- **Firebase Storage**: Configured for avatar and asset storage

### Database
- **Neon Database**: PostgreSQL database using @neondatabase/serverless driver for serverless-optimized connections
- **Drizzle ORM**: Type-safe ORM for schema definition, migrations, and query building

### UI Component Libraries
- **Radix UI**: Headless UI primitives for 25+ component types (Dialog, Dropdown, Popover, Tooltip, etc.)
- **shadcn/ui**: Pre-styled component library built on Radix UI with Tailwind CSS
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Carousel/slider functionality

### Streaming Platform Integration
- **Netflix, Prime Video, Disney+**: Planned OAuth integration and embedded playback session management for synchronized viewing

### Form Management
- **React Hook Form**: Form state management with validation
- **Zod**: Schema validation library integrated with Drizzle for runtime type checking
- **@hookform/resolvers**: Zod resolver for React Hook Form integration

### Development Tools
- **Vite**: Fast build tool with HMR, configured with React plugin and Replit-specific plugins (runtime error overlay, cartographer, dev banner)
- **TypeScript**: Type safety across frontend and backend with strict mode enabled
- **ESBuild**: Production build bundling for server code

### Styling and Animation
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Framer Motion**: Animation library for smooth transitions and interactions (referenced in design guidelines)
- **class-variance-authority**: Type-safe variant management for component styling
- **clsx & tailwind-merge**: Conditional class name utilities

### Additional Libraries
- **date-fns**: Date manipulation and formatting
- **cmdk**: Command menu component (Command+K interface)
- **react-icons**: Additional icon library (Google icon for OAuth button)
- **nanoid**: Unique ID generation for client-side operations