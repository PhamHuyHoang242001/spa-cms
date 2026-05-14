// auth.service.ts — register, login, refresh, logout logic with token rotation
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  BCRYPT_ROUNDS,
} from '@spa/shared';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
const ACCESS_TOKEN_TTL = '1d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ── Register ────────────────────────────────────────────────────────────────

  async register(body: RegisterDto) {
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const { email, password, name, phone } = parsed.data;

    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new BadRequestException('Registration failed');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      email,
      passwordHash,
      name,
      phone,
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...tokens };
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  async login(body: LoginDto) {
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const { email, password } = parsed.data;
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: this.sanitize(user), ...tokens };
  }

  // ── Refresh ─────────────────────────────────────────────────────────────────

  async refresh(body: unknown) {
    const parsed = refreshTokenSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('refreshToken is required');
    }

    const { refreshToken } = parsed.data;

    // O(1) lookup via SHA-256 hash (deterministic, safe for high-entropy tokens)
    const tokenHash = this.sha256(refreshToken);
    const matched = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!matched || matched.revokedAt || matched.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(matched.userId);
    if (!user) throw new UnauthorizedException('User not found');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return tokens;
  }

  // ── Logout ──────────────────────────────────────────────────────────────────

  async logout(body: unknown) {
    const parsed = refreshTokenSchema.safeParse(body);
    if (!parsed.success) return; // Silently ignore malformed input

    const { refreshToken } = parsed.data;
    const tokenHash = this.sha256(refreshToken);

    // O(1) lookup + revoke
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string) {
    const secret = process.env['JWT_ACCESS_SECRET'];
    if (!secret) throw new Error('JWT_ACCESS_SECRET env var is required');

    const accessToken = this.jwtService.sign(
      { sub: userId, email, role },
      { secret, expiresIn: ACCESS_TOKEN_TTL },
    );

    // Refresh token: random string, SHA-256 hashed for O(1) DB lookup
    const rawToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.sha256(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken: rawToken };
  }

  /** SHA-256 hash for refresh token storage — safe for high-entropy random tokens */
  private sha256(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
  }

  private sanitize(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    phone: string | null;
    locale: string;
    createdAt: Date;
    updatedAt: Date;
    passwordHash: string;
  }) {
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
  }
}
