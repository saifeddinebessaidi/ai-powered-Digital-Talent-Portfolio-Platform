import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

interface AuthedRequest extends Request {
  userId?: string;
}

/**
 * Verifies a signed token issued by the host app and resolves `userId`.
 * The host app and this API share HOST_JWT_SECRET.
 */
@Injectable()
export class HostJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();

    // Dev-only bypass: skip JWT verification and use a fixed user id.
    // Set DISABLE_AUTH=true in apps/api/.env for local testing. Re-enable by
    // removing it (or setting it to anything other than "true").
    if (process.env.DISABLE_AUTH === 'true') {
      req.userId = process.env.DEV_USER_ID ?? 'dev-user';
      return true;
    }

    const header = req.headers['authorization'];
    const token =
      header && header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException('Missing token');

    try {
      const payload = jwt.verify(
        token,
        process.env.HOST_JWT_SECRET as string,
      ) as { userId?: string; sub?: string };
      req.userId = payload.userId ?? payload.sub;
      if (!req.userId) throw new Error('No userId in token');
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

/** Injects the authenticated host `userId` resolved by HostJwtGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.userId as string;
  },
);
