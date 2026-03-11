# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, and the AI generates React code that renders in a sandboxed iframe preview. It supports both authenticated users (with project persistence via Prisma/SQLite) and anonymous users.

## Common Commands

- `npm run setup` — Install deps, generate Prisma client, run migrations (first-time setup)
- `npm run dev` — Start dev server with Turbopack (localhost:3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm test` — Run all tests (vitest)
- `npx vitest run src/path/to/test.ts` — Run a single test file
- `npx prisma generate` — Regenerate Prisma client after schema changes
- `npx prisma migrate dev` — Create/apply migrations after schema changes
- `npm run db:reset` — Reset the database

## Architecture

### AI Chat Flow

1. User sends a message via the chat UI (`ChatProvider` → `useChat` from `@ai-sdk/react`)
2. Request hits `POST /api/chat` route with messages + serialized virtual file system
3. The route uses Vercel AI SDK's `streamText` with Claude (or a `MockLanguageModel` when no API key is set)
4. The AI has two tools: `str_replace_editor` (create/edit files) and `file_manager` (rename/delete files)
5. Tool calls stream back to the client where `FileSystemContext.handleToolCall` applies changes to the VirtualFileSystem
6. `PreviewFrame` reacts to file system changes and rebuilds the preview

### Virtual File System

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory file system used both server-side (in the chat API route to give the AI context) and client-side (to track generated files). It serializes to/from plain objects for transport. No files are written to disk.

### Preview Pipeline

`src/lib/transform/jsx-transformer.ts` handles the preview rendering pipeline:
- Transforms JSX/TSX files using `@babel/standalone`
- Creates blob URLs for each transformed file
- Builds an import map that resolves `@/` aliases, relative paths, and third-party packages (via esm.sh)
- Generates a self-contained HTML document rendered in a sandboxed iframe

### Provider System

`src/lib/provider.ts` — When `ANTHROPIC_API_KEY` is set, uses `@ai-sdk/anthropic` with `claude-haiku-4-5`. Without an API key, falls back to `MockLanguageModel` which returns static component code.

### Auth & Data

- JWT-based auth using `jose` (not NextAuth). See `src/lib/auth.ts`
- Prisma with SQLite: `User` and `Project` models. Always reference `prisma/schema.prisma` for the database structure
- Projects store serialized messages and file system data as JSON strings
- Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem` routes

### Key Contexts

- `FileSystemProvider` — Manages VirtualFileSystem state, file selection, and tool call handling
- `ChatProvider` — Wraps Vercel AI SDK's `useChat`, connects to file system context

### UI Structure

The main layout (`src/app/main-content.tsx`) is a resizable two-panel design:
- Left panel: Chat interface (ChatInterface → MessageList + MessageInput)
- Right panel: Tabs for Preview (iframe) and Code (FileTree + Monaco editor)
- UI components use shadcn/ui (Radix primitives + Tailwind CSS v4)

## Code Style

- Use comments sparingly. Only comment complex code.

## Testing

Tests use Vitest with jsdom environment and React Testing Library. Test files are co-located with source in `__tests__/` directories.
