I'll audit the backend API testing for the Maestranza-Control-Pro project. Let me start by exploring the project structure to understand the backend setup and identify test files.

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ .                                                                            │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro"           │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 38 item(s). (7 git-ignored)                                           │
└──────────────────────────────────────────────────────────────────────────────┘
Now let me examine the package.json to understand the project setup and test configuration:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ package.json                                                                 │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/package.json"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ JSON object                                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
Now let me check the vitest configuration to understand the test setup:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ vitest.config.ts                                                             │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/vitest.config.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check the test setup file and explore the tests directory:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ tests/setup.ts                                                               │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/tests/setup.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Now let me explore the tests directory to see what test files exist:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ tests                                                                        │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/tests"     │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 3 item(s).                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check what's in the mocks and validations directories:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ tests/mocks                                                                  │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/tests/mocks"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 2 item(s).                                                            │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ tests/validations                                                            │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/tests/validations"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 1 item(s).                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check the mock files and validation test to understand what's being tested:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ tests/mocks/auth.ts                                                          │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/tests/mocks/auth.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ tests/mocks/prisma.ts                                                        │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/tests/mocks/prisma.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
[Empty message]

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ tests/validations/rut.test.ts                                                │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/tests/validations/rut.test.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Now let me check if there are any API route tests by looking for API-related files. Let me first check the app directory structure to understand the API routes:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ app                                                                          │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/app"       │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 10 item(s).                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check the API directory to see what endpoints exist:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ app/api                                                                      │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/app/api"   │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 2 item(s).                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check what's in the auth and health API directories:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ app/api/auth                                                                 │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/app/api/auth"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 1 item(s).                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
[Empty message]

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ app/api/health                                                               │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/app/api/health"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 1 item(s).                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check the health route and auth route:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ app/api/health/route.ts                                                      │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/app/api/health/route.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
[Empty message]

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ app/api/auth/[...nextauth]/route.ts                                          │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/app/api/auth/[...nextauth]/route.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Now let me check if there are any existing tests for these API routes. Let me search for any test files that might be testing API endpoints:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool glob                                                                    │
│                                                                              │
│ Description:                                                                 │
│ '**/tests/**/*.test.ts'                                                      │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "pattern": "**/tests/**/*.test.ts"                                         │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool glob                                                                    │
│                                                                              │
│ Found 1 matching file(s)                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
Let me also check for any test files in the app directory or lib directory that might be testing API routes:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool glob                                                                    │
│                                                                              │
│ Description:                                                                 │
│ '**/*.test.ts'                                                               │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "pattern": "**/*.test.ts"                                                  │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool glob                                                                    │
│                                                                              │
│ Found 1 matching file(s)                                                     │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check the lib directory to understand the API structure better:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ lib                                                                          │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/lib"       │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 9 item(s).                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check the auth.ts file to understand the authentication API:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ lib/auth.ts                                                                  │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/lib/auth.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Now let me check the db.ts file to understand the database connection:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ lib/db.ts                                                                    │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/lib/db.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Now let me check if there are any server actions or API-like functions in the actions directory:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Description:                                                                 │
│ lib/actions                                                                  │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/lib/actions"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool list_directory                                                          │
│                                                                              │
│ Listed 14 item(s).                                                           │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check a few of these action files to understand the API structure:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ lib/actions/workorders.ts                                                    │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/lib/actions/workorders.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Let me check another action file to see the pattern:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool read_file                                                               │
│                                                                              │
│ Description:                                                                 │
│ lib/actions/users.ts                                                         │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "absolute_path": "/Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro/lib/actions/users.ts"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Now let me run the existing tests to see what's currently working:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Description:                                                                 │
│ (tool not found in registry)                                                 │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "command": "cd /Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro && npm run test"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Error executing tool run_shell_command: Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?│
└──────────────────────────────────────────────────────────────────────────────┘
Let me run the test using the proper tool:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Description:                                                                 │
│ (tool not found in registry)                                                 │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "command": "cd /Volumes/PortableSSD/Maestranza/Maestranza-Control-Pro && npm run test"│
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Error executing tool run_shell_command: Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?│
└──────────────────────────────────────────────────────────────────────────────┘
Let me try using the correct tool name:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Description:                                                                 │
│ (tool not found in registry)                                                 │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "command": "npm run test"                                                  │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Error executing tool run_shell_command: Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?│
└──────────────────────────────────────────────────────────────────────────────┘
Let me check what shell command tools are available:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Description:                                                                 │
│ (tool not found in registry)                                                 │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "command": "ls -la"                                                        │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Error executing tool run_shell_command: Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?│
└──────────────────────────────────────────────────────────────────────────────┘
It seems the run_shell_command tool is not available. Let me check if I can run the tests by examining what's available. Let me try to run vitest directly:

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Description:                                                                 │
│ (tool not found in registry)                                                 │
│                                                                              │
│ Invocation payload:                                                          │
│ {                                                                            │
│   "command": "npx vitest run"                                                │
│ }                                                                            │
└──────────────────────────────────────────────────────────────────────────────┘
Error executing tool run_shell_command: Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?

┌──────────────────────────────────────────────────────────────────────────────┐
│ Tool run_shell_command                                                       │
│                                                                              │
│ Tool "run_shell_command" not found in registry. Tools must use the exact names that are registered. Did you mean one of: "search_file_content", "browser_click", "browser_close"?│
└──────────────────────────────────────────────────────────────────────────────┘
It appears the run_shell_command tool is not available in this environment. Let me proceed with the analysis based on what I can see from the code structure.

Based on my exploration, here's my audit of the backend/API testing:

## Backend/API Testing Audit

### Information Gathered

