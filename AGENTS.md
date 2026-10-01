<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Voton

Keep Voton simple. It is a local-first writing workspace, not a client for a backend service. Use `README.md` for the project overview.

## Core rules

- Workspace data stays on the user's device. Pages, folders, and editor content belong in `VotonDB` (IndexedDB); small UI preferences may use `localStorage`.
- Do not add accounts, cloud sync, remote persistence, analytics, tracking, or server-side storage for workspace data unless the task explicitly changes the product architecture.
- Keep browser-only persistence and browser APIs on the client. Do not move workspace data through Server Actions, API routes, or other server-side paths without an explicit requirement.
- Preserve existing user data. Never clear, reset, or recreate the database as a shortcut for a schema change.
- Do not change VotonDB stores, indexes, keys, or persisted data formats unless a concrete requirement makes the change necessary.
- When changing IndexedDB stores, indexes, keys, or persisted data formats, bump the database version when required and handle incompatible changes in the IndexedDB upgrade path. Existing user data must remain usable after the app updates.
- When changing JSON export/import, preserve compatibility with existing Voton backups when practical. Treat imported JSON, Markdown, images, and editor content as untrusted input: validate before persisting or rendering it, and do not introduce unsafe raw HTML rendering.
- Follow current, documented best practices for TypeScript, React, and this version of Next.js. Prioritize performance, maintainability, and readable code; choose the simplest solution that meets the requirement, reuse proven patterns from this codebase, and avoid unnecessary abstractions, libraries, and infrastructure.
- Keep changes focused on the task. Avoid unrelated refactors, dependency upgrades, or formatting churn.

## Verification

Use npm for this project. Install dependencies with `npm ci` when needed.

Before finishing a code change, run:

```bash
npm run lint
npm run build
```

A production build needs network access because `next/font/google` downloads the Geist fonts. If the build cannot complete only because that network access is unavailable, report that clearly instead of treating it as a code failure.
