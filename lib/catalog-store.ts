import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import {
  PRODUCTS,
  CATEGORIES,
  Product,
  CategoryId,
  normalizeProductRecord,
} from '@/data/products';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'catalog-store.json');

export interface CategoryRecord {
  id: CategoryId;
  label: string;
  icon: string;
  description: string;
}

export interface CatalogStoreData {
  adminPinHash: string;
  products: Product[];
  categories: CategoryRecord[];
  updatedAt: string;
}

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET || 'huda-homes-architectural-admin-secret-2026';

export function hashPin(pin: string): string {
  return crypto.createHash('sha256').update(`huda_pin:${pin.trim()}`).digest('hex');
}

function getDefaultPinHash(): string {
  const initialPin = process.env.ADMIN_INITIAL_PIN || '0000';
  return hashPin(initialPin);
}

export function createAdminSessionToken(pinHash: string): string {
  const payload = JSON.stringify({
    role: 'owner',
    iat: Date.now(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    ph: pinHash.slice(0, 16),
  });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined, currentPinHash: string): boolean {
  if (!token || !token.includes('.')) return false;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSignature) return false;

  try {
    const decoded = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (!decoded || decoded.role !== 'owner') return false;
    if (typeof decoded.exp !== 'number' || Date.now() > decoded.exp) return false;
    if (decoded.ph !== currentPinHash.slice(0, 16)) return false;
    return true;
  } catch {
    return false;
  }
}

export function isRequestAuthorized(req: NextRequest): boolean {
  const store = readCatalogStore();

  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (verifyAdminSessionToken(bearerToken, store.adminPinHash)) {
      return true;
    }
  }

  const cookieToken = req.cookies.get('huda_admin_session')?.value;
  if (verifyAdminSessionToken(cookieToken, store.adminPinHash)) {
    return true;
  }

  return false;
}

export function readCatalogStore(): CatalogStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<CatalogStoreData>;
      if (Array.isArray(parsed.products) && parsed.products.length > 0) {
        return {
          adminPinHash: parsed.adminPinHash || getDefaultPinHash(),
          products: parsed.products.map((p) => normalizeProductRecord(p)),
          categories:
            Array.isArray(parsed.categories) && parsed.categories.length === 8
              ? parsed.categories
              : [...CATEGORIES],
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Error reading catalog store, initializing default seed:', err);
  }

  const initialData: CatalogStoreData = {
    adminPinHash: getDefaultPinHash(),
    products: [...PRODUCTS],
    categories: [...CATEGORIES],
    updatedAt: new Date().toISOString(),
  };

  writeCatalogStore(initialData);
  return initialData;
}

export function writeCatalogStore(data: CatalogStoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const updated: CatalogStoreData = {
      ...data,
      products: data.products.map((p) => normalizeProductRecord(p)),
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write catalog store:', err);
  }
}
