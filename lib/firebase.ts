'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  Product,
  CategoryId,
  CATEGORIES,
  PRODUCTS,
  normalizeProductRecord,
} from '@/data/products';
import { CategoryRecord } from '@/lib/catalog-store';

// Initialize Firebase App & Services
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Bootstrapped Studio Owner Email from Runtime
export const BOOTSTRAPPED_ADMIN_EMAIL = 'ishvarkalwa001@gmail.com';

// Valid ID Regex & MaxLength Constants (Synchronized verbatim with firebase-blueprint.json)
export const BLUEPRINT_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
export const MAX_ID_LENGTH = 128;
export const MAX_PRODUCT_NAME_LENGTH = 200;
export const MAX_PRODUCT_QUANTITY_LENGTH = 100;
export const MAX_PRODUCT_MATERIAL_LENGTH = 200;
export const MAX_CATEGORY_LENGTH = 64;
export const MAX_CATEGORY_LABEL_LENGTH = 100;
export const MAX_PRICE_LENGTH = 100;
export const MAX_SUBTITLE_LENGTH = 300;
export const MAX_ORIGIN_LENGTH = 200;
export const MAX_STANDARD_FORMAT_LENGTH = 200;
export const MAX_THICKNESS_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MAX_IMAGE_URL_LENGTH = 1500;
export const MAX_ARRAY_ITEMS = 10;
export const MAX_CATEGORY_DESC_LENGTH = 600;
export const MAX_ENQUIRY_NAME_LENGTH = 120;
export const MAX_ENQUIRY_PHONE_LENGTH = 40;
export const MAX_ENQUIRY_COMPANY_LENGTH = 150;
export const MAX_ENQUIRY_PROJECT_TYPE_LENGTH = 100;
export const MAX_ENQUIRY_MATERIAL_LENGTH = 200;
export const MAX_ENQUIRY_QUANTITY_LENGTH = 100;
export const MAX_ENQUIRY_MESSAGE_LENGTH = 2000;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on Initial Boot
let connectionTested = false;
export async function testConnection(): Promise<void> {
  if (connectionTested || typeof window === 'undefined') return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

if (typeof window !== 'undefined') {
  testConnection();
}

// Defensive Sanitization Helpers Matching firebase-blueprint.json
export function sanitizeDocumentId(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, MAX_ID_LENGTH);
  return cleaned && BLUEPRINT_ID_REGEX.test(cleaned) ? cleaned : `item-${Date.now()}`;
}

function clampString(val: string | undefined, maxLen: number, fallback = ''): string {
  const str = (val ?? fallback).trim();
  return str.slice(0, maxLen);
}

function sanitizeStringList(arr: string[] | undefined, maxItems: number, maxStrLen: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => String(s || '').trim().slice(0, maxStrLen))
    .filter((s) => s.length >= 1)
    .slice(0, maxItems);
}

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export async function checkIsFirestoreAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) return true;
  const adminPath = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, adminPath);
  }
}

