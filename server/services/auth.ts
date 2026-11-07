import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'company' | 'employee';
  companyName: string;
  department?: string;
  jobTitle?: string;
  preferredCurrency: string;
  createdAt: string;
}

interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

const users = new Map<string, StoredUser>();
const sessions = new Map<string, { userId: string; expiresAt: number }>();
const PASSWORD_ITERATIONS = 210_000;

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 64, 'sha512').toString('hex');
}

function generateToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  sessions.set(token, { userId, expiresAt });
  return token;
}

// Seed default users
function seedDefaultUsers() {
  const defaultSalt = 'crewpay_default_salt';
  const employer: StoredUser = {
    id: 'usr_employer_1',
    name: 'Sarah Chen',
    email: 'admin@acme.global',
    role: 'company',
    companyName: 'Acme Global Inc.',
    preferredCurrency: 'USD',
    createdAt: new Date().toISOString(),
    salt: defaultSalt,
    passwordHash: hashPassword('password123', defaultSalt),
  };

  const employee: StoredUser = {
    id: 'usr_employee_1',
    name: 'Amara Okafor',
    email: 'amara@acme.global',
    role: 'employee',
    companyName: 'Acme Global Inc.',
    department: 'Engineering',
    jobTitle: 'Principal Staff Engineer',
    preferredCurrency: 'GBP',
    createdAt: new Date().toISOString(),
    salt: defaultSalt,
    passwordHash: hashPassword('password123', defaultSalt),
  };

  users.set(employer.email.toLowerCase(), employer);
  users.set(employee.email.toLowerCase(), employee);
}

seedDefaultUsers();

export function registerUser(params: {
  name: string;
  email: string;
  password: string;
  role: 'company' | 'employee';
  companyName: string;
  preferredCurrency?: string;
}): { user: User; token: string } {
  const normalizedEmail = params.email.trim().toLowerCase();
  if (!params.name.trim() || !normalizedEmail || params.password.length < 12) {
    throw new Error('Name, email, and a password of at least 12 characters are required.');
  }
  if (users.has(normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(params.password, salt);
  const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newUser: StoredUser = {
    id,
    name: params.name.trim(),
    email: normalizedEmail,
    role: params.role,
    companyName: params.companyName.trim() || 'Global Distributed Ltd',
    preferredCurrency: params.preferredCurrency || 'USD',
    createdAt: new Date().toISOString(),
    salt,
    passwordHash,
  };

  users.set(normalizedEmail, newUser);
  const token = generateToken(newUser.id);
  const { salt: _, passwordHash: __, ...publicUser } = newUser;
  return { user: publicUser, token };
}

export function loginUser(email: string, password: string): { user: User; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const stored = users.get(normalizedEmail);
  if (!stored) {
    throw new Error('Invalid email or password.');
  }

  const calculatedHash = Buffer.from(hashPassword(password, stored.salt), 'hex');
  const expectedHash = Buffer.from(stored.passwordHash, 'hex');
  if (calculatedHash.length !== expectedHash.length || !crypto.timingSafeEqual(calculatedHash, expectedHash)) {
    throw new Error('Invalid email or password.');
  }

  const token = generateToken(stored.id);
  const { salt: _, passwordHash: __, ...publicUser } = stored;
  return { user: publicUser, token };
}

export function verifySession(token: string): User | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  for (const user of users.values()) {
    if (user.id === session.userId) {
      const { salt: _, passwordHash: __, ...publicUser } = user;
      return publicUser;
    }
  }
  return null;
}

export function logoutSession(token: string): void {
  sessions.delete(token);
}
