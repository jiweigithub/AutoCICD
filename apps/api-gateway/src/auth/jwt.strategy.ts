import { Injectable } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
  iat: number;
  exp: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as JwtPayload;
    return {
      sub: parsed.sub ?? '',
      username: parsed.username ?? '',
      roles: parsed.roles ?? [],
      iat: typeof parsed.iat === 'number' ? parsed.iat : 0,
      exp: typeof parsed.exp === 'number' ? parsed.exp : 0,
    };
  } catch {
    return null;
  }
}

@Injectable()
export class JwtStrategy {
  validateToken(token: string): JwtPayload | null {
    const payload = decodeJwtPayload(token);
    if (!payload) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  }
}