export function subscribePublicProducts(
  onData: (products: Product[]) => void
): Unsubscribe {
  const path = 'products';
  const q = query(collection(db, path), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) return;
      const items: Product[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push(
          normalizeProductRecord({
            id: String(d.id || docSnap.id),
            name: String(d.name || ''),
            category: d.category as CategoryId,
            categoryLabel: String(d.categoryLabel || ''),
            quantity: d.quantity ? String(d.quantity) : undefined,
            material: d.material ? String(d.material) : undefined,
            imageFitMode:
              d.imageFitMode === 'original' ? 'original' : 'edge-to-edge',
            price: String(d.price || 'Price on Request'),
            subtitle: String(d.subtitle || ''),
            origin: String(d.origin || ''),
            finishes: Array.isArray(d.finishes) ? d.finishes : [],
            standardFormat: String(d.standardFormat || ''),
            thickness: String(d.thickness || ''),
            applications: Array.isArray(d.applications) ? d.applications : [],
            description: String(d.description || ''),
            image: String(d.image || ''),
            detailImage: String(d.detailImage || d.image || ''),
            images: Array.isArray(d.images) ? d.images : [String(d.image || '')],
            bookmatched: Boolean(d.bookmatched),
            featured: Boolean(d.featured),
          })
        );
      });
      if (items.length > 0) {
        onData(items);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribePublicCategories(
  onData: (categories: CategoryRecord[]) => void
): Unsubscribe {
  const path = 'categories';
  const q = query(collection(db, path), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) return;
      const loadedMap = new Map<CategoryId, CategoryRecord>();
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const catId = (d.id || docSnap.id) as CategoryId;
        loadedMap.set(catId, {
          id: catId,
          label: String(d.label || ''),
          icon: String(d.icon || 'Layers'),
          description: String(d.description || ''),
        });
      });
      if (loadedMap.size > 0) {
        const merged = CATEGORIES.map((base) => loadedMap.get(base.id) || { ...base });
        onData(merged);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveProductToFirestore(
  product: Product,
  isUpdate = false
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    return;
  }

  const cleanId = sanitizeDocumentId(product.id);
  const path = `products/${cleanId}`;
  const docRef = doc(db, 'products', cleanId);

  const imagesList = sanitizeStringList(
    product.images && product.images.length > 0 ? product.images : [product.image],
    MAX_ARRAY_ITEMS,
    MAX_IMAGE_URL_LENGTH
  );
  const primaryImage = clampString(
    imagesList[0] || product.image,
    MAX_IMAGE_URL_LENGTH,
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85'
  );
  const detailImage = clampString(
    product.detailImage || imagesList[1] || primaryImage,
    MAX_IMAGE_URL_LENGTH,
    primaryImage
  );

  let existingSnap;
  try {
    existingSnap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const normalized = normalizeProductRecord(product);
  const fitMode =
    normalized.imageFitMode === 'original' ? 'original' : 'edge-to-edge';

  if (existingSnap && existingSnap.exists() && isUpdate) {
    const existingData = existingSnap.data();
    const updatePayload = {
      name: clampString(normalized.name, MAX_PRODUCT_NAME_LENGTH, 'Untitled Piece'),
      category: normalized.category,
      categoryLabel: clampString(normalized.categoryLabel, MAX_CATEGORY_LABEL_LENGTH, 'Console Table'),
      quantity: clampString(normalized.quantity, MAX_PRODUCT_QUANTITY_LENGTH, '1 Piece'),
      material: clampString(normalized.material, MAX_PRODUCT_MATERIAL_LENGTH, 'Natural Marble'),
      imageFitMode: fitMode,
      price: clampString(normalized.price, MAX_PRICE_LENGTH, 'Price on Request'),
      subtitle: clampString(normalized.subtitle, MAX_SUBTITLE_LENGTH, ''),
      origin: clampString(normalized.origin, MAX_ORIGIN_LENGTH, ''),
      finishes: sanitizeStringList(normalized.finishes, MAX_ARRAY_ITEMS, 100),
      standardFormat: clampString(normalized.standardFormat, MAX_STANDARD_FORMAT_LENGTH, ''),
      thickness: clampString(normalized.thickness, MAX_THICKNESS_LENGTH, ''),
      applications: sanitizeStringList(normalized.applications, MAX_ARRAY_ITEMS, 100),
      description: clampString(normalized.description, MAX_DESCRIPTION_LENGTH, ''),
      image: primaryImage,
      detailImage,
      images: imagesList.length > 0 ? imagesList : [primaryImage],
      bookmatched: Boolean(normalized.bookmatched),
      featured: Boolean(normalized.featured),
      isPublic: true,
      updatedAt: serverTimestamp(),
    };

    // Only use updateDoc if authorId matches currentUser.uid per immutable authorId rule
    if (existingData.authorId === currentUser.uid) {
      try {
        await updateDoc(docRef, updatePayload);
        return;
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }
  }

  const createPayload = {
    id: cleanId,
    name: clampString(normalized.name, MAX_PRODUCT_NAME_LENGTH, 'Untitled Piece'),
    category: normalized.category,
    categoryLabel: clampString(normalized.categoryLabel, MAX_CATEGORY_LABEL_LENGTH, 'Console Table'),
    quantity: clampString(normalized.quantity, MAX_PRODUCT_QUANTITY_LENGTH, '1 Piece'),
    material: clampString(normalized.material, MAX_PRODUCT_MATERIAL_LENGTH, 'Natural Marble'),
    imageFitMode: fitMode,
    price: clampString(normalized.price, MAX_PRICE_LENGTH, 'Price on Request'),
    subtitle: clampString(normalized.subtitle, MAX_SUBTITLE_LENGTH, ''),
    origin: clampString(normalized.origin, MAX_ORIGIN_LENGTH, ''),
    finishes: sanitizeStringList(normalized.finishes, MAX_ARRAY_ITEMS, 100),
    standardFormat: clampString(normalized.standardFormat, MAX_STANDARD_FORMAT_LENGTH, ''),
    thickness: clampString(normalized.thickness, MAX_THICKNESS_LENGTH, ''),
    applications: sanitizeStringList(normalized.applications, MAX_ARRAY_ITEMS, 100),
    description: clampString(normalized.description, MAX_DESCRIPTION_LENGTH, ''),
    image: primaryImage,
    detailImage,
    images: imagesList.length > 0 ? imagesList : [primaryImage],
    bookmatched: Boolean(normalized.bookmatched),
    featured: Boolean(normalized.featured),
    isPublic: true,
    authorId: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, createPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const cleanId = sanitizeDocumentId(productId);
  const path = `products/${cleanId}`;
  try {
    await deleteDoc(doc(db, 'products', cleanId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCategoryToFirestore(category: CategoryRecord): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  const cleanId = sanitizeDocumentId(category.id);
  const path = `categories/${cleanId}`;
  const docRef = doc(db, 'categories', cleanId);

  let existingSnap;
  try {
    existingSnap = await getDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (existingSnap && existingSnap.exists() && existingSnap.data().authorId === currentUser.uid) {
    try {
      await updateDoc(docRef, {
        label: clampString(category.label, MAX_CATEGORY_LABEL_LENGTH, category.id),
        icon: clampString(category.icon, MAX_CATEGORY_LENGTH, 'Layers'),
        description: clampString(category.description, MAX_CATEGORY_DESC_LENGTH, 'Handcrafted marble collection.'),
        isPublic: true,
        updatedAt: serverTimestamp(),
      });
      return;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  try {
    await setDoc(docRef, {
      id: cleanId,
      label: clampString(category.label, MAX_CATEGORY_LABEL_LENGTH, category.id),
      icon: clampString(category.icon, MAX_CATEGORY_LENGTH, 'Layers'),
      description: clampString(category.description, MAX_CATEGORY_DESC_LENGTH, 'Handcrafted marble collection.'),
      isPublic: true,
      authorId: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function seedCatalogToFirestore(
  productsToSeed: Product[] = PRODUCTS,
  categoriesToSeed: CategoryRecord[] = [...CATEGORIES]
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return;

  for (const cat of categoriesToSeed) {
    await saveCategoryToFirestore(cat);
  }
  for (const prod of productsToSeed) {
    await saveProductToFirestore(prod, false);
  }
}

export interface EnquiryRecord {
  id: string;
  name: string;
  phone: string;
  company: string;
  projectType: string;
  material: string;
  quantity: string;
  message: string;
  status: 'new' | 'reviewed' | 'completed';
  authorId: string;
  createdAt?: string;
}

export async function saveEnquiryToFirestore(input: {
  name: string;
  phone: string;
  company?: string;
  projectType: string;
  material: string;
  quantity?: string;
  message?: string;
}): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) {
    // Only authenticated + emailVerified users write directly to Firestore per security rules
    return;
  }

  const enquiryId = sanitizeDocumentId(`enq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const path = `enquiries/${enquiryId}`;

  const payload = {
    id: enquiryId,
    name: clampString(input.name, MAX_ENQUIRY_NAME_LENGTH, 'Client'),
    phone: clampString(input.phone, MAX_ENQUIRY_PHONE_LENGTH, '00000'),
    company: clampString(input.company, MAX_ENQUIRY_COMPANY_LENGTH, ''),
    projectType: clampString(input.projectType, MAX_ENQUIRY_PROJECT_TYPE_LENGTH, 'Residential'),
    material: clampString(input.material, MAX_ENQUIRY_MATERIAL_LENGTH, 'Bespoke Marble'),
    quantity: clampString(input.quantity, MAX_ENQUIRY_QUANTITY_LENGTH, ''),
    message: clampString(input.message, MAX_ENQUIRY_MESSAGE_LENGTH, ''),
    status: 'new' as const,
    authorId: currentUser.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'enquiries', enquiryId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchAdminEnquiriesFromFirestore(): Promise<EnquiryRecord[]> {
  const currentUser = auth.currentUser;
  if (!currentUser || !currentUser.emailVerified) return [];

  const path = 'enquiries';
  try {
    const q =
      currentUser.email === BOOTSTRAPPED_ADMIN_EMAIL
        ? query(collection(db, path))
        : query(collection(db, path), where('authorId', '==', currentUser.uid));
    const snap = await getDocs(q);
    const list: EnquiryRecord[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const ts = d.createdAt as Timestamp | undefined;
      list.push({
        id: String(d.id || docSnap.id),
        name: String(d.name || ''),
        phone: String(d.phone || ''),
        company: String(d.company || ''),
        projectType: String(d.projectType || ''),
        material: String(d.material || ''),
        quantity: String(d.quantity || ''),
        message: String(d.message || ''),
        status: (d.status as 'new' | 'reviewed' | 'completed') || 'new',
        authorId: String(d.authorId || ''),
        createdAt: ts && typeof ts.toDate === 'function' ? ts.toDate().toISOString() : undefined,
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}
