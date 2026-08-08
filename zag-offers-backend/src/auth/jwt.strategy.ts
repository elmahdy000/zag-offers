import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import type { Request } from 'express';

function extractTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('auth_token='));
  return tokenCookie ? decodeURIComponent(tokenCookie.slice('auth_token='.length)) : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractTokenFromCookie,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; tokenVersion?: number }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.tokenVersion !== (payload.tokenVersion ?? 0)) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
