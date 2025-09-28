import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import { Request } from 'express';

interface JWTPayload {
  sub: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET não foi definido no arquivo .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const token = (req.cookies as Record<string, string>)?.[
            'access_token'
          ];
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JWTPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token inválido ou malformado.');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
