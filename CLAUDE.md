# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users chat with an AI assistant that generates React components displayed in real-time in an iframe sandbox. The app uses a virtual file system (no disk writes) with optional project persistence for authenticated users.

## Development Commands

```bash
# Install dependencies and setup database
npm run setup

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Run test suite (Vitest)
npm test

# Lint code
npm lint

# Database operations
npx prisma generate          # Generate Prisma client after schema changes
npx prisma migrate dev       # Create and apply migrations
npm run db:reset             # Reset database (destructive)
```

### Running Individual Tests

```bash
# Run specific test file
npm test src/lib/__tests__/file-system.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## Architecture

### Core System: Virtual File System

The heart of the app is `VirtualFileSystem` (src/lib/file-system.ts), an in-memory file system that manages React component files without touching disk. Key operations:
- Stores files in a Map with path normalization
- Supports create, read, update, delete, rename operations
- Serializes/deserializes for database persistence
- Provides text editor commands (view, str_replace, insert) for AI tools

The file system is wrapped in React context (`FileSystemProvider` in src/lib/contexts/file-system-context.tsx) providing methods accessible throughout the component tree.

### AI Tool Integration

The AI assistant manipulates files via two tools defined in src/lib/tools/:

**str_replace_editor** (src/lib/tools/str-replace.ts):
- `view`: Display file contents with line numbers
- `create`: Create new files with automatic parent directory creation
- `str_replace`: Replace all occurrences of a string in a file
- `insert`: Insert text at a specific line number

**file_manager** (src/lib/tools/file-manager.ts):
- `rename`: Rename/move files (creates parent directories)
- `delete`: Delete files or directories recursively

These tools are provided to the AI model in src/app/api/chat/route.ts via the Vercel AI SDK's `streamText` function.

### Preview System

The preview system (src/components/preview/PreviewFrame.tsx and src/lib/transform/jsx-transformer.ts) is complex:

1. **Transformation**: JSX/TSX files are transpiled using Babel standalone to plain JavaScript
2. **Import Map Creation**: Transformed files are converted to blob URLs and mapped with:
   - Absolute paths: `/App.jsx`
   - Relative paths: `App.jsx`
   - Alias paths: `@/App.jsx` and `@/App` (alias points to root `/`)
   - Extension-less imports: `/App` → `/App.jsx`
   - External packages: resolved to `https://esm.sh/{package}`
3. **CSS Handling**: CSS imports are extracted from JS files and injected as `<style>` tags
4. **HTML Generation**: An HTML document with import map, styles, and error boundary is created
5. **Sandbox Rendering**: HTML is rendered in an iframe with `allow-scripts allow-same-origin` sandbox

The entry point is always `/App.jsx` (or `/App.tsx`, `/index.jsx`, etc.) which must export a default React component.

### Data Flow

**Anonymous Users:**
- Files and messages stored in browser localStorage via src/lib/anon-work-tracker.ts
- No database persistence

**Authenticated Users:**
- Projects stored in SQLite via Prisma (schema: prisma/schema.prisma)
- `Project.messages`: Serialized array of chat messages (JSON)
- `Project.data`: Serialized VirtualFileSystem state (JSON)
- Saved after each AI response completes (src/app/api/chat/route.ts onFinish)

### Authentication

Custom JWT-based auth (src/lib/auth.ts):
- Passwords hashed with bcrypt
- Sessions stored in httpOnly cookies
- Middleware (src/middleware.ts) protects project routes
- No external auth provider

### AI Configuration

The AI system prompt is in src/lib/prompts/generation.tsx. Key instructions:
- Create `/App.jsx` as entry point for all projects
- Use Tailwind CSS for styling
- Import local files with `@/` alias
- Keep responses brief

Model selection in src/lib/provider.ts:
- If `ANTHROPIC_API_KEY` is set: Uses Claude via @ai-sdk/anthropic
- Otherwise: Returns mock responses (static sample code)

## Important Patterns

### Path Handling
- All file paths must start with `/` (normalized automatically)
- The `@/` import alias maps to root `/` directory
- VirtualFileSystem handles parent directory creation automatically

### Testing
- Tests use Vitest with jsdom environment
- Test files co-located in `__tests__` directories
- File system tests in src/lib/__tests__/file-system.test.ts
- Context tests in src/lib/contexts/__tests__/
- Component tests in src/components/*/__tests__/

### State Management
- React Context for global state (file system, chat)
- No Redux/Zustand - contexts are sufficient for this app size
- File system context triggers re-renders via `refreshTrigger` counter

### Component Structure
```
src/
├── app/              # Next.js App Router pages
├── components/
│   ├── auth/         # Sign in/up forms, auth dialog
│   ├── chat/         # Chat interface, message list, markdown renderer
│   ├── editor/       # File tree, Monaco code editor
│   ├── preview/      # Preview iframe
│   └── ui/           # Shadcn/ui components
├── lib/
│   ├── contexts/     # React contexts (file system, chat)
│   ├── tools/        # AI tools (str-replace, file-manager)
│   ├── transform/    # JSX transformation, import map creation
│   └── prompts/      # AI system prompts
└── actions/          # Server actions for projects
```

## Database Schema

The Prisma client is generated to src/generated/prisma/ (not node_modules).

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   # bcrypt hashed
  projects  Project[]
}

model Project {
  id        String   @id @default(cuid())
  name      String
  userId    String?  # Nullable for potential anonymous projects
  messages  String   @default("[]")    # JSON string
  data      String   @default("{}")    # JSON string (serialized VirtualFileSystem)
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Environment Variables

```env
ANTHROPIC_API_KEY=your-api-key-here  # Optional - app works without it (mock mode)
```

## Known Constraints

- SQLite database (dev.db) - not suitable for production at scale
- Virtual file system has no size limits - could consume memory with large projects
- Preview iframe uses blob URLs - no cleanup implemented for old blobs
- No file upload/download - code must be manually copied from editor
- Max AI response duration: 120 seconds (maxDuration in route.ts)
- Use comments sparingly. Only comment complex code.
- The database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the databse.