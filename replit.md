# Griddl - Mobile Word/Color Puzzle Game

## Overview

Griddl is a mobile-first Mastermind-style color-guessing puzzle game built with React Native (Expo) and an Express backend. Players guess a secret sequence of colored pegs, receiving feedback on correct colors and positions after each attempt. The game features four difficulty levels (Easy, Medium, Hard, Extreme), three game modes (Daily Challenge, Endless, Time Attack), a progression system with streaks, coins, hints, and streak shields, and a coin shop for purchasing consumables, unlocks, and cosmetics. All game state is persisted locally via AsyncStorage.

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
- **UI Components**: Custom components for ColorPeg (with glossy gradient effect), FeedbackPins (animated reveal), GuessRowView, Toast notifications, Confetti particles, HomeScreen, GameScreen, ResultScreen, ShopScreen

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
- **Difficulty configs** defined in `constants/game.ts` control code length (4-7 pegs), max attempts (4-8), available colors (6), hint tokens, and fake feedback (Extreme mode only)
- **Difficulties**: Easy (4 pegs/8 attempts/1 hint), Medium (5/6), Hard (6/5), Extreme (7/4 + 1 fake feedback pin, locked by default - purchasable in shop)
- **Feedback algorithm**: Two-pass Mastermind evaluation - Pass 1 marks exact matches, Pass 2 marks misplaced colors without double-counting. Returns per-position green/yellow/grey array.
- **Game modes**: Daily Challenge (Medium default, Hard unlockable at streak 10, auto-starts), Endless Mode (training/practice, auto-levels every 3 wins), Time Attack (60s timer, +8s per win, board auto-clears after each solve)
- **Reward system**: Coins (8 + streak×2, capped at 30), streak milestones (3: +15 coins, 5: hint token, 7: gold pegs, 10: shield + daily Hard unlock, 15: obsidian background theme). Streaks require consecutive-day play.
- **Hidden difficulty reduction**: After 3 consecutive losses (2 for Time Attack), next game drops one difficulty level
- **Streak Shield**: Protects one loss from breaking the streak
- **Near-miss feedback**: "So close!" when 1 peg away, "Almost there!" when 2 away with yellows
- **Last attempt pulse**: Red border pulse animation on the final attempt row
- **Daily Challenge**: One play per day, seeded by date. Medium by default. Hard mode unlocked at streak 10 milestone with discrete inline toggle (dailyHardUnlocked saved in AsyncStorage)
- **Coin Shop**: Accessible from home screen. Consumables (Hint Token 30c, Streak Shield 40c — blocks duplicate purchase), Unlocks (Extreme Mode 250c), Pin Styles (Neon Glow 120c with glow effect on guess pegs, Crystal 180c with shimmer on guess pegs), Backgrounds (10 gradient backgrounds: Default free, Midnight 80c, Ocean 80c, Nebula 100c, Ember 80c, Aurora 120c, Marble 150c, Bauhaus 150c, Neon City 150c, Void 200c, Obsidian via streak 15). Background system uses LinearGradient with multi-stop gradients defined in `constants/backgrounds.ts`. Purchase confirmation dialog on all buys. Owned cosmetics can be equipped/swapped.
- **Share Format**: Shows actual colored peg emojis (🔴🔵🟡🟢🟣🟠) for each guess row, not feedback squares - distinct from Wordle sharing
- **Ads**: Interstitial ads shown before game launch (Daily Challenge tap, difficulty button tap). Rewarded ad button on result screen (+3 coins). No banner ads. `adsRemoved` boolean (default false, saved to AsyncStorage) skips interstitials but keeps rewarded button. Ad Unit IDs: App ID `ca-app-pub-1857750915324923~5996117307`, interstitial `ca-app-pub-1857750915324923/3325721935`, rewarded `ca-app-pub-1857750915324923/6239659881`. Currently simulated via AdOverlay component for Expo Go compatibility.
- **Toggle deselection**: Tapping an already-selected game mode (Endless/Time Attack) deselects it, hiding the difficulty grid

### How to Play Modal
- `components/HowToPlayModal.tsx`: 4-step modal tutorial (Goal → Placing Pegs → Feedback Pins → Extreme Mode) with step dot indicators, Next/Got it! navigation, and ✕ close button.
- First-launch auto-show: HomeScreen reads `'hasSeenTutorial'` from AsyncStorage on mount. If not set, opens modal automatically. Closing writes `'true'` to prevent future auto-shows.
- Persistent `?` help button in HomeScreen statsRow opens the modal at any time regardless of tutorial state.

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
- **expo-linear-gradient**: Gradient effects for color pegs and background themes
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