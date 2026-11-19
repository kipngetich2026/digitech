import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/users.service';
import {
  RevokedToken,
  RevokedTokenDocument,
} from '../schemas/revoked-token.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  branchId: string;
  jti?: string;
}

function readIdleTimeoutMs(configService: ConfigService): number {
  const raw = configService.get<string>('IDLE_TIMEOUT_MINUTES');
  const minutes = Number.parseInt(raw ?? '', 10);
  const safe = Number.isFinite(minutes) && minutes > 0 ? minutes : 30;
  return safe * 60 * 1000;
}

function assertNotIdle(
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
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectModel(RevokedToken.name)
    private readonly revokedTokenModel: Model<RevokedTokenDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: JwtPayload) {
    if (
      payload.jti &&
      (await this.revokedTokenModel.exists({ jti: payload.jti }))
    ) {
      throw new UnauthorizedException(
        'Session has ended. Please sign in again',
      );
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    assertNotIdle(user.lastActivityAt, readIdleTimeoutMs(this.configService));

    return {
      sub: user._id.toString(),
      id: user._id.toString(),
      jti: payload.jti,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      branchId: user.branchId.toString(),
    };
  }
}
