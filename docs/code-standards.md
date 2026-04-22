# Code Standards & Codebase Structure

**Last Updated:** 2026-04-22 | **Enforced:** Phase 00+ | **Stack:** NestJS 11, Next.js 16, Prisma 7

## Codebase Organization

### Backend (apps/api) — NestJS Module Structure

**File Naming Convention:** `kebab-case.ts` for all files

**Directory Pattern:**
```
src/
├── {feature}/
│   ├── {feature}.module.ts          # Module definition (imports, exports)
│   ├── {feature}.controller.ts      # HTTP endpoints
│   ├── {feature}.service.ts         # Business logic
│   ├── strategies/                  # Auth strategies (jwt, etc.)
│   │   └── {strategy}.strategy.ts
│   ├── guards/                      # NestJS guards
│   │   └── {guard}.guard.ts
│   ├── decorators/                  # Custom decorators
│   │   └── {decorator}.decorator.ts
│   ├── dto/                         # Data Transfer Objects
│   │   ├── {operation}.dto.ts
│   │   └── {response}.dto.ts
│   ├── {feature}.service.spec.ts    # Unit tests
│   └── {feature}.controller.spec.ts
├── prisma/
│   ├── prisma.module.ts             # Global PrismaModule
│   └── prisma.service.ts            # PrismaService
├── app.module.ts                    # Root module
├── app.controller.ts                # Root routes
├── main.ts                          # Bootstrap
└── main.ts
```

**Example (Auth Module):**
```
auth/
├── auth.module.ts                 # @Module({imports, controllers, providers})
├── auth.controller.ts             # POST /auth/register, /login, /refresh, /logout
├── auth.service.ts                # register(), login(), refresh(), logout()
├── strategies/
│   └── jwt.strategy.ts            # JwtStrategy extends PassportStrategy
├── guards/
│   ├── jwt-auth.guard.ts          # @UseGuards(JwtAuthGuard) on protected routes
│   └── roles.guard.ts             # @UseGuards(RolesGuard) for role checks
├── decorators/
│   ├── current-user.decorator.ts  # @CurrentUser() to inject user
│   └── roles.decorator.ts         # @Roles(Role.SUPERADMIN) to specify required role
├── dto/
│   ├── register.dto.ts            # RegisterDto {email, password, name, phone?}
│   ├── login.dto.ts               # LoginDto {email, password}
│   └── refresh.dto.ts             # RefreshTokenDto {refreshToken}
├── auth.service.spec.ts           # Unit tests
└── auth.controller.spec.ts        # Integration tests
```

### Frontend (apps/web) — Next.js App Router

**File Naming Convention:** `kebab-case.ts` for utilities, `page.tsx` for pages

**Directory Pattern:**
```
app/
├── [locale]/                      # Optional i18n segment (vi, en)
│   ├── login/
│   │   └── page.tsx              # Login page component
│   ├── register/
│   │   └── page.tsx              # Register page component
│   ├── layout.tsx                # Layout wrapper
│   └── page.tsx                  # Home/index page
├── api/                          # Server actions / BFF routes (future)
│   └── [route]/
│       └── route.ts              # API endpoint
└── not-found.tsx                 # Catch-all 404

lib/
├── api-client.ts                 # Fetch wrapper with JWT auth & auto-refresh
├── auth-context.tsx              # React Context for auth state
├── types/
│   └── auth.ts                   # Auth-related types
└── hooks/                        # Custom React hooks
    └── use-auth.ts               # useAuth() hook

components/
├── auth/
│   ├── login-form.tsx            # Login form component
│   └── register-form.tsx         # Register form component
├── common/
│   ├── navbar.tsx                # Navigation bar
│   └── footer.tsx                # Footer
└── ...

public/                           # Static assets
├── images/
├── icons/
└── ...
```

### Shared Package (packages/shared)

**Purpose:** Type-safe validation & DTOs for both FE and BE

**Structure:**
```
src/
├── schemas/
│   ├── auth-schemas.ts           # Zod validators for auth
│   └── index.ts
├── types/
│   ├── auth.ts                   # Auth types
│   └── index.ts
└── index.ts                      # Public exports

# Export pattern:
export {
  // Schemas
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  
  // Types
  type RegisterInput,
  type LoginInput,
  type RefreshTokenInput,
};
```