**Project Stack:**
- Next.js 16.2.9 with App Router
- Vitest 2.1.8 for testing
- Prisma ORM with PostgreSQL
- NextAuth v5 for authentication
- Server Actions for backend logic

**Current Test Structure:**
- Only 1 test file exists: `tests/validations/rut.test.ts` (RUT validation utilities)
- No API route tests found
- No server action tests found
- Mocks exist for auth and prisma but aren't being used in tests

**API Endpoints Identified:**
1. **Health Check:** `/app/api/health/route.ts` - Database connectivity and schema validation
2. **Auth:** `/app/api/auth/[...nextauth]/route.ts` - NextAuth handlers (GET/POST)
3. **Server Actions:** Multiple files in `/lib/actions/` - Business logic functions

### Changes Needed

#### 1. Health Endpoint Tests
Create tests for `/app/api/health/route.ts`:
- Test successful database connection
- Test database failure scenario
- Test schema validation passing
- Test schema validation failure (missing columns)
- Test overall health response format

#### 2. Auth Endpoint Tests  
Create tests for `/app/api/auth/[...nextauth]/route.ts`:
- Test GET session (authenticated/unauthenticated)
- Test POST signin with valid/invalid credentials
- Test POST signout
- Test RUT validation integration
- Test rate limiting
- Test role-based access control

#### 3. Server Action Tests
Create tests for key server actions in `/lib/actions/`:
- Work orders: CRUD operations, status updates, supervisor assignment
- Users: listing, creation, activation toggling
- Clients: CRUD operations
- Workers: CRUD operations, certifications
- HSEQ: record creation, updates
- Gantt: task management
- Documents: upload/download tracking

#### 4. Test Coverage Gaps
Currently missing:
- **API route tests**: 0/2 endpoints tested (0%)
- **Server action tests**: 0/12 action files tested (0%)
- **Authentication flow tests**: 0%
- **Authorization/RBAC tests**: 0%
- **Database integration tests**: 0%
- **Error handling tests**: 0%
- **Edge case tests**: 0%
- **Performance/load tests**: 0%

### Implementation Details

For each test file, I would create:

**Health Tests (`tests/api/health.test.ts`):**
```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mockDeep } from 'vitest-mock-extended'
import { prisma } from '@/lib/db'
import { GET } from '@/app/api/health/route'

vi.mock('@/lib/db', () => ({
  prisma: mockDeep<typeof prisma>()
}))

describe('Health Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return healthy when database and schema are ok', async () => {
    // Mock successful database connection
    ;(prisma.$queryRaw as any).mockResolvedValueOnce([{}]); // SELECT 1
    ;(prisma.$queryRaw as any).mockResolvedValueOnce([
      { table_name: 'Session', column_name: 'updatedAt' },
      // ... other required columns
    ] as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.checks.database).toBe('ok')
    expect(data.checks.schema).toBe('ok')
  })

  // Additional tests for failure scenarios...
})
```

**Auth Tests (`tests/api/auth.test.ts`):**
```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { mockAuthLoggedIn, mockAuthLoggedOut, resetAuthMocks } from '@/tests/mocks/auth'
import { handlers } from '@/app/api/auth/[...nextauth]/route'

describe('Auth Endpoints', () => {
  beforeEach(() => {
    resetAuthMocks()
  })

  describe('GET /api/auth/session', () => {
    it('should return session when authenticated', async () => {
      mockAuthLoggedIn()
      // Test GET handler
    })

    it('should return null when not authenticated', async () => {
      mockAuthLoggedOut()
      // Test GET handler
    })
  })

  // Additional tests for signin, signout, etc.
})
```

**Server Action Tests (`tests/actions/workorders.test.ts`):**
```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/mocks/prisma'
import * as workorderActions from '@/lib/actions/workorders'
import { requireAuth } from '@/lib/auth'
import { adminSession } from '@/tests/mocks/auth'

vi.mock('@/lib/auth')
vi.mock('@/lib/db', () => ({
  prisma: prismaMock
}))

describe('WorkOrder Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireAuth as any).mockResolvedValue({ user: adminSession.user })
  })

  describe('getWorkOrders', () => {
    it('should return work orders with proper filtering', async () => {
      const mockData = [{ id: 'wo-1', title: 'Test OT' }]
      ;(prismaMock.workOrder.findMany as any).mockResolvedValue(mockData)

      const result = await workorderActions.getWorkOrders()
      expect(result).toEqual(mockData)
    })
  })

  // Additional tests for create, update, delete, etc.
})
```

### Testing Details

**Commands to Run Tests:**
- `npm run test` - Run all tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report

**Test Categories to Implement:**
1. **Unit Tests**: Individual functions/actions
2. **Integration Tests**: API routes with mocked dependencies
3. **Authentication Tests**: Login/logout/session flows
4. **Authorization Tests**: Role-based access control
5. **Error Handling Tests**: Validation errors, database failures
6. **Edge Case Tests**: Boundary conditions, invalid inputs

**Coverage Targets:**
- Health endpoint: 90%+ coverage
- Auth endpoints: 85%+ coverage  
- Critical server actions: 80%+ coverage
- Overall project: 70%+ coverage

**Curl Scenarios for Manual Testing:**

**Health Endpoint:**
```bash
# Healthy response
curl -s http://localhost:3000/api/health | jq .

# Unhealthy response (simulate DB failure)
# Would need to manipulate env or mock
```

**Auth Endpoints:**
```bash
# Signin attempt
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"rut":"12.345.678-5","password":"test123"}'

# Check session
curl -s http://localhost:3000/api/auth/session

# Signout
curl -X POST http://localhost:3000/api/auth/signout
```

**AGENT_TESTING_BACKEND_DONE**
