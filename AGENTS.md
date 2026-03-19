# AGENTS.md - Clínica Altamente

## Project Overview

This is a medical clinic management system built with Next.js 16, TypeScript, Prisma 7, and PostgreSQL. The application handles authentication, patient management, appointments, and medical records.

---

## Trello Integration

**Board:** Clínica Altamente  
**Board ID:** `69af4c44dc2cf3594724b0f0`  
**URL:** https://trello.com/b/69af4c44dc2cf3594724b0f0

### Lists
| List Name | List ID |
|-----------|---------|
| User Stories | `69af4c583cba3231e98fec2f` |
| Backlog | `69af4c64c0ce24263ada6773` |
| To do | `69af4c61e47d579443a72863` |
| Doing | `69af4c683be098e9e3e1c604` |
| Testing | `69b6f1f24882b0c02cd5bdb9` |
| Review | `69af4c79fc543b93a9903460` |
| Done | `69af4c6b9b9a422b3a610ce8` |

---

## Build & Development Commands

### Development
```bash
bun run dev          # Start development server (uses Bun runtime with webpack)
bun run build        # Production build
bun run start        # Start production server
```

### Code Quality
```bash
bun run lint         # Run ESLint
```

### Testing
```bash
bun test             # Run all tests
bun test --coverage  # Run tests with coverage report
```

### Database (Prisma)
```bash
bun run db:generate   # Generate Prisma Client
bun run db:push       # Push schema changes to database
bun run db:studio     # Open Prisma Studio
bun run db:migrate    # Create and run migrations
```

---

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** - No implicit any allowed
- Use explicit type annotations for function parameters and return types
- Use `unknown` instead of `any` when type is truly unknown
- Prefer interfaces for object shapes, types for unions/primitives

### Imports
- Use absolute imports with `@/` alias (maps to `./src/`)
- Group imports: 1) React/Next.js, 2) Third-party, 3) Internal modules
- Use named exports for utilities, default exports for pages/layouts

```typescript
// Correct
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Avoid
import { prisma } from '../lib/prisma';
```

### Naming Conventions
- **Files**: kebab-case for utilities (`bcrypt.ts`), kebab-case for pages
- **Components**: PascalCase (`.tsx` files)
- **Functions/variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Types/interfaces**: PascalCase with `T` prefix or descriptive names

### React/Next.js Patterns
- Server Components by default; use `"use client"` only when needed
- Use async/await for data fetching in Server Components
- Prefer Server Actions over API routes for mutations
- Use `next/link` for client-side navigation

### Error Handling
- Always handle async errors with try/catch
- Return early on error conditions
- Use meaningful error messages

```typescript
// Correct
async function getUser(id: string) {
  if (!id) return null;
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}

// Avoid
async function getUser(id: string) {
  return await prisma.user.findUnique({ where: { id } }); // No error handling
}
```

### Database (Prisma 7)
- Always use the adapter pattern with PostgreSQL
- Use connection pooling for production
- Never expose Prisma Client directly to client components
- Use transactions for multi-table operations

```typescript
// src/lib/prisma.ts pattern
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

export const prisma = new PrismaClient({ 
  adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })) 
})
```

### Authentication (NextAuth v5)
- Use JWT sessions for credentials provider
- Hash passwords with bcrypt (salt 12)
- Validate credentials in authorize callback
- Extend session with user role for authorization

### Styling (Tailwind CSS)
- Use dark mode variants (`dark:` prefix)
- Use semantic color names (e.g., `text-gray-500`)
- Prefer utility classes over custom CSS
- Keep responsive design in mind

### File Organization
```
src/
├── app/                    # Pages and API routes (App Router)
│   ├── api/               # API routes
│   ├── (auth)/            # Auth route group
│   └── page.tsx           # Home page
├── lib/                   # Utilities and libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   └── bcrypt.ts         # Password utilities
└── components/           # Reusable components (if added)
prisma/
├── schema.prisma         # Database schema
└── seed.ts              # Database seeding
```

### API Routes
- Use Route Handlers (`route.ts`) for API endpoints
- Return appropriate HTTP status codes
- Use Zod for request validation
- Handle CORS appropriately

### Commit Messages
Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `style:` - Formatting, no code change
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

---

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)

---

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **ORM**: Prisma 7 with PostgreSQL adapter
- **Auth**: NextAuth v5 (Credentials provider)
- **Styling**: Tailwind CSS 4
- **Validation**: Zod
- **Linting**: ESLint with Next.js config
