import { Router, Request, Response } from 'express';
import { registerUser, loginUser, verifySession, logoutSession } from '../services/auth.js';

export const authRouter = Router();

authRouter.post('/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, role, companyName, preferredCurrency } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const result = registerUser({
      name,
      email,
      password,
      role,
      companyName,
      preferredCurrency,
    });
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = loginUser(email, password);
    return res.json(result);
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
});

authRouter.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const user = verifySession(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid.' });
  }

  return res.json({ user });
});

authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    logoutSession(token);
  }
  return res.json({ success: true });
});