## NestJS Code Standards

### Module Structure

**Pattern: Separation of Concerns**

```typescript
// auth.module.ts — Module acts as a container
@Module({
  imports: [
    JwtModule.register({}),
    PassportModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService], // Makes AuthService available to other modules
})
export class AuthModule {}
```

**Rule:** Module should have exactly one service (cohesive responsibility)

### Service (Business Logic)

**Pattern: Dependency Injection via Constructor**

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(body: RegisterDto) {
    // Validate input
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    // Business logic
    const { email, password, name, phone } = parsed.data;
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new BadRequestException('Registration failed');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({ email, passwordHash, name, phone });

    // Return sanitized response
    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...tokens };
  }

  // Private helpers with descriptive names
  private async generateTokens(userId: string, email: string, role: string) {
    // Implementation
  }

  private sanitize(user: User) {
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
```

**Rules:**
- Services contain business logic, not HTTP concerns
- Use `@Injectable()` decorator
- Constructor-based dependency injection (no @Inject for simple cases)
- Methods should be cohesive (one responsibility)
- Private helpers for complex operations
- Always sanitize responses (no password hashes, secrets)

### Controller (HTTP Layer)

**Pattern: Thin Controller → Service Delegation**

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: unknown) {
    return this.authService.refresh(body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() body: unknown) {
    await this.authService.logout(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: unknown) {
    return { user };
  }
}
```

**Rules:**
- Controllers contain only HTTP concerns (routing, status codes, guards)
- Delegate business logic to services
- Use descriptive method names matching HTTP verbs (login, logout)
- Use `@HttpCode()` for non-standard status codes (200 for POST refresh)
- Use guards and decorators for auth/validation

### Guards & Decorators

**JWT Guard Pattern:**

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Simple extension of Passport guard
  // Can add custom logic here if needed
}
```

**Usage:**
```typescript
@Get('me')
@UseGuards(JwtAuthGuard)  // Protects endpoint
me(@CurrentUser() user: UserPayload) {
  return { user };
}
```

**Custom Decorator Pattern:**

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Usage:**
```typescript
@Get('me')
@UseGuards(JwtAuthGuard)
me(@CurrentUser() user: UserPayload) {
  // user automatically injected from request.user
  return { user };
}
```

### Error Handling

**Pattern: Use NestJS Built-in Exceptions**

```typescript
// ✓ Good
if (!user) throw new UnauthorizedException('Invalid credentials');
if (existing) throw new BadRequestException('Email already registered');
if (invalid) throw new ForbiddenException('Access denied');

// ✗ Avoid
if (!user) throw new Error('not found');
if (invalid) return { error: 'unauthorized' };
```

**Validation Error Pattern:**

```typescript
const parsed = registerSchema.safeParse(body);
if (!parsed.success) {
  throw new BadRequestException(
    parsed.error.flatten().fieldErrors // Returns structured validation errors
  );
}
```

## Next.js Frontend Standards

### Page Components

**Pattern: RSC with Client Components**

```typescript
// app/login/page.tsx — Server Component
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main>
      <h1>Login</h1>
      <LoginForm />
    </main>
  );
}
```

### Client Components with State

**Pattern: Context-Based State Management**

```typescript
// lib/auth-context.tsx — React Context
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    restoreSession();
  }, []);

  const login = async (input: LoginInput) => {
    const { user, accessToken, refreshToken } = await apiPost('/auth/login', input);
    setTokens(accessToken, refreshToken);
    setUser(user);
  };

  // ... other methods

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

**Usage in Components:**
```typescript
'use client';

import { useAuth } from '@/lib/auth-context';

export function LoginForm() {
  const { login, isLoading } = useAuth();

  const handleSubmit = async (input: LoginInput) => {
    try {
      await login(input);
      // Redirect handled by auth context
    } catch (err) {
      // Show error toast
    }
  };

  return (
    // Form JSX
  );
}
```

### API Client Pattern

**Pattern: Centralized Fetch with Token Management**

```typescript
// lib/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    // Auto-refresh on 401
    const refreshed = await refreshTokens();
    if (!refreshed) {
      clearTokens();
      throw new UnauthorizedException('Session expired');
    }
    // Retry original request
    return apiPost(url, body);
  }

  if (!response.ok) {
    throw new HttpError(response.status, await response.json());
  }

  return response.json();
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
```

