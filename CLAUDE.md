# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack at localhost:3000
npm run dev:daemon   # Start dev server in background (logs to logs.txt)

# Production
npm run build
npm run start

# Quality
npm run lint         # ESLint
npm run test         # Vitest

# Database
npm run setup        # Install deps + generate Prisma client + run migrations
npm run db:reset     # Reset database (force all migrations)
```

Run a single test file:
```bash
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx
```

## Architecture

UIGen is an AI-powered React component generator with live preview. The user describes components in a chat panel; Claude generates code via tool use; a virtual file system stores it; Babel transforms it and renders it in a sandboxed iFrame.

### Request Lifecycle

1. User types in `ChatInterface` → submits to `/api/chat` (streaming)
2. `/api/chat/route.ts` calls Claude (`claude-haiku-4-5`) with two tools: `str_replace_editor` (create/edit files) and `file_manager` (rename/delete)
3. Tool calls stream back and are processed by `FileSystemContext`, which updates the in-memory `VirtualFileSystem`
4. `PreviewFrame` detects file changes, Babel transforms JSX, and renders in an iFrame with an ES module import map
5. On completion, project is persisted to SQLite (authenticated users only)

### Key Modules

| Path | Role |
|------|------|
| `src/app/api/chat/route.ts` | Streaming chat API; orchestrates Claude + tool execution |
| `src/lib/file-system.ts` | `VirtualFileSystem` class — in-memory Map-based FS |
| `src/lib/contexts/file-system-context.tsx` | React context that owns the VFS instance and processes tool results |
| `src/lib/contexts/chat-context.tsx` | Wraps Vercel AI SDK `useChat`; connects to `/api/chat` |
| `src/lib/transform/jsx-transformer.ts` | Babel standalone → JS + import map generation for iFrame |
| `src/lib/provider.ts` | Returns Claude provider or mock fallback (no API key) |
| `src/lib/prompts/generation.tsx` | System prompt: instructs Claude to use `/App.jsx` as entry, Tailwind for styling, `@/` aliases |
| `src/lib/tools/` | Tool definitions (`str_replace_editor`, `file_manager`) |
| `src/middleware.ts` | JWT auth middleware; protects `/[projectId]` routes |

### UI Layout

`main-content.tsx` renders a split panel:
- **Left (35%):** `ChatInterface` (messages + input)
- **Right (65%):** tabs between `PreviewFrame` (iFrame sandbox) and a split of `FileTree` (30%) + `CodeEditor` (70%, Monaco)

### Data Model

SQLite via Prisma. Two tables: `User` (email + bcrypt password) and `Project` (`messages` and `data` stored as JSON strings). Anonymous projects have `userId = null`.

### Environment Variables

Required in `.env`:
```
ANTHROPIC_API_KEY=   # Falls back to mock provider if absent
JWT_SECRET=
DATABASE_URL=        # file:./prisma/dev.db by default
```

### Preview Entry Point Detection

`jsx-transformer.ts` looks for `/App.jsx` → `/App.tsx` → `/index.jsx` → `/index.tsx` → first `.jsx`/`.tsx` found. Claude is prompted to always create `/App.jsx` as the entry point.
