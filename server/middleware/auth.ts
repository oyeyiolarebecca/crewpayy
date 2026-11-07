import { NextFunction, Request, Response } from 'express';
import { User, verifySession } from '../services/auth.js';

export interface AuthenticatedRequest extends Request {
    user?: User;
}

function readBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header) return null;

    const [scheme, token, ...extra] = header.trim().split(/\s+/);
    if (scheme !== 'Bearer' || !token || extra.length > 0) return null;
    return token;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const token = readBearerToken(req);
    const user = token ? verifySession(token) : null;
    if (!user) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    req.user = user;
    return next();
}

export function requireCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (req.user?.role !== 'company') {
        return res.status(403).json({ error: 'Company authorization required.' });
    }
    return next();
}