## Shared Package (Zod Schemas)

**Pattern: Type-Safe Validation**

```typescript
// packages/shared/src/schemas/auth-schemas.ts
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Backend usage:
const parsed = registerSchema.safeParse(body);
if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

// Frontend usage:
const form = useForm<RegisterInput>({
  resolver: zodResolver(registerSchema),
});
```

**Rules:**
- Define schemas in shared package
- Use `.safeParse()` for non-throwing validation
- Export both schema and inferred types
- Share validation between FE & BE

## Prisma Data Models

**Pattern: Lean, Composable Models**

```typescript
// schema.prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(CUSTOMER)

  refreshTokens RefreshToken[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model RefreshToken {
  id        String    @id @default(cuid())
  userId    String
  tokenHash String    @unique
  expiresAt DateTime
  revokedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  createdAt DateTime @default(now())
}
```

**Rules:**
- Use `@default(cuid())` for compact IDs
- Use `@unique` for lookup fields (email, tokenHash)
- Add `@@index()` on foreign key lookups (userId)
- Use `@updatedAt` for automatic timestamp management
- Relations should have clear ownership (onDelete: Cascade)

## Testing Standards

### Unit Tests (Services)

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('register', () => {
    it('should hash password and create user', async () => {
      // Test implementation
    });

    it('should throw if user exists', async () => {
      // Test implementation
    });
  });
});
```

### E2E Tests

```typescript
describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should register → login → refresh → logout', async () => {
    // Full auth flow test
  });
});
```

## Environment Variables

**Backend (apps/api/.env):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/spa_cms
JWT_ACCESS_SECRET=your-secret-key-32-bytes-minimum
JWT_REFRESH_SECRET=your-secret-key-32-bytes-minimum
NODE_ENV=development
```

