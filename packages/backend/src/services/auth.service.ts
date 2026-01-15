/**
 * Authentication service
 * Handles user authentication, token generation, and session management
 */

import * as bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { FastifyInstance } from 'fastify';
import { env } from '../config/env';
import { SECURITY, ERROR_MESSAGES } from '../config/constants';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  constructor(private app: FastifyInstance) {}

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials, userAgent?: string, ipAddress?: string): Promise<AuthTokens> {
    const { email, password } = credentials;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Extract roles and permissions
    const roles = user.roles.map(ur => ur.role.name);
    const permissions = user.roles.flatMap(ur => ur.role.permissions as string[]);

    // Generate tokens
    const tokens = await this.generateTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
      roles,
      permissions,
    }, userAgent, ipAddress);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return tokens;
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < SECURITY.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${SECURITY.PASSWORD_MIN_LENGTH} characters long`);
    }

    if (password.length > SECURITY.PASSWORD_MAX_LENGTH) {
      throw new Error(`Password must not exceed ${SECURITY.PASSWORD_MAX_LENGTH} characters`);
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    // Check for at least one number
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', 'password123', '12345678', 'qwerty', 'abc123',
      'admin', 'admin123', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      throw new Error('Password is too common. Please choose a stronger password');
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<{ userId: string }> {
    const { email, username, password, firstName, lastName } = data;

    // Validate password strength
    this.validatePassword(password);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password with higher cost factor for better security
    const hashedPassword = await bcrypt.hash(password, SECURITY.BCRYPT_ROUNDS);

    // Create user and assign role in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          firstName,
          lastName,
        },
      });

      // Assign default 'viewer' role
      const viewerRole = await tx.role.findUnique({
        where: { name: 'viewer' },
      });

      if (!viewerRole) {
        throw new Error('Default viewer role not found. Please run database migrations.');
      }

      await tx.userRole.create({
        data: {
          userId: newUser.id,
          roleId: viewerRole.id,
        },
      });

      return newUser;
    });

    return { userId: user.id };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    payload: TokenPayload,
    userAgent?: string,
    ipAddress?: string
  ): Promise<AuthTokens> {
    // Generate access token
    const accessToken = this.app.jwt.sign(payload);

    // Generate refresh token
    const refreshToken = this.app.jwt.sign(
      { userId: payload.userId },
      { secret: env.REFRESH_TOKEN_SECRET, expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
    );

    // Store refresh token in database
    const expiresIn = this.parseExpiration(env.REFRESH_TOKEN_EXPIRES_IN);
    await prisma.session.create({
      data: {
        userId: payload.userId,
        refreshToken,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + expiresIn),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiration(env.JWT_EXPIRES_IN),
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string, userAgent?: string, ipAddress?: string): Promise<AuthTokens> {
    // Verify refresh token
    let decoded: { userId: string };
    try {
      decoded = this.app.jwt.verify(refreshToken, { secret: env.REFRESH_TOKEN_SECRET }) as { userId: string };
    } catch (err) {
      throw new Error('Invalid refresh token');
    }

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new Error('Invalid or expired session');
    }

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Revoke old refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const roles = user.roles.map(ur => ur.role.name);
    const permissions = user.roles.flatMap(ur => ur.role.permissions as string[]);

    return this.generateTokens({
      userId: user.id,
      email: user.email,
      username: user.username,
      roles,
      permissions,
    }, userAgent, ipAddress);
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeToken(refreshToken: string): Promise<void> {
    await prisma.session.updateMany({
      where: { refreshToken },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Parse expiration time string to milliseconds
   */
  private parseExpiration(exp: string): number {
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000;
    }
  }
}
