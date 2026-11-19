import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

import { UsersService } from '../users/users.service';
import { BranchesService } from '../branches/branches.service';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import {
  RevokedToken,
  RevokedTokenDocument,
} from './schemas/revoked-token.schema';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

interface AuthenticatedUser {
  sub?: string;
  jti?: string;
}

export function readIdleTimeoutMs(configService: ConfigService): number {
  const raw = configService.get<string>('IDLE_TIMEOUT_MINUTES');
  const minutes = Number.parseInt(raw ?? '', 10);
  const safe = Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
  return safe * 60 * 1000;
}

export function assertNotIdle(
  lastActivityAt: Date | undefined | null,
  idleTimeoutMs: number,
): void {
  if (!lastActivityAt) return;

  const idleMs = Date.now() - new Date(lastActivityAt).getTime();

  if (idleMs > idleTimeoutMs) {
    throw new UnauthorizedException(
      'Session has ended due to inactivity. Please sign in again',
    );
  }
}

@Injectable()
export class AuthService {
  private static readonly ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
  private static readonly REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

  constructor(
    private readonly usersService: UsersService,
    private readonly branchesService: BranchesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(RevokedToken.name)
    private readonly revokedTokenModel: Model<RevokedTokenDocument>,
  ) {}

  private get idleTimeoutMs(): number {
    return readIdleTimeoutMs(this.configService);
  }

  async register(registerDto: RegisterDto) {
    const branch = await this.branchesService.findById(registerDto.branchId);

    if (!branch || !branch.isActive) {
      throw new UnauthorizedException('Invalid or inactive branch');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      phone: registerDto.phone,
      password: hashedPassword,
      role: 'STAFF',
      branchId: branch._id,
      isActive: true,
    });

    return {
      message: 'User registered successfully',
      user: this.sanitizeUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account is inactive');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const now = new Date();
    user.lastLogin = now;
    user.lastActivityAt = now;
    await user.save();

    const tokens = await this.issueTokens(user);

    return {
      message: 'Login successful',
      ...tokens,
      idleTimeoutSeconds: Math.round(this.idleTimeoutMs / 1000),
      user: this.sanitizeUser(user),
    };
  }

  async touchActivity(user: AuthenticatedUser | undefined) {
    const userId = user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.usersService.touchActivity(userId);

    return { message: 'Activity recorded' };
  }

  async refresh(dto: RefreshTokenDto) {
    const storedToken = await this.refreshTokenModel.findOneAndUpdate(
      {
        tokenHash: this.hashToken(dto.refreshToken),
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { revokedAt: new Date() } },
      { new: true },
    );

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(
      storedToken.userId.toString(),
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account not found or inactive');
    }

    assertNotIdle(user.lastActivityAt, this.idleTimeoutMs);

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      idleTimeoutSeconds: Math.round(this.idleTimeoutMs / 1000),
      user: this.sanitizeUser(user),
    };
  }

  async logout(user: AuthenticatedUser | undefined, dto: LogoutDto) {
    const userId = user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    if (user.jti) {
      await this.revokedTokenModel.updateOne(
        { jti: user.jti },
        {
          $set: {
            jti: user.jti,
            expiresAt: new Date(
              Date.now() + AuthService.ACCESS_TOKEN_TTL_SECONDS * 1000,
            ),
          },
        },
        { upsert: true },
      );
    }

    if (dto.refreshToken) {
      await this.refreshTokenModel.updateOne(
        {
          tokenHash: this.hashToken(dto.refreshToken),
          userId,
        },
        { $set: { revokedAt: new Date() } },
      );
    }

    return { message: 'Logged out successfully' };
  }

  async getMe(user: AuthenticatedUser | undefined) {
    const userId = user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const currentUser = await this.usersService.findById(userId);

    if (!currentUser || !currentUser.isActive) {
      throw new UnauthorizedException('User account not found or inactive');
    }

    assertNotIdle(currentUser.lastActivityAt, this.idleTimeoutMs);

    return {
      user: this.sanitizeUser(currentUser),
      idleTimeoutSeconds: Math.round(this.idleTimeoutMs / 1000),
    };
  }

  private async issueTokens(user: any) {
    const jti = randomUUID();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
        branchId: user.branchId.toString(),
      },
      {
        expiresIn: AuthService.ACCESS_TOKEN_TTL_SECONDS,
        jwtid: jti,
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: new Date(
        Date.now() + AuthService.REFRESH_TOKEN_TTL_SECONDS * 1000,
      ),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: AuthService.ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sanitizeUser(user: any) {
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      branchId: user.branchId.toString(),
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      lastActivityAt: user.lastActivityAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