**Frontend (apps/web/.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Rules:**
- Never commit `.env` files to git
- Use `.env.example` for documentation
- Prefix FE env vars with `NEXT_PUBLIC_` for client exposure
- Keep secrets out of version control

## Code Quality Tools

### Linting

**NestJS (ESLint):**
```bash
pnpm --filter api lint
```

**Next.js (ESLint):**
```bash
pnpm --filter web lint
```

### Type Checking

```bash
pnpm typecheck
```

### Formatting

```bash
pnpm format
```

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `auth.service.ts`, `login-form.tsx` |
| Functions | camelCase | `generateTokens()`, `validateEmail()` |
| Classes | PascalCase | `AuthService`, `JwtStrategy` |
| Types | PascalCase | `User`, `RegisterInput` |
| Enums | PascalCase | `Role`, `HttpStatus` |
| Constants | UPPER_SNAKE_CASE | `BCRYPT_ROUNDS`, `ACCESS_TOKEN_TTL` |
| Variables | camelCase | `userId`, `accessToken` |
| Routes | kebab-case (URL) | `/auth/login`, `/auth/refresh` |
| Database fields | camelCase | `passwordHash`, `refreshTokens` |

## Git Workflow

### Commit Message Format

**Conventional Commits:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Examples:**
```
feat(auth): add JWT refresh token rotation
fix(auth): prevent token hash collision
docs(architecture): document auth flow
refactor(api): extract token generation to helper
test(auth): add register endpoint tests
chore(deps): upgrade @nestjs/jwt to 11.0.2
```

### Branch Naming

```
feature/auth-refresh-tokens
fix/password-hash-validation
docs/system-architecture
```

## Phase 02 Patterns (Doctor, Service, TimeSlot)

### CRUD Module Pattern (Phase 02+)

**Standard structure for CRUD modules (doctors, services):**

```typescript
// feature.controller.ts
@Controller('feature')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Get()
  listActive() {
    return this.featureService.listActive();  // Public list
  }

  @Get(':id')  // or ':slug' for Service
  findOne(@Param('id') id: string) {
    return this.featureService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  create(@Body() body: unknown) {
    return this.featureService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.featureService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.featureService.softDelete(id);
  }
}
```

**Soft-Delete Pattern:**
- All CRUD operations use `active: boolean` field (default true)
- DELETE endpoints set `active = false` instead of hard-delete
- List endpoints filter by `active = true` only
- Benefits: data recovery, audit trail, referential integrity

### i18n JSON Fields Pattern (Phase 02)

**For multilingual content (doctor specialty, service name, etc.):**

```typescript
// Prisma schema
model Service {
  name        Json    // { vi: string, ko: string }
  description Json    // { vi: string, ko: string }
}

// Zod schema
const i18nTextSchema = z.object({
  vi: z.string().min(1, 'Vietnamese text is required'),
  ko: z.string().min(1, 'Korean text is required'),
});

// Service creation
const createServiceSchema = z.object({
  name: i18nTextSchema,
  description: i18nTextSchema,
  // ... other fields
});
```

**Usage:**
- Backend validates both vi & ko present at schema level
- Database stores as JSON object
- Frontend displays based on user locale
- No separate language tables needed for Phase 02 scope

### Role-Based Ownership Pattern (Phase 02)

**For resources owned by specific users (doctor slots):**

```typescript
@Patch(':id/block')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'DOCTOR')
block(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
  // Service validates: SUPERADMIN can block any, DOCTOR only own slots
  return this.slotsService.block(id, user);
}

// In service:
async block(slotId: string, user: { id: string; role: string }) {
  const slot = await this.prisma.timeSlot.findUnique({ where: { id: slotId } });
  
  if (user.role === 'DOCTOR') {
    // Verify doctor ownership
    const doctorId = await this.getDoctorIdFromUserId(user.id);
    if (slot.doctorId !== doctorId) {
      throw new ForbiddenException('Cannot modify other doctors\' slots');
    }
  }
  
  return this.prisma.timeSlot.update({
    where: { id: slotId },
    data: { status: 'BLOCKED' },
  });
}
```

**Pattern:**
- Pass user context (id, role) from decorator
- Service enforces ownership rules
- SUPERADMIN bypasses ownership checks
- Clear ForbiddenException on violation

### Batch Generation Pattern (Phase 02)

**For operations that create multiple records (slot generation):**

```typescript
@Post('generate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN', 'DOCTOR')
generate(@Body() body: unknown, @CurrentUser() user: { id: string; role: string }) {
  return this.slotsService.generateForDoctor(body, user);
}

// In service:
async generateForDoctor(input: GenerateSlotsInput, user: { id: string; role: string }) {
  const { doctorId, fromDate, days = 30 } = input;
  
  // Ownership check
  if (user.role === 'DOCTOR') {
    const userDoctorId = await this.getDoctorIdFromUserId(user.id);
    if (doctorId !== userDoctorId) {
      throw new ForbiddenException('Can only generate own slots');
    }
  }
  
  // Generate slots for each day
  const slots = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + i);
    
    // Create 14 slots (6 morning + 8 afternoon)
    for (const startTime of ALL_SLOT_TIMES) {
      slots.push({
        doctorId,
        date,
        startTime,
        endTime: addThirtyMin(startTime),
        status: 'AVAILABLE',
      });
    }
  }
  
  // Bulk create with conflict handling
  await this.prisma.timeSlot.createMany({
    data: slots,
    skipDuplicates: true,  // Handle existing slots gracefully
  });
  
  return { generated: slots.length };
}
```

**Pattern:**
- Validate input before loop
- Generate records in memory
- Bulk create with skipDuplicates for idempotency
- Return count for transparency

## Summary

**Key Principles:**
1. **Modularity:** Each NestJS module has one responsibility
2. **Type Safety:** Zod schemas + TypeScript for compile-time checks
3. **Separation of Concerns:** Controllers → Services → Repositories
4. **Error Handling:** Use NestJS exceptions, not generic errors
5. **Testing:** Unit tests for services, E2E for workflows
6. **Naming:** Clear, descriptive, consistent across codebase
7. **Security:** Sanitize responses, hash passwords, validate inputs
8. **Documentation:** Inline comments for complex logic

**Review Checklist:**
- [ ] Follows naming conventions
- [ ] Functions/classes have single responsibility
- [ ] Error handling uses NestJS exceptions
- [ ] Input validated with Zod schemas
- [ ] No password hashes in responses
- [ ] Tests cover happy path + error cases
- [ ] Commit messages follow conventional format
