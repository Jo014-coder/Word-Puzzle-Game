# Griddl - Mobile Word/Color Puzzle Game

## Overview

Griddl is a mobile-first Mastermind-style color-guessing puzzle game built with React Native (Expo) and an Express backend. Players guess a secret sequence of colored pegs, receiving feedback on correct colors and positions after each attempt. The game features three difficulty levels (Easy, Medium, Hard), three game modes (Daily Challenge, Endless, Time Attack), and a progression system with streaks, coins, hints, and streak shields. All game state is persisted locally via AsyncStorage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React Native / Expo)
- **Framework**: Expo SDK 54 with React Native 0.81, using the new architecture
- **Routing**: expo-router with file-based routing (`app/` directory). Currently a single-screen app with internal screen state management (home → game → result) handled by `GameContext`
- **State Management**: React Context (`GameContext`) manages all game logic including code generation, guess evaluation, scoring, streaks, coins, hints, and screen transitions. No Redux or external state library.
- **Animations**: react-native-reanimated for smooth animations (confetti, peg reveals, shake effects, shimmer title, toast notifications)
- **Data Persistence**: AsyncStorage for saving streak, coins, hint tokens, streak shields, and other progression data locally on device
- **Data Fetching**: TanStack React Query with a custom API client (`lib/query-client.ts`) configured for the Express backend, though the game currently runs most logic client-side
- **Fonts**: Inter font family (Regular, SemiBold, Bold) loaded via @expo-google-fonts
- **UI Components**: Custom components for ColorPeg (with glossy gradient effect), FeedbackPins (animated reveal), GuessRowView, Toast notifications, Confetti particles, HomeScreen, GameScreen, ResultScreen

### Backend (Express)
- **Runtime**: Node.js with Express 5
- **Purpose**: Serves as API server and static file host for production builds. Currently has minimal routes (just the user CRUD scaffold)
- **CORS**: Dynamic CORS configuration supporting Replit dev/deployment domains and localhost
- **Storage**: In-memory storage (`MemStorage`) class implementing `IStorage` interface for user management. Designed to be swapped with database-backed storage.

### Database
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema**: Located in `shared/schema.ts` - currently has a `users` table with id, username, password
- **Migrations**: Drizzle Kit configured to output to `./migrations` directory
- **Validation**: drizzle-zod for generating Zod schemas from Drizzle table definitions
- **Note**: The database is provisioned but minimally used - game state is primarily client-side via AsyncStorage

### Game Architecture
- **Difficulty configs** defined in `constants/game.ts` control code length (4-6 pegs), max attempts (5-8), available colors (6), hint tokens, and fake feedback (Hard mode)
- **Feedback algorithm**: Two-pass Mastermind evaluation - Pass 1 marks exact matches, Pass 2 marks misplaced colors without double-counting
- **Game modes**: Daily Challenge (seeded by date), Endless Mode (continuous play), Time Attack (timed solving)
- **Reward system**: Coins earned on wins (20 + streak multiplier), streak tracking, streak shields, hint tokens, unlockable gold pegs and obsidian theme

### Build & Deploy
- **Development**: Two processes - `expo:dev` for the mobile client, `server:dev` for the Express backend
- **Production build**: `expo:static:build` creates a static web bundle, `server:build` bundles the server with esbuild, `server:prod` serves everything
- **Proxy**: In development, http-proxy-middleware proxies between Expo and Express

## External Dependencies

### Core
- **Expo SDK 54**: Mobile app framework with managed workflow
- **React Native 0.81**: Cross-platform UI framework
- **Express 5**: HTTP server for API and static serving
- **PostgreSQL**: Database (via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database toolkit

### Key Libraries
- **react-native-reanimated**: High-performance animations
- **react-native-gesture-handler**: Touch gesture handling
- **expo-haptics**: Haptic feedback on interactions
- **expo-image-picker**: Image selection capability
- **expo-linear-gradient**: Gradient effects for color pegs
- **@tanstack/react-query**: Server state management
- **AsyncStorage**: Local data persistence
- **expo-router**: File-based navigation
- **patch-package**: Used for patching dependencies (runs on postinstall)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for server)
- `REPLIT_DEV_DOMAIN`: Used for Expo packager proxy and CORS in development
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests from the client
- `REPLIT_DOMAINS`: Comma-separated deployment domains for CORS
- `REPLIT_INTERNAL_APP_DOMAIN`: Used during production builds