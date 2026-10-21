'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X,
  Lock,
  LogOut,
  Plus,
  LayoutGrid,
  Package,
  FolderKanban,
  Upload,
  Camera,
  Trash2,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  Sparkles,
  CloudUpload,
  ShieldCheck,
  Layers,
  Merge,
  Split,
  RefreshCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  CATEGORIES,
  CategoryId,
  ImageFitMode,
  Product,
  normalizeProductRecord,
} from '@/data/products';
import { CategoryRecord } from '@/lib/catalog-store';
import { useFirebase } from '@/components/FirebaseProvider';
import {
  saveProductToFirestore,
  deleteProductFromFirestore,
  saveCategoryToFirestore,
  seedCatalogToFirestore,
  MAX_PRODUCT_NAME_LENGTH,
  MAX_PRODUCT_QUANTITY_LENGTH,
  MAX_PRODUCT_MATERIAL_LENGTH,
  MAX_IMAGE_URL_LENGTH,
  MAX_CATEGORY_DESC_LENGTH,
} from '@/lib/firebase';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: CategoryRecord[];
  onCatalogUpdated: (nextProducts: Product[], nextCategories?: CategoryRecord[]) => void;
}

type AdminTab =
  | 'overview'
  | 'manage-products'
  | 'add-product'
  | 'bulk-upload'
  | 'manage-categories';

interface BulkProductDraft {
  clientId: string;
  category: CategoryId;
  images: string[];
  name: string;
  quantity: string;
  material: string;
  imageFitMode: ImageFitMode;
  selectedForMerge: boolean;
  status: 'draft' | 'saving' | 'saved' | 'failed';
  errorMessage?: string;
}

const ADMIN_TOKEN_STORAGE_KEY = 'huda_admin_session_token';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_SET = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const QUANTITY_PRESETS = [
  '1 Piece',
  '2 Pieces',
  '1 Pair (2 Pieces)',
  '1 Set (4 Pieces)',
  '1 Complete Set',
  '1 Monolithic Slab',
];

const MATERIAL_PRESETS = [
  'Italian Statuario White Marble',
  'Makrana Pure White Marble',
  'Calacatta Oro Marble',
  'Calacatta Viola Marble',
  'Natural Roman Travertine',
  'Spanish Nero Marquina Black Marble',
  'Botticino Classico Marble',
  'Verde Alpi Green Marble',
  'Translucent Natural Onyx',
];

function deriveDefaultNameFromFilename(filename: string): string {
  const base = filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!base) return '';
  return base.replace(/\b\w/g, (ch) => ch.toUpperCase()).slice(0, MAX_PRODUCT_NAME_LENGTH);
}

export default function AdminPanelModal({
  isOpen,
  onClose,
  products,
  categories,
  onCatalogUpdated,
}: AdminPanelModalProps) {
  const { user: firebaseUser, isFirestoreAdmin, signInWithGoogle, signOutUser } = useFirebase();

  const [sessionToken, setSessionToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [pinAuthenticated, setPinAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [googleAuthLoading, setGoogleAuthLoading] = useState<boolean>(false);
  const [syncingFirestore, setSyncingFirestore] = useState<boolean>(false);

  const authenticated = pinAuthenticated || isFirestoreAdmin;

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [filterCategory, setFilterCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Single Product Add / Edit State (Strictly 3 Information Fields + Category + Photographs + Showcase Mode)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [productCategory, setProductCategory] = useState<CategoryId>('console-table');
  const [productQuantity, setProductQuantity] = useState<string>('1 Piece');
  const [productMaterial, setProductMaterial] = useState<string>('');
  const [productImageFitMode, setProductImageFitMode] =
    useState<ImageFitMode>('edge-to-edge');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [externalImageUrlInput, setExternalImageUrlInput] = useState<string>('');

  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [savingProduct, setSavingProduct] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Bulk Upload State (Step 1 -> Step 2 -> Step 3 -> Step 4)
  const [bulkCategory, setBulkCategory] = useState<CategoryId>('console-table');
  const [bulkImageFitMode, setBulkImageFitMode] =
    useState<ImageFitMode>('edge-to-edge');
  const [bulkItems, setBulkItems] = useState<BulkProductDraft[]>([]);
  const [bulkUploadingPhotos, setBulkUploadingPhotos] = useState<boolean>(false);
  const [bulkUploadProgressText, setBulkUploadProgressText] = useState<string>('');
  const [bulkSavingAll, setBulkSavingAll] = useState<boolean>(false);
  const [bulkRejectedWarnings, setBulkRejectedWarnings] = useState<string[]>([]);
  const [bulkDragActive, setBulkDragActive] = useState<boolean>(false);
  const [activeRowAddPhotoId, setActiveRowAddPhotoId] = useState<string | null>(null);

  // Category Edit State
  const [editingCatId, setEditingCatId] = useState<CategoryId | null>(null);
  const [editingCatDesc, setEditingCatDesc] = useState<string>('');
  const [savingCategory, setSavingCategory] = useState<boolean>(false);

  // Change PIN State
  const [showChangePin, setShowChangePin] = useState<boolean>(false);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [pinChangeLoading, setPinChangeLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const bulkCameraInputRef = useRef<HTMLInputElement>(null);
  const rowExtraPhotoInputRef = useRef<HTMLInputElement>(null);

  const persistToken = useCallback((nextToken: string) => {
    setSessionToken(nextToken);
    if (typeof window !== 'undefined') {
      try {
        if (nextToken) {
          localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, nextToken);
        } else {
          localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        }
      } catch {
        // Ignore storage restrictions
      }
    }
  }, []);

  // Authenticated fetch helper that always sends both Cookie credentials and Bearer token
  const adminFetch = useCallback(
    async (url: string, init: RequestInit = {}): Promise<Response> => {
      const headers = new Headers(init.headers || {});
      const tokenToUse =
        sessionToken ||
        (typeof window !== 'undefined'
          ? localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || ''
          : '');
      if (tokenToUse) {
        headers.set('Authorization', `Bearer ${tokenToUse}`);
      }
      return fetch(url, {
        ...init,
        headers,
        credentials: 'include',
      });
    },
    [sessionToken]
  );

  // Verify existing session when modal opens without resetting active authenticated sessions
  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    const verifySession = async () => {
      try {
        const storedToken =
          sessionToken ||
          (typeof window !== 'undefined'
            ? localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || ''
            : '');
        const headers: Record<string, string> = {};
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        const res = await fetch('/api/admin/auth', {
          headers,
          credentials: 'include',
        });
        const data = await res.json();
        if (!active) return;

        if (data.authenticated) {
          setPinAuthenticated(true);
        } else if (isFirestoreAdmin && firebaseUser?.email) {
          // Automatically issue a server session token for verified Firebase Studio Owner
          const linkRes = await fetch('/api/admin/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              action: 'firebase-owner-session',
              email: firebaseUser.email,
            }),
          });
          const linkData = await linkRes.json();
          if (active && linkRes.ok && linkData.authenticated) {
            if (linkData.token) persistToken(linkData.token);
            setPinAuthenticated(true);
          }
        } else {
          setPinAuthenticated(false);
          if (storedToken) persistToken('');
        }
      } catch {
        // Keep current state on transient network hiccup so admin is never logged out unexpectedly
      } finally {
        if (active) setCheckingAuth(false);
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [isOpen, isFirestoreAdmin, firebaseUser, sessionToken, persistToken]);

  // Prevent background page scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const normalizedProducts = useMemo(
    () => products.map((p) => normalizeProductRecord(p)),
    [products]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach((c) => {
      counts[c.id] = 0;
    });
    normalizedProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [normalizedProducts, categories]);

  const filteredProducts = useMemo(() => {
    return normalizedProducts.filter((p) => {
      const matchesCat = filterCategory === 'all' || p.category === filterCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.material.toLowerCase().includes(q) ||
        p.quantity.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [normalizedProducts, filterCategory, searchQuery]);

  if (!isOpen) return null;

  const resetProductForm = (defaultCategory?: CategoryId) => {
    setEditingProduct(null);
    setProductName('');
    setProductCategory(defaultCategory || 'console-table');
    setProductQuantity('1 Piece');
    setProductMaterial('');
    setProductImageFitMode('edge-to-edge');
    setProductImages([]);
    setExternalImageUrlInput('');
  };

  const startEditProduct = (prod: Product) => {
    const norm = normalizeProductRecord(prod);
    setEditingProduct(norm);
    setProductName(norm.name);
    setProductCategory(norm.category);
    setProductQuantity(norm.quantity);
    setProductMaterial(norm.material);
    setProductImageFitMode(
      norm.imageFitMode === 'original' ? 'original' : 'edge-to-edge'
    );
    const imgs =
      Array.isArray(norm.images) && norm.images.length > 0
        ? norm.images
        : [
            norm.image,
            ...(norm.detailImage && norm.detailImage !== norm.image ? [norm.detailImage] : []),
          ];
    setProductImages(imgs.filter(Boolean));
    setFeedback(null);
    setActiveTab('add-product');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!pinInput.trim()) {
      setAuthError('Please enter your admin password/PIN.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        setAuthError(data.error || 'Incorrect password/PIN. Please try again.');
        return;
      }
      if (data.token) {
        persistToken(data.token);
      }
      setPinAuthenticated(true);
      setPinInput('');
      setAuthError('');
    } catch {
      setAuthError('Unable to verify password. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setAuthError('');
    setGoogleAuthLoading(true);
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser?.email) {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'firebase-owner-session',
            email: signedInUser.email,
          }),
        });
        const data = await res.json();
        if (res.ok && data.token) {
          persistToken(data.token);
          setPinAuthenticated(true);
        }
      }
    } catch {
      setAuthError('Google sign-in was cancelled or could not complete.');
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminFetch('/api/admin/auth', { method: 'DELETE' });
      if (firebaseUser) {
        await signOutUser();
      }
    } finally {
      persistToken('');
      setPinAuthenticated(false);
      setPinInput('');
      setActiveTab('overview');
      setFeedback(null);
    }
  };

  const handleSyncToFirestore = async () => {
    setFeedback(null);
    setSyncingFirestore(true);
    try {
      if (!firebaseUser) {
        await signInWithGoogle();
      }
      await seedCatalogToFirestore(normalizedProducts, categories);
      setFeedback({
        type: 'success',
        message: `Synced ${normalizedProducts.length} products and ${categories.length} categories to Cloud Firestore!`,
      });
    } catch {
      setFeedback({
        type: 'error',
        message:
          'Sign in with the studio owner Google account to sync products directly to Cloud Firestore.',
      });
    } finally {
      setSyncingFirestore(false);
    }
  };

  // Validate and upload files in chunks for reliability
  const uploadFilesToServer = async (
    rawFiles: File[]
  ): Promise<{
    uploaded: { file: File; url: string }[];
    rejectedReasons: string[];
  }> => {
    const validFiles: File[] = [];
    const rejectedReasons: string[] = [];

    for (const file of rawFiles) {
      const mime = (file.type || '').toLowerCase();
      if (!ALLOWED_MIME_SET.has(mime)) {
        rejectedReasons.push(
          `"${file.name}": Unsupported format (${file.type || 'unknown'}). Allowed: JPG, JPEG, PNG, WebP.`
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const mb = (file.size / (1024 * 1024)).toFixed(1);
        rejectedReasons.push(`"${file.name}" (${mb} MB) exceeds the 10 MB maximum file size.`);
        continue;
      }
      validFiles.push(file);
    }

    const uploaded: { file: File; url: string }[] = [];
    const CHUNK_SIZE = 3;

    for (let i = 0; i < validFiles.length; i += CHUNK_SIZE) {
      const chunk = validFiles.slice(i, i + CHUNK_SIZE);
      setBulkUploadProgressText(
        `Uploading photo ${Math.min(i + 1, validFiles.length)}–${Math.min(
          i + chunk.length,
          validFiles.length
        )} of ${validFiles.length}...`
      );

      const formData = new FormData();
      chunk.forEach((f) => formData.append('files', f));

      const res = await adminFetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        rejectedReasons.push(data.error || 'Failed to upload batch chunk.');
        continue;
      }

      if (Array.isArray(data.rejected)) {
        data.rejected.forEach((rej: { name: string; reason: string }) => {
          rejectedReasons.push(`"${rej.name}": ${rej.reason}`);
        });
      }

      if (Array.isArray(data.uploaded)) {
        data.uploaded.forEach((u: { index: number; url: string }) => {
          const sourceFile = chunk[u.index];
          if (sourceFile && u.url) {
            uploaded.push({ file: sourceFile, url: u.url });
          }
        });
      } else if (Array.isArray(data.urls)) {
        data.urls.forEach((url: string, idx: number) => {
          const sourceFile = chunk[idx];
          if (sourceFile && url) {
            uploaded.push({ file: sourceFile, url });
          }
        });
      }
    }

    setBulkUploadProgressText('');
    return { uploaded, rejectedReasons };
  };

  // Single Product Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setFeedback(null);
    setUploadingImages(true);

    try {
      const { uploaded, rejectedReasons } = await uploadFilesToServer(Array.from(fileList));

      if (uploaded.length > 0) {
        const newUrls = uploaded.map((u) => u.url);
        setProductImages((prev) => [...prev, ...newUrls].slice(0, 10));

        // Auto-fill product name if empty from first uploaded file
        if (!productName.trim() && uploaded[0]?.file?.name) {
          setProductName(deriveDefaultNameFromFilename(uploaded[0].file.name));
        }

        setFeedback({
          type: rejectedReasons.length > 0 ? 'error' : 'success',
          message:
            rejectedReasons.length > 0
              ? `Uploaded ${uploaded.length} photo(s). Skipped: ${rejectedReasons.join(' ')}`
              : `${uploaded.length} photograph(s) uploaded and ready for preview.`,
        });
      } else if (rejectedReasons.length > 0) {
        setFeedback({
          type: 'error',
          message: rejectedReasons.join(' '),
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Network error while uploading image(s). Please try again.',
      });
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleAddExternalImageUrl = () => {
    const trimmed = externalImageUrlInput.trim().slice(0, MAX_IMAGE_URL_LENGTH);
    if (!trimmed) return;
    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('/')
    ) {
      setFeedback({
        type: 'error',
        message: 'Please enter a valid image URL starting with https:// or /',
      });
      return;
    }
    setProductImages((prev) => [...prev, trimmed].slice(0, 10));
    setExternalImageUrlInput('');
    setFeedback(null);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setProductImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimaryImage = (indexToPromote: number) => {
    setProductImages((prev) => {
      const next = [...prev];
      const [selected] = next.splice(indexToPromote, 1);
      if (selected) next.unshift(selected);
      return next;
    });
  };

  // Save Single Product (Strictly validates the 3 required fields + at least 1 photo, keeps admin logged in)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!productName.trim()) {
      setFeedback({
        type: 'error',
        message: 'Product Name is required. Please enter the product name.',
      });
      return;
    }

    if (!productQuantity.trim()) {
      setFeedback({
        type: 'error',
        message: 'Quantity is required (e.g., 1 Piece, 2 Units, 1 Set).',
      });
      return;
    }

    if (!productMaterial.trim()) {
      setFeedback({
        type: 'error',
        message: 'Material is required (e.g., Italian Statuario White Marble).',
      });
      return;
    }

    if (productImages.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Please upload or add at least one product photograph before saving.',
      });
      return;
    }

    setSavingProduct(true);
    try {
      const isEditing = Boolean(editingProduct);
      const res = await adminFetch('/api/products', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct?.id,
          name: productName.trim(),
          category: productCategory,
          quantity: productQuantity.trim(),
          material: productMaterial.trim(),
          imageFitMode: productImageFitMode,
          images: productImages,
          image: productImages[0],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error || 'Could not save product.',
        });
        return;
      }

      if (data.product && isFirestoreAdmin) {
        try {
          await saveProductToFirestore(data.product as Product, isEditing);
        } catch {
          // Handled via handleFirestoreError
        }
      }

      if (Array.isArray(data.products)) {
        onCatalogUpdated(data.products);
      }

      const categoryLabel =
        categories.find((c) => c.id === productCategory)?.label || 'catalogue';

      setFeedback({
        type: 'success',
        message: isEditing
          ? `"${productName.trim()}" updated successfully in ${categoryLabel}. You remain logged in.`
          : `"${productName.trim()}" published live under ${categoryLabel}! Ready to add another product.`,
      });

      if (!isEditing) {
        resetProductForm(productCategory);
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'An unexpected error occurred while saving the product.',
      });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    setDeletingId(prod.id);
    setFeedback(null);
    try {
      const res = await adminFetch(`/api/products?id=${encodeURIComponent(prod.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to delete product.',
        });
        return;
      }
      if (isFirestoreAdmin) {
        try {
          await deleteProductFromFirestore(prod.id);
        } catch {
          // Handled via handleFirestoreError
        }
      }
      if (Array.isArray(data.products)) {
        onCatalogUpdated(data.products);
      }
      setFeedback({
        type: 'success',
        message: `"${prod.name}" has been removed from the catalogue.`,
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Error removing product.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================================
  // BULK UPLOAD WORKFLOW HANDLERS (Requirement 6)
  // =========================================================================
  const handleBulkFilesSelected = async (files: File[]) => {
    if (!files || files.length === 0) return;

    setFeedback(null);
    setBulkRejectedWarnings([]);
    setBulkUploadingPhotos(true);

    try {
      const { uploaded, rejectedReasons } = await uploadFilesToServer(files);

      if (rejectedReasons.length > 0) {
        setBulkRejectedWarnings(rejectedReasons);
      }

      if (uploaded.length > 0) {
        const newDrafts: BulkProductDraft[] = uploaded.map(({ file, url }, index) => ({
          clientId: `bulk-${Date.now().toString(36)}-${index}-${Math.random()
            .toString(36)
            .slice(2, 6)}`,
          category: bulkCategory,
          images: [url],
          name: deriveDefaultNameFromFilename(file.name),
          quantity: '1 Piece',
          material: 'Natural Hand-Carved Marble',
          imageFitMode: bulkImageFitMode,
          selectedForMerge: false,
          status: 'draft',
        }));

        setBulkItems((prev) => [...prev, ...newDrafts]);
        setFeedback({
          type: 'success',
          message: `Added ${newDrafts.length} photograph(s) to the bulk upload batch under ${
            categories.find((c) => c.id === bulkCategory)?.label || bulkCategory
          }. Review or edit each product's Name, Quantity, and Material below.`,
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Error uploading batch photographs. Please try again.',
      });
    } finally {
      setBulkUploadingPhotos(false);
      if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
      if (bulkCameraInputRef.current) bulkCameraInputRef.current.value = '';
    }
  };

  // Add extra photo to an existing bulk product row
  const handleRowExtraPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    const targetId = activeRowAddPhotoId;
    if (!fileList || fileList.length === 0 || !targetId) return;

    setBulkUploadingPhotos(true);
    try {
      const { uploaded, rejectedReasons } = await uploadFilesToServer(Array.from(fileList));
      if (rejectedReasons.length > 0) {
        setBulkRejectedWarnings((prev) => [...prev, ...rejectedReasons]);
      }
      if (uploaded.length > 0) {
        const addedUrls = uploaded.map((u) => u.url);
        setBulkItems((prev) =>
          prev.map((item) =>
            item.clientId === targetId
              ? {
                  ...item,
                  images: [...item.images, ...addedUrls].slice(0, 10),
                  status: item.status === 'saved' ? 'saved' : 'draft',
                }
              : item
          )
        );
      }
    } finally {
      setBulkUploadingPhotos(false);
      setActiveRowAddPhotoId(null);
      if (rowExtraPhotoInputRef.current) rowExtraPhotoInputRef.current.value = '';
    }
  };

  // Update category for bulk batch (applies to unsaved rows in batch)
  const handleBulkCategoryChange = (nextCat: CategoryId) => {
    setBulkCategory(nextCat);
    setBulkItems((prev) =>
      prev.map((item) =>
        item.status === 'saved' ? item : { ...item, category: nextCat }
      )
    );
  };

  // Update photo showcase mode (Edge-to-Edge vs Original Aspect Ratio) for bulk batch
  const handleBulkFitModeChange = (nextMode: ImageFitMode) => {
    setBulkImageFitMode(nextMode);
    setBulkItems((prev) =>
      prev.map((item) =>
        item.status === 'saved' ? item : { ...item, imageFitMode: nextMode }
      )
    );
  };

  const updateBulkItemField = (
    clientId: string,
    updates: Partial<BulkProductDraft>
  ) => {
    setBulkItems((prev) =>
      prev.map((item) =>
        item.clientId === clientId
          ? {
              ...item,
              ...updates,
              status: item.status === 'saved' ? 'saved' : 'draft',
              errorMessage: undefined,
            }
          : item
      )
    );
  };

  const handleRemoveBulkItem = (clientId: string) => {
    setBulkItems((prev) => prev.filter((item) => item.clientId !== clientId));
  };

  const handleRemoveSingleImageFromBulkRow = (clientId: string, imgIdx: number) => {
    setBulkItems((prev) =>
      prev
        .map((item) => {
          if (item.clientId !== clientId) return item;
          const nextImages = item.images.filter((_, i) => i !== imgIdx);
          return { ...item, images: nextImages };
        })
        .filter((item) => item.images.length > 0)
    );
  };

  // Group selected bulk rows into a single multi-photo product record
  const handleGroupSelectedBulkItems = () => {
    const selectedRows = bulkItems.filter(
      (item) => item.selectedForMerge && item.status !== 'saved'
    );
    if (selectedRows.length < 2) {
      setFeedback({
        type: 'error',
        message:
          'Select at least 2 product rows using the checkboxes to group their photographs into one product.',
      });
      return;
    }

    const primaryRow = selectedRows[0];
    const combinedImages = selectedRows
      .flatMap((r) => r.images)
      .slice(0, 10);
    const mergedIds = new Set(selectedRows.slice(1).map((r) => r.clientId));

    setBulkItems((prev) =>
      prev
        .filter((item) => !mergedIds.has(item.clientId))
        .map((item) =>
          item.clientId === primaryRow.clientId
            ? {
                ...item,
                images: combinedImages,
                selectedForMerge: false,
              }
            : item
        )
    );

    setFeedback({
      type: 'success',
      message: `Grouped ${selectedRows.length} rows (${combinedImages.length} photographs) into "${
        primaryRow.name || '1 Product Record'
      }".`,
    });
  };

  // Merge a single row into the row directly above it
  const handleMergeWithPreviousRow = (index: number) => {
    if (index <= 0) return;
    const current = bulkItems[index];
    const prevRow = bulkItems[index - 1];
    if (!current || !prevRow || prevRow.status === 'saved' || current.status === 'saved') {
      return;
    }

    const mergedImages = [...prevRow.images, ...current.images].slice(0, 10);
    setBulkItems((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) =>
          idx === index - 1 ? { ...item, images: mergedImages } : item
        )
    );
  };

  // Ungroup a multi-photo row back into separate single-photo product rows
  const handleUngroupBulkRow = (clientId: string) => {
    const target = bulkItems.find((item) => item.clientId === clientId);
    if (!target || target.images.length <= 1 || target.status === 'saved') return;

    setBulkItems((prev) => {
      const next: BulkProductDraft[] = [];
      for (const item of prev) {
        if (item.clientId !== clientId) {
          next.push(item);
        } else {
          item.images.forEach((imgUrl, idx) => {
            next.push({
              ...item,
              clientId:
                idx === 0
                  ? item.clientId
                  : `${item.clientId}-split-${idx}-${Math.random().toString(36).slice(2, 5)}`,
              images: [imgUrl],
              name: idx === 0 ? item.name : `${item.name} (${idx + 1})`,
              selectedForMerge: false,
            });
          });
        }
      }
      return next;
    });
  };

  // Step 4 — Validate & Save All Pending/Failed Products in the Batch
  const handleSaveAllBulkProducts = async () => {
    setFeedback(null);

    const pendingItems = bulkItems.filter((item) => item.status !== 'saved');
    if (pendingItems.length === 0) {
      setFeedback({
        type: 'error',
        message: 'No unsaved products in the current batch. Select photos to start a new batch.',
      });
      return;
    }

    // Validate all pending rows before sending
    let hasValidationError = false;
    const validatedList = bulkItems.map((item) => {
      if (item.status === 'saved') return item;
      if (!item.name.trim()) {
        hasValidationError = true;
        return {
          ...item,
          status: 'failed' as const,
          errorMessage: 'Product Name is required.',
        };
      }
      if (!item.quantity.trim()) {
        hasValidationError = true;
        return {
          ...item,
          status: 'failed' as const,
          errorMessage: 'Quantity is required.',
        };
      }
      if (!item.material.trim()) {
        hasValidationError = true;
        return {
          ...item,
          status: 'failed' as const,
          errorMessage: 'Material is required.',
        };
      }
      if (item.images.length === 0) {
        hasValidationError = true;
        return {
          ...item,
          status: 'failed' as const,
          errorMessage: 'At least 1 photograph is required.',
        };
      }
      return {
        ...item,
        status: 'saving' as const,
        errorMessage: undefined,
      };
    });

    setBulkItems(validatedList);

    if (hasValidationError) {
      setFeedback({
        type: 'error',
        message:
          'Some products in the batch are missing required fields (Product Name, Quantity, or Material). Please review the highlighted rows below.',
      });
      return;
    }

    setBulkSavingAll(true);
    try {
      const itemsPayload = pendingItems.map((item) => ({
        clientId: item.clientId,
        id: item.clientId,
        name: item.name.trim(),
        category: item.category,
        quantity: item.quantity.trim(),
        material: item.material.trim(),
        imageFitMode: item.imageFitMode,
        images: item.images,
        image: item.images[0],
      }));

      const res = await adminFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-create',
          category: bulkCategory,
          imageFitMode: bulkImageFitMode,
          items: itemsPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok && (!data.savedProducts || data.savedProducts.length === 0)) {
        setBulkItems((prev) =>
          prev.map((item) =>
            item.status === 'saving'
              ? {
                  ...item,
                  status: 'failed',
                  errorMessage: data.error || 'Failed to save product.',
                }
              : item
          )
        );
        setFeedback({
          type: 'error',
          message: data.error || 'Bulk save failed. You can retry without losing your data.',
        });
        return;
      }

      const savedList: Product[] = Array.isArray(data.savedProducts)
        ? data.savedProducts
        : [];
      const failedMap = new Map<string, string>();
      if (Array.isArray(data.failedItems)) {
        data.failedItems.forEach((f: { clientId?: string; error: string }) => {
          if (f.clientId) failedMap.set(f.clientId, f.error);
        });
      }

      // Sync newly saved products to Cloud Firestore if authenticated as Firestore Admin
      if (isFirestoreAdmin && savedList.length > 0) {
        for (const prod of savedList) {
          try {
            await saveProductToFirestore(prod, false);
          } catch {
            // Continue syncing remaining items
          }
        }
      }

      if (Array.isArray(data.products)) {
        onCatalogUpdated(data.products);
      }

      setBulkItems((prev) =>
        prev.map((item) => {
          if (item.status === 'saved') return item;
          if (failedMap.has(item.clientId)) {
            return {
              ...item,
              status: 'failed',
              errorMessage: failedMap.get(item.clientId),
            };
          }
          return {
            ...item,
            status: 'saved',
            errorMessage: undefined,
            selectedForMerge: false,
          };
        })
      );

      setFeedback({
        type: failedMap.size > 0 ? 'error' : 'success',
        message:
          failedMap.size > 0
            ? `Saved ${savedList.length} product(s). ${failedMap.size} item(s) failed and can be retried below.`
            : `Successfully published all ${savedList.length} product(s) to the live showcase!`,
      });
    } catch {
      setBulkItems((prev) =>
        prev.map((item) =>
          item.status === 'saving'
            ? {
                ...item,
                status: 'failed',
                errorMessage: 'Network error while saving. Click Retry to save.',
              }
            : item
        )
      );
      setFeedback({
        type: 'error',
        message: 'Network error during bulk save. Click Save All / Retry to complete.',
      });
    } finally {
      setBulkSavingAll(false);
    }
  };

  const handleSaveCategoryDescription = async (categoryId: CategoryId) => {
    setSavingCategory(true);
    setFeedback(null);
    try {
      const res = await adminFetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-category',
          categoryId,
          description: editingCatDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error || 'Could not update category description.',
        });
        return;
      }
      if (Array.isArray(data.categories)) {
        onCatalogUpdated(normalizedProducts, data.categories);
        const updatedCat = (data.categories as CategoryRecord[]).find(
          (c) => c.id === categoryId
        );
        if (updatedCat && isFirestoreAdmin) {
          try {
            await saveCategoryToFirestore(updatedCat);
          } catch {
            // Handled via handleFirestoreError
          }
        }
      }
      setEditingCatId(null);
      setFeedback({
        type: 'success',
        message: 'Category description updated.',
      });
    } catch {
      setFeedback({
        type: 'error',
        message: 'Failed to update category.',
      });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setPinChangeLoading(true);
    try {
      const res = await adminFetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-pin',
          currentPin,
          newPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to update password/PIN.',
        });
        return;
      }
      if (data.token) {
        persistToken(data.token);
      }
      setFeedback({
        type: 'success',
        message: 'Admin password/PIN updated successfully.',
      });
      setCurrentPin('');
      setNewPin('');
      setShowChangePin(false);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Failed to update password/PIN.',
      });
    } finally {
      setPinChangeLoading(false);
    }
  };

  const bulkPendingCount = bulkItems.filter((i) => i.status !== 'saved').length;
  const bulkSavedCount = bulkItems.filter((i) => i.status === 'saved').length;
  const bulkFailedCount = bulkItems.filter((i) => i.status === 'failed').length;
  const bulkSelectedForMergeCount = bulkItems.filter(
    (i) => i.selectedForMerge && i.status !== 'saved'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#231C16]/75 backdrop-blur-xl transition-opacity"
        aria-hidden="true"
      />

      {/* Modal Surface — Soft Alabaster & Ivory matching HUDA HOMES theme */}
      <div className="relative w-full max-w-6xl bg-[#FAF7F2] border border-[#3A2618]/20 rounded-2xl md:rounded-3xl shadow-2xl shadow-[#231C16]/40 overflow-hidden z-10 max-h-[92svh] flex flex-col my-auto text-[#231C16]">
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-4 bg-[#F3EDE2] border-b border-[#3A2618]/12 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#231C16] text-[#FAF7F2] flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4 text-[#F55B31]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.26em] text-[#D94E28] font-semibold block">
                HUDA HOMES · Studio Management
              </span>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-[#231C16]">
                {authenticated ? 'Owner Admin Dashboard' : 'Admin Portal Login'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {firebaseUser && (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/10 text-emerald-900 text-[11px] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{firebaseUser.email}</span>
              </span>
            )}
            {authenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FAF7F2] hover:bg-red-50 text-[#5E4E40] hover:text-red-700 border border-[#3A2618]/15 text-[11px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-[#FAF7F2] hover:bg-white text-[#231C16] border border-[#3A2618]/15 transition-colors cursor-pointer"
              aria-label="Close Admin Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        {checkingAuth ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-[#5E4E40]">
            <Loader2 className="w-6 h-6 animate-spin text-[#F55B31]" />
            <span className="text-xs uppercase tracking-[0.2em]">Verifying Studio Access...</span>
          </div>
        ) : !authenticated ? (
          /* A. Dedicated Admin Login Screen */
          <div className="p-6 sm:p-12 max-w-md mx-auto w-full flex flex-col items-center text-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#F3EDE2] border border-[#3A2618]/15 flex items-center justify-center mb-5 shadow-inner">
              <KeyRound className="w-6 h-6 text-[#D94E28]" />
            </div>

            <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-[#231C16]">
              Website Owner Authentication
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-[#5E4E40] leading-relaxed">
              Enter your security password / PIN or sign in with your verified Studio Owner Google account to manage products and bulk uploads.
            </p>

            <form onSubmit={handleLogin} className="w-full mt-6 space-y-4 text-left">
              {authError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-600/25 text-red-900 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] uppercase tracking-[0.2em] text-[#4A3C30] mb-2 font-semibold">
                  Admin Password / PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter security PIN"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/20 focus:border-[#F55B31] focus:bg-white focus:ring-1 focus:ring-[#F55B31] text-[#231C16] text-center tracking-[0.35em] font-semibold text-base outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 px-6 rounded-full bg-[#F55B31] hover:bg-[#D94E28] disabled:opacity-50 text-white font-semibold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#F55B31]/25"
              >
                {authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Login to Admin Dashboard</span>
                )}
              </button>

              <div className="relative py-2 flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#7A6858] bg-[#FAF7F2] px-3">
                  Or Cloud Firestore Owner Auth
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleAdminSignIn}
                disabled={googleAuthLoading}
                className="w-full py-3 px-6 rounded-full bg-[#231C16] hover:bg-[#3A2E25] disabled:opacity-50 text-[#FAF7F2] font-semibold text-xs uppercase tracking-[0.16em] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {googleAuthLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Google Auth...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#F55B31]" />
                    <span>Sign In with Google (Firebase Admin)</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* B. Authenticated Admin Dashboard */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Navigation Tabs */}
            <div className="px-4 sm:px-6 py-3 bg-[#F3EDE2]/70 border-b border-[#3A2618]/10 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  setFeedback(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-[#231C16] text-[#FAF7F2] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5E4E40] hover:text-[#231C16] border border-[#3A2618]/12'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Dashboard Overview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('manage-products');
                  setFeedback(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'manage-products'
                    ? 'bg-[#231C16] text-[#FAF7F2] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5E4E40] hover:text-[#231C16] border border-[#3A2618]/12'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Manage Products ({normalizedProducts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  resetProductForm();
                  setFeedback(null);
                  setActiveTab('add-product');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'add-product'
                    ? 'bg-[#F55B31] text-white shadow-sm shadow-[#F55B31]/25'
                    : 'bg-[#FAF7F2] text-[#D94E28] hover:bg-[#F55B31]/10 border border-[#F55B31]/30'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingProduct ? 'Edit Product' : 'Add Single Product'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFeedback(null);
                  setActiveTab('bulk-upload');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'bulk-upload'
                    ? 'bg-[#F55B31] text-white shadow-sm shadow-[#F55B31]/25'
                    : 'bg-[#FAF7F2] text-[#D94E28] hover:bg-[#F55B31]/10 border border-[#F55B31]/30'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  Bulk Upload Products{bulkPendingCount > 0 ? ` (${bulkPendingCount})` : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('manage-categories');
                  setFeedback(null);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'manage-categories'
                    ? 'bg-[#231C16] text-[#FAF7F2] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5E4E40] hover:text-[#231C16] border border-[#3A2618]/12'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5" />
                <span>Manage Categories (8)</span>
              </button>
            </div>

            {/* Scrollable Tab Viewport */}
            <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
              {/* Status Banner */}
              {feedback && (
                <div
                  className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-950/5 border-emerald-700/30 text-emerald-950'
                      : 'bg-red-950/5 border-red-700/30 text-red-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                    )}
                    <span className="font-medium">{feedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedback(null)}
                    className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* 1. DASHBOARD OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-[#F3EDE2] border border-[#3A2618]/12">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#7A6858] font-semibold">
                        Total Published Products
                      </span>
                      <p className="text-3xl font-semibold text-[#231C16] mt-1 tabular-nums">
                        {normalizedProducts.length}
                      </p>
                      <span className="text-[11px] text-[#5E4E40] mt-1 block">
                        Showing Name, Quantity &amp; Material
                      </span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#F3EDE2] border border-[#3A2618]/12 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#D94E28] font-semibold">
                          Single Product Upload
                        </span>
                        <p className="text-sm font-medium text-[#231C16] mt-1">
                          Add one product with Name, Quantity &amp; Material
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          resetProductForm();
                          setActiveTab('add-product');
                        }}
                        className="mt-3 py-2.5 px-4 rounded-full bg-[#231C16] hover:bg-[#3A2E25] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#F55B31]" />
                        <span>Add Single Product</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#F3EDE2] border border-[#3A2618]/12 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#D94E28] font-semibold">
                          Batch Category Upload
                        </span>
                        <p className="text-sm font-medium text-[#231C16] mt-1">
                          Select multiple photos at once &amp; publish by category
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFeedback(null);
                          setActiveTab('bulk-upload');
                        }}
                        className="mt-3 py-2.5 px-4 rounded-full bg-[#F55B31] hover:bg-[#D94E28] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Bulk Upload Products</span>
                      </button>
                    </div>
                  </div>

                  {/* Cloud Firestore Real-Time Database Sync Card */}
                  <div className="p-5 rounded-2xl bg-white border border-[#3A2618]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#D94E28] font-semibold">
                        Firebase Cloud Firestore (`avid-faculty-xds98`)
                      </span>
                      <h4 className="text-sm font-semibold text-[#231C16] mt-0.5">
                        {isFirestoreAdmin
                          ? `Connected as Verified Owner (${firebaseUser?.email})`
                          : 'Cloud Firestore Real-Time Sync'}
                      </h4>
                      <p className="text-xs text-[#5E4E40] mt-0.5">
                        Sync all 8 categories and {normalizedProducts.length} products directly to your provisioned Cloud Firestore database.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={syncingFirestore}
                      onClick={handleSyncToFirestore}
                      className="px-4 py-2.5 rounded-full bg-[#231C16] hover:bg-[#3A2E25] disabled:opacity-50 text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                    >
                      {syncingFirestore ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F55B31]" />
                          <span>Syncing to Firestore...</span>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="w-3.5 h-3.5 text-[#F55B31]" />
                          <span>
                            {isFirestoreAdmin
                              ? 'Sync Catalog to Firestore'
                              : 'Connect Google & Sync Firestore'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Category Breakdown Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs uppercase tracking-[0.22em] text-[#4A3C30] font-semibold">
                        Products by Category (Click to Add, Bulk Upload, or Filter)
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {categories.map((cat, idx) => {
                        const count = categoryCounts[cat.id] || 0;
                        return (
                          <div
                            key={cat.id}
                            className="p-4 rounded-2xl bg-white border border-[#3A2618]/12 flex flex-col justify-between gap-3 shadow-xs"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#7A6858] font-semibold">
                                <span>0{idx + 1}</span>
                                <span className="text-[#D94E28] tabular-nums">{count} Items</span>
                              </div>
                              <h4 className="text-sm font-semibold text-[#231C16] mt-1">
                                {cat.label}
                              </h4>
                              <p className="text-[11px] text-[#5E4E40] line-clamp-2 mt-1">
                                {cat.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-[#3A2618]/10 flex items-center justify-between gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setFilterCategory(cat.id);
                                  setActiveTab('manage-products');
                                }}
                                className="text-[11px] font-semibold text-[#231C16] hover:text-[#D94E28] transition-colors cursor-pointer"
                              >
                                View →
                              </button>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    resetProductForm(cat.id);
                                    setActiveTab('add-product');
                                  }}
                                  className="px-2.5 py-1 rounded-full bg-[#F3EDE2] hover:bg-[#231C16] text-[#231C16] hover:text-white text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  + Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleBulkCategoryChange(cat.id);
                                    setActiveTab('bulk-upload');
                                  }}
                                  className="px-2.5 py-1 rounded-full bg-[#F55B31]/15 hover:bg-[#F55B31] text-[#D94E28] hover:text-white text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  Bulk
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Security / Password Change Card */}
                  <div className="p-5 rounded-2xl bg-[#F3EDE2]/80 border border-[#3A2618]/12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#7A6858] font-semibold">
                          Admin Security
                        </span>
                        <h4 className="text-sm font-semibold text-[#231C16]">
                          Replace Admin Password / PIN
                        </h4>
                        <p className="text-xs text-[#5E4E40]">
                          You can replace the initial PIN with a stronger private password at any time.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowChangePin(!showChangePin)}
                        className="px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-white text-[#231C16] border border-[#3A2618]/20 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        {showChangePin ? 'Cancel' : 'Change Password / PIN'}
                      </button>
                    </div>

                    {showChangePin && (
                      <form
                        onSubmit={handleChangePinSubmit}
                        className="mt-4 pt-4 border-t border-[#3A2618]/12 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
                      >
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.18em] text-[#4A3C30] mb-1 font-semibold">
                            Current PIN / Password
                          </label>
                          <input
                            type="password"
                            value={currentPin}
                            onChange={(e) => setCurrentPin(e.target.value)}
                            required
                            placeholder="Current PIN"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#3A2618]/15 text-xs text-[#231C16] outline-none focus:border-[#F55B31]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.18em] text-[#4A3C30] mb-1 font-semibold">
                            New PIN / Password (4+ chars)
                          </label>
                          <input
                            type="password"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            required
                            placeholder="New PIN or Password"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#3A2618]/15 text-xs text-[#231C16] outline-none focus:border-[#F55B31]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={pinChangeLoading}
                          className="py-2.5 px-4 rounded-xl bg-[#231C16] hover:bg-[#3A2E25] text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          {pinChangeLoading ? 'Updating...' : 'Save New PIN'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* 2. MANAGE PRODUCTS TAB */}
              {activeTab === 'manage-products' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F3EDE2] p-4 rounded-2xl border border-[#3A2618]/12">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={filterCategory}
                        onChange={(e) =>
                          setFilterCategory(e.target.value as CategoryId | 'all')
                        }
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#3A2618]/15 text-xs font-semibold text-[#231C16] outline-none focus:border-[#F55B31]"
                      >
                        <option value="all">
                          All 8 Categories ({normalizedProducts.length})
                        </option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label} ({categoryCounts[c.id] || 0})
                          </option>
                        ))}
                      </select>

                      <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, material, or quantity..."
                        className="px-3.5 py-2 rounded-xl bg-white border border-[#3A2618]/15 text-xs text-[#231C16] placeholder:text-[#8C7A6B] outline-none focus:border-[#F55B31] min-w-[220px]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          resetProductForm(
                            filterCategory !== 'all' ? filterCategory : 'console-table'
                          );
                          setActiveTab('add-product');
                        }}
                        className="py-2.5 px-4 rounded-full bg-[#231C16] hover:bg-[#3A2E25] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#F55B31]" />
                        <span>Add Single</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (filterCategory !== 'all') {
                            handleBulkCategoryChange(filterCategory);
                          }
                          setActiveTab('bulk-upload');
                        }}
                        className="py-2.5 px-4 rounded-full bg-[#F55B31] hover:bg-[#D94E28] text-white text-xs font-semibold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Bulk Upload</span>
                      </button>
                    </div>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl bg-[#F3EDE2]/50 border border-[#3A2618]/10">
                      <p className="text-sm text-[#5E4E40]">
                        No products match your current filter.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white rounded-2xl border border-[#3A2618]/12 overflow-hidden flex flex-col justify-between shadow-xs"
                        >
                          <div>
                            {/* Clean Product Photograph — Reflects Edge-to-Edge or Original Aspect Ratio */}
                            <div
                              className={`relative aspect-[4/3] w-full bg-[#EFE9DF] flex items-center justify-center overflow-hidden ${
                                prod.imageFitMode === 'original' ? 'p-2' : 'p-0'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className={`w-full h-full object-center ${
                                  prod.imageFitMode === 'original'
                                    ? 'object-contain'
                                    : 'object-cover'
                                }`}
                                referrerPolicy="no-referrer"
                              />
                            </div>

                            {/* Strictly 3 Product Fields Outside Image */}
                            <div className="p-4 space-y-2 border-t border-[#3A2618]/10">
                              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#D94E28] font-semibold">
                                <span>{prod.categoryLabel}</span>
                                <span className="text-[#7A6858]">
                                  {prod.imageFitMode === 'original'
                                    ? 'Original Ratio'
                                    : 'Edge-to-Edge'}
                                  {prod.images && prod.images.length > 1
                                    ? ` · ${prod.images.length} Photos`
                                    : ''}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-[#231C16] line-clamp-1">
                                {prod.name}
                              </h4>
                              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#3A2618]/10 text-xs">
                                <div>
                                  <span className="block text-[9px] uppercase tracking-wider text-[#7A6858] font-semibold">
                                    Quantity
                                  </span>
                                  <span className="text-[#231C16] font-medium">
                                    {prod.quantity}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[9px] uppercase tracking-wider text-[#7A6858] font-semibold">
                                    Material
                                  </span>
                                  <span className="text-[#231C16] font-medium line-clamp-1">
                                    {prod.material}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="px-4 py-3 bg-[#FAF7F2] border-t border-[#3A2618]/10 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => startEditProduct(prod)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3EDE2] hover:bg-[#231C16] text-[#231C16] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              disabled={deletingId === prod.id}
                              onClick={() => handleDeleteProduct(prod)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {deletingId === prod.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 3. ADD / EDIT SINGLE PRODUCT TAB (Strictly 3 Product Information Fields + Category + Photo Uploader) */}
              {activeTab === 'add-product' && (
                <form onSubmit={handleSaveProduct} className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#3A2618]/12">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#D94E28] font-semibold">
                        {editingProduct ? 'Update Existing Piece' : 'Single Product Addition'}
                      </span>
                      <h3 className="text-lg sm:text-xl font-semibold text-[#231C16]">
                        {editingProduct
                          ? `Editing: ${editingProduct.name}`
                          : 'Add New Product (3 Required Fields)'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {editingProduct && (
                        <button
                          type="button"
                          onClick={() => resetProductForm()}
                          className="text-xs font-semibold text-[#5E4E40] hover:text-[#231C16] underline cursor-pointer"
                        >
                          Switch to Create New Product
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveTab('bulk-upload')}
                        className="px-3.5 py-1.5 rounded-full bg-[#F3EDE2] hover:bg-[#231C16] text-[#231C16] hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Want to upload multiple products? Use Bulk Upload →
                      </button>
                    </div>
                  </div>

                  {/* Category Selector */}
                  <div className="p-5 rounded-2xl bg-[#F3EDE2] border border-[#3A2618]/15">
                    <label className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold">
                      Select Product Category <span className="text-[#D94E28]">*</span>
                    </label>
                    <select
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value as CategoryId)}
                      className="w-full sm:max-w-md px-4 py-3 rounded-xl bg-white border border-[#3A2618]/15 focus:border-[#F55B31] text-sm font-semibold text-[#231C16] outline-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Media Uploader Control (Separate from the 3 Product Information Fields) */}
                  <div className="p-5 rounded-2xl bg-[#F3EDE2] border border-[#3A2618]/15 space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-[0.2em] text-[#231C16] font-semibold">
                        Product Photograph Upload Control <span className="text-[#D94E28]">*</span>
                      </label>
                      <p className="text-xs text-[#5E4E40] mt-0.5">
                        Upload directly from your phone gallery, capture with your mobile camera, or choose files from your computer (JPG, JPEG, PNG, WebP up to 10 MB).
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={uploadingImages}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#231C16] hover:bg-[#3A2E25] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {uploadingImages ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-[#F55B31]" />
                        )}
                        <span>Upload from Gallery / Device</span>
                      </button>

                      <button
                        type="button"
                        disabled={uploadingImages}
                        onClick={() => cameraInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#231C16] border border-[#3A2618]/20 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4 text-[#D94E28]" />
                        <span>Take Photo (Mobile Camera)</span>
                      </button>
                    </div>

                    {/* Optional direct image link input */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        maxLength={MAX_IMAGE_URL_LENGTH}
                        value={externalImageUrlInput}
                        onChange={(e) => setExternalImageUrlInput(e.target.value)}
                        placeholder="Or paste an image URL (https://...)"
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-[#3A2618]/15 text-xs text-[#231C16] placeholder:text-[#8C7A6B] outline-none focus:border-[#F55B31]"
                      />
                      <button
                        type="button"
                        onClick={handleAddExternalImageUrl}
                        className="px-4 py-2.5 rounded-xl bg-[#FAF7F2] hover:bg-white text-[#231C16] border border-[#3A2618]/15 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                      >
                        Add Image URL
                      </button>
                    </div>

                    {/* Photo Showcase Mode Selector: Edge-to-Edge (Auto) vs Original Aspect Ratio */}
                    <div className="pt-3 border-t border-[#3A2618]/12">
                      <label className="block text-[11px] uppercase tracking-[0.18em] text-[#231C16] mb-2 font-semibold">
                        Photo Showcase Mode (Aspect Ratio) <span className="text-[#D94E28]">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setProductImageFitMode('edge-to-edge')}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                            productImageFitMode === 'edge-to-edge'
                              ? 'bg-[#231C16] text-white border-[#231C16] shadow-md'
                              : 'bg-white hover:bg-[#FAF7F2] text-[#231C16] border-[#3A2618]/15'
                          }`}
                        >
                          <Maximize2
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              productImageFitMode === 'edge-to-edge'
                                ? 'text-[#F55B31]'
                                : 'text-[#D94E28]'
                            }`}
                          />
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-wider">
                              Edge-to-Edge Showcase (Auto)
                            </span>
                            <span
                              className={`block text-[11px] mt-0.5 ${
                                productImageFitMode === 'edge-to-edge'
                                  ? 'text-[#FAF6F0]/85'
                                  : 'text-[#5E4E40]'
                              }`}
                            >
                              Automatically fills the entire showcase frame edge-to-edge without borders.
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProductImageFitMode('original')}
                          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                            productImageFitMode === 'original'
                              ? 'bg-[#231C16] text-white border-[#231C16] shadow-md'
                              : 'bg-white hover:bg-[#FAF7F2] text-[#231C16] border-[#3A2618]/15'
                          }`}
                        >
                          <Minimize2
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              productImageFitMode === 'original'
                                ? 'text-[#F55B31]'
                                : 'text-[#D94E28]'
                            }`}
                          />
                          <div>
                            <span className="block text-xs font-semibold uppercase tracking-wider">
                              Original Aspect Ratio
                            </span>
                            <span
                              className={`block text-[11px] mt-0.5 ${
                                productImageFitMode === 'original'
                                  ? 'text-[#FAF6F0]/85'
                                  : 'text-[#5E4E40]'
                              }`}
                            >
                              Showcases the full photograph in its exact original aspect ratio without cropping.
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Selected Image Previews */}
                    {productImages.length > 0 && (
                      <div className="pt-3">
                        <span className="block text-[10px] uppercase tracking-[0.18em] text-[#5E4E40] mb-2 font-semibold">
                          Selected Product Photos ({productImages.length}) · Live Preview:{' '}
                          <strong className="text-[#D94E28]">
                            {productImageFitMode === 'original'
                              ? 'Original Aspect Ratio'
                              : 'Edge-to-Edge Showcase'}
                          </strong>
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {productImages.map((imgUrl, idx) => (
                            <div
                              key={`${imgUrl}-${idx}`}
                              className={`relative group rounded-xl overflow-hidden bg-[#EFE9DF] border border-[#3A2618]/15 aspect-[4/3] flex items-center justify-center ${
                                productImageFitMode === 'original' ? 'p-1.5' : 'p-0'
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgUrl}
                                alt={`Product preview ${idx + 1}`}
                                className={`w-full h-full ${
                                  productImageFitMode === 'original'
                                    ? 'object-contain'
                                    : 'object-cover'
                                }`}
                                referrerPolicy="no-referrer"
                              />
                              {idx === 0 && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#F55B31] text-white text-[9px] font-semibold uppercase tracking-wider shadow-xs">
                                  Main Photo
                                </span>
                              )}
                              <div className="absolute inset-x-0 bottom-0 p-1.5 bg-[#231C16]/80 backdrop-blur-xs flex items-center justify-between gap-1">
                                {idx > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSetPrimaryImage(idx)}
                                    className="text-[9px] font-semibold text-white hover:text-[#F68B55] uppercase tracking-wider px-1.5 py-0.5 cursor-pointer"
                                  >
                                    Set Main
                                  </button>
                                ) : (
                                  <span className="text-[9px] text-white/80 px-1.5">Cover</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(idx)}
                                  className="p-1 rounded bg-red-600/90 hover:bg-red-600 text-white cursor-pointer"
                                  aria-label="Remove image"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Strictly the 3 Required Product Information Fields */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#3A2618]/15 space-y-5">
                    <span className="block text-[10px] uppercase tracking-[0.22em] text-[#D94E28] font-semibold">
                      Product Information (3 Required Fields)
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Field 1: Product Name */}
                      <div>
                        <label className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold">
                          1. Product Name <span className="text-[#D94E28]">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={MAX_PRODUCT_NAME_LENGTH}
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          required
                          placeholder="e.g., Statuario Marble Console Table"
                          className="w-full px-4 py-3 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 focus:border-[#F55B31] focus:bg-white text-sm text-[#231C16] outline-none"
                        />
                      </div>

                      {/* Field 2: Quantity */}
                      <div>
                        <label className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold">
                          2. Quantity <span className="text-[#D94E28]">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={MAX_PRODUCT_QUANTITY_LENGTH}
                          value={productQuantity}
                          onChange={(e) => setProductQuantity(e.target.value)}
                          required
                          placeholder="e.g., 1 Piece, 2 Units, 1 Pair, 1 Set"
                          className="w-full px-4 py-3 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 focus:border-[#F55B31] focus:bg-white text-sm text-[#231C16] outline-none"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {QUANTITY_PRESETS.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setProductQuantity(preset)}
                              className="px-2 py-0.5 rounded-md bg-[#F3EDE2] hover:bg-[#231C16] text-[#4A3C30] hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Field 3: Material */}
                      <div>
                        <label className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold">
                          3. Material <span className="text-[#D94E28]">*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={MAX_PRODUCT_MATERIAL_LENGTH}
                          value={productMaterial}
                          onChange={(e) => setProductMaterial(e.target.value)}
                          required
                          placeholder="e.g., Italian Statuario White Marble"
                          className="w-full px-4 py-3 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 focus:border-[#F55B31] focus:bg-white text-sm text-[#231C16] outline-none"
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {MATERIAL_PRESETS.slice(0, 4).map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setProductMaterial(preset)}
                              className="px-2 py-0.5 rounded-md bg-[#F3EDE2] hover:bg-[#231C16] text-[#4A3C30] hover:text-white text-[10px] font-medium transition-colors cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit / Publish Button */}
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          resetProductForm();
                          setActiveTab('manage-products');
                        }}
                        className="px-6 py-3.5 rounded-full bg-[#F3EDE2] hover:bg-[#3A2618]/10 text-[#231C16] text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={savingProduct || uploadingImages}
                      className="px-8 py-4 rounded-full bg-[#F55B31] hover:bg-[#D94E28] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-[#F55B31]/25"
                    >
                      {savingProduct ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving Product...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {editingProduct ? 'Save Product Changes' : 'Publish / Save Product'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* 4. BULK UPLOAD PRODUCTS TAB (Organized by Category — Steps 1 to 4) */}
              {activeTab === 'bulk-upload' && (
                <div className="space-y-6">
                  {/* Hidden file inputs for Bulk Upload */}
                  <input
                    ref={bulkFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleBulkFilesSelected(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                  />
                  <input
                    ref={bulkCameraInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    capture="environment"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleBulkFilesSelected(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                  />
                  <input
                    ref={rowExtraPhotoInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleRowExtraPhotoUpload}
                    className="hidden"
                  />

                  {/* STEP 1 & STEP 2 HEADER GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Step 1: Select Category */}
                    <div className="lg:col-span-5 p-5 rounded-2xl bg-[#F3EDE2] border border-[#3A2618]/15 flex flex-col justify-between space-y-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.22em] text-[#D94E28] font-semibold">
                          Step 1 — Select Category
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold text-[#231C16] mt-0.5">
                          Choose Category for This Batch
                        </h3>
                        <p className="text-xs text-[#5E4E40] mt-1">
                          Every photograph added in this batch will be assigned to this category (you can also change any individual product&apos;s category below).
                        </p>
                      </div>

                      <div>
                        <select
                          value={bulkCategory}
                          onChange={(e) =>
                            handleBulkCategoryChange(e.target.value as CategoryId)
                          }
                          className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#3A2618]/20 focus:border-[#F55B31] text-sm font-semibold text-[#231C16] outline-none"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Step 2: Select Multiple Photos (Gallery, Desktop Drag-and-Drop, Mobile Camera) */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setBulkDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setBulkDragActive(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setBulkDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          handleBulkFilesSelected(Array.from(e.dataTransfer.files));
                        }
                      }}
                      className={`lg:col-span-7 p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col justify-between space-y-4 ${
                        bulkDragActive
                          ? 'bg-[#F55B31]/10 border-[#F55B31]'
                          : 'bg-[#F3EDE2] border-[#3A2618]/25'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.22em] text-[#D94E28] font-semibold">
                          Step 2 — Select Multiple Photos
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold text-[#231C16] mt-0.5">
                          Upload Multiple Product Photographs at Once
                        </h3>
                        <p className="text-xs text-[#5E4E40] mt-1">
                          Select multiple photos from your phone gallery or desktop file manager, drag and drop files here, or capture with your camera (JPG, JPEG, PNG, WebP up to 10 MB each).
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled={bulkUploadingPhotos}
                            onClick={() => bulkFileInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#231C16] hover:bg-[#3A2E25] text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {bulkUploadingPhotos ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#F55B31]" />
                            ) : (
                              <Upload className="w-4 h-4 text-[#F55B31]" />
                            )}
                            <span>
                              {bulkUploadingPhotos
                                ? bulkUploadProgressText || 'Uploading Photos...'
                                : 'Select Multiple Photos'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={bulkUploadingPhotos}
                            onClick={() => bulkCameraInputRef.current?.click()}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-[#FAF7F2] text-[#231C16] border border-[#3A2618]/20 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            <Camera className="w-4 h-4 text-[#D94E28]" />
                            <span>Camera Capture</span>
                          </button>
                        </div>

                        {/* Batch Photo Showcase Mode Toggle (Edge-to-Edge vs Original Aspect Ratio) */}
                        <div className="pt-2.5 border-t border-[#3A2618]/12 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#4A3C30] font-semibold mr-1">
                            Photo Showcase Mode:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleBulkFitModeChange('edge-to-edge')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              bulkImageFitMode === 'edge-to-edge'
                                ? 'bg-[#231C16] text-white shadow-xs'
                                : 'bg-white text-[#4A3C30] border border-[#3A2618]/15 hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <Maximize2 className="w-3 h-3 text-[#F55B31]" />
                            <span>Edge-to-Edge (Auto)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkFitModeChange('original')}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              bulkImageFitMode === 'original'
                                ? 'bg-[#231C16] text-white shadow-xs'
                                : 'bg-white text-[#4A3C30] border border-[#3A2618]/15 hover:bg-[#FAF7F2]'
                            }`}
                          >
                            <Minimize2 className="w-3 h-3 text-[#F55B31]" />
                            <span>Original Aspect Ratio</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Per-File Validation Warnings (Without losing valid files in the batch) */}
                  {bulkRejectedWarnings.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-950/5 border border-amber-700/30 text-amber-950 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold uppercase tracking-wider text-amber-900">
                          Skipped Invalid File(s) — Valid Photos Were Kept:
                        </span>
                        <button
                          type="button"
                          onClick={() => setBulkRejectedWarnings([])}
                          className="underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {bulkRejectedWarnings.map((warn, i) => (
                          <li key={i}>{warn}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* STEP 3 & STEP 4: Editable Product Rows & Review / Save All */}
                  {bulkItems.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-white border border-[#3A2618]/12 text-center space-y-2">
                      <Layers className="w-8 h-8 text-[#D94E28] mx-auto opacity-80" />
                      <h4 className="text-base font-semibold text-[#231C16]">
                        No Photos Selected in Batch Yet
                      </h4>
                      <p className="text-xs text-[#5E4E40] max-w-md mx-auto">
                        Select a category in Step 1 and choose multiple product photographs in Step 2 to enter Product Name, Quantity, and Material for all products in one screen.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Step 3 Header & Multi-Photo Grouping Toolbar */}
                      <div className="p-4 rounded-2xl bg-white border border-[#3A2618]/15 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[#D94E28] font-semibold">
                            Step 3 — Enter Product Information &amp; Optional Photo Grouping
                          </span>
                          <h4 className="text-sm sm:text-base font-semibold text-[#231C16]">
                            {bulkItems.length} Product Record(s) in Batch ·{' '}
                            {categories.find((c) => c.id === bulkCategory)?.label}
                          </h4>
                          <p className="text-xs text-[#5E4E40]">
                            Enter the Product Name, Quantity, and Material for each product. If multiple photos belong to one product, check those rows and click &ldquo;Group Selected Photos into 1 Product&rdquo;.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            disabled={bulkSelectedForMergeCount < 2}
                            onClick={handleGroupSelectedBulkItems}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#231C16] hover:bg-[#3A2E25] disabled:opacity-40 text-white text-xs font-semibold transition-all cursor-pointer"
                          >
                            <Merge className="w-3.5 h-3.5 text-[#F55B31]" />
                            <span>
                              Group Selected Photos into 1 Product (
                              {bulkSelectedForMergeCount})
                            </span>
                          </button>

                          {bulkSavedCount > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setBulkItems((prev) =>
                                  prev.filter((item) => item.status !== 'saved')
                                )
                              }
                              className="px-3.5 py-2 rounded-xl bg-[#F3EDE2] hover:bg-[#3A2618]/15 text-[#231C16] text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Clear Saved ({bulkSavedCount})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editable Product Cards List */}
                      <div className="space-y-4">
                        {bulkItems.map((item, idx) => {
                          const isSaved = item.status === 'saved';
                          const isFailed = item.status === 'failed';

                          return (
                            <div
                              key={item.clientId}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                isSaved
                                  ? 'bg-emerald-950/5 border-emerald-700/30'
                                  : isFailed
                                  ? 'bg-red-950/5 border-red-600/40'
                                  : 'bg-white border-[#3A2618]/15 shadow-xs'
                              }`}
                            >
                              {/* Row Top Bar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#3A2618]/10">
                                <div className="flex items-center gap-3">
                                  {!isSaved && (
                                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#231C16] cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={item.selectedForMerge}
                                        onChange={(e) =>
                                          updateBulkItemField(item.clientId, {
                                            selectedForMerge: e.target.checked,
                                          })
                                        }
                                        className="w-4 h-4 accent-[#F55B31] rounded"
                                      />
                                      <span>Product #{idx + 1}</span>
                                    </label>
                                  )}
                                  {isSaved && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                      <span>Product #{idx + 1} · Saved Live</span>
                                    </span>
                                  )}

                                  <span className="px-2.5 py-0.5 rounded-full bg-[#F3EDE2] text-[#4A3C30] text-[10px] font-semibold uppercase tracking-wider">
                                    {item.images.length}{' '}
                                    {item.images.length === 1 ? 'Photo' : 'Photos Grouped'}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  {!isSaved && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveRowAddPhotoId(item.clientId);
                                          rowExtraPhotoInputRef.current?.click();
                                        }}
                                        className="px-2.5 py-1 rounded-lg bg-[#F3EDE2] hover:bg-[#231C16] text-[#231C16] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                      >
                                        + Add Photo to This Product
                                      </button>

                                      {idx > 0 && bulkItems[idx - 1]?.status !== 'saved' && (
                                        <button
                                          type="button"
                                          onClick={() => handleMergeWithPreviousRow(idx)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F3EDE2] hover:bg-[#231C16] text-[#231C16] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                          title="Group this photo into the product above"
                                        >
                                          <Merge className="w-3 h-3" />
                                          <span>Merge into Above Product</span>
                                        </button>
                                      )}

                                      {item.images.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleUngroupBulkRow(item.clientId)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F3EDE2] hover:bg-[#231C16] text-[#231C16] hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                        >
                                          <Split className="w-3 h-3" />
                                          <span>Ungroup Photos</span>
                                        </button>
                                      )}
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveBulkItem(item.clientId)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>

                              {item.errorMessage && (
                                <div className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-600/30 text-red-900 text-xs flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                                  <span>{item.errorMessage}</span>
                                </div>
                              )}

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                                {/* Photo Thumbnails Preview (Reflects item.imageFitMode) */}
                                <div className="lg:col-span-3 flex items-center gap-2 overflow-x-auto pb-1">
                                  {item.images.map((imgUrl, imgIdx) => (
                                    <div
                                      key={`${imgUrl}-${imgIdx}`}
                                      className={`relative w-24 h-20 rounded-xl bg-[#EFE9DF] border border-[#3A2618]/15 shrink-0 flex items-center justify-center overflow-hidden ${
                                        item.imageFitMode === 'original' ? 'p-1' : 'p-0'
                                      }`}
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={imgUrl}
                                        alt=""
                                        className={`w-full h-full ${
                                          item.imageFitMode === 'original'
                                            ? 'object-contain'
                                            : 'object-cover'
                                        }`}
                                        referrerPolicy="no-referrer"
                                      />
                                      {!isSaved && item.images.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleRemoveSingleImageFromBulkRow(
                                              item.clientId,
                                              imgIdx
                                            )
                                          }
                                          className="absolute top-1 right-1 p-0.5 rounded bg-red-600 text-white cursor-pointer"
                                          aria-label="Remove photo"
                                        >
                                          <X className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* 3 Editable Information Fields + Category + Photo Showcase Mode */}
                                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                  {/* 1. Product Name */}
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-[0.16em] text-[#4A3C30] mb-1 font-semibold">
                                      1. Product Name <span className="text-[#D94E28]">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      disabled={isSaved}
                                      maxLength={MAX_PRODUCT_NAME_LENGTH}
                                      value={item.name}
                                      onChange={(e) =>
                                        updateBulkItemField(item.clientId, {
                                          name: e.target.value,
                                        })
                                      }
                                      placeholder="Product Name"
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 focus:border-[#F55B31] focus:bg-white text-xs text-[#231C16] outline-none disabled:opacity-60"
                                    />
                                  </div>

                                  {/* 2. Quantity */}
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-[0.16em] text-[#4A3C30] mb-1 font-semibold">
                                      2. Quantity <span className="text-[#D94E28]">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      disabled={isSaved}
                                      maxLength={MAX_PRODUCT_QUANTITY_LENGTH}
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateBulkItemField(item.clientId, {
                                          quantity: e.target.value,
                                        })
                                      }
                                      placeholder="e.g., 1 Piece"
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 focus:border-[#F55B31] focus:bg-white text-xs text-[#231C16] outline-none disabled:opacity-60"
                                    />
                                  </div>

                                  {/* 3. Material */}
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-[0.16em] text-[#4A3C30] mb-1 font-semibold">
                                      3. Material <span className="text-[#D94E28]">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      disabled={isSaved}
                                      maxLength={MAX_PRODUCT_MATERIAL_LENGTH}
                                      value={item.material}
                                      onChange={(e) =>
                                        updateBulkItemField(item.clientId, {
                                          material: e.target.value,
                                        })
                                      }
                                      placeholder="e.g., Statuario Marble"
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 focus:border-[#F55B31] focus:bg-white text-xs text-[#231C16] outline-none disabled:opacity-60"
                                    />
                                  </div>

                                  {/* Category assignment */}
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-[0.16em] text-[#4A3C30] mb-1 font-semibold">
                                      Category
                                    </label>
                                    <select
                                      disabled={isSaved}
                                      value={item.category}
                                      onChange={(e) =>
                                        updateBulkItemField(item.clientId, {
                                          category: e.target.value as CategoryId,
                                        })
                                      }
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 focus:border-[#F55B31] focus:bg-white text-xs font-semibold text-[#231C16] outline-none disabled:opacity-60"
                                    >
                                      {CATEGORIES.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  {/* Photo Showcase Mode (Edge-to-Edge vs Original Aspect Ratio) */}
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-[0.16em] text-[#4A3C30] mb-1 font-semibold">
                                      Photo Showcase
                                    </label>
                                    <select
                                      disabled={isSaved}
                                      value={item.imageFitMode}
                                      onChange={(e) =>
                                        updateBulkItemField(item.clientId, {
                                          imageFitMode: e.target.value as ImageFitMode,
                                        })
                                      }
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 focus:border-[#F55B31] focus:bg-white text-xs font-semibold text-[#231C16] outline-none disabled:opacity-60"
                                    >
                                      <option value="edge-to-edge">
                                        Edge-to-Edge (Auto)
                                      </option>
                                      <option value="original">
                                        Original Aspect Ratio
                                      </option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Step 4: Review and Save All Products Bar */}
                      <div className="p-5 rounded-2xl bg-[#F3EDE2] border border-[#3A2618]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.22em] text-[#D94E28] font-semibold">
                            Step 4 — Review &amp; Save Batch
                          </span>
                          <h4 className="text-sm sm:text-base font-semibold text-[#231C16]">
                            Ready to Save: {bulkPendingCount} Product(s) · Already Saved:{' '}
                            {bulkSavedCount}
                            {bulkFailedCount > 0 ? ` · Failed: ${bulkFailedCount}` : ''}
                          </h4>
                          <p className="text-xs text-[#5E4E40]">
                            Default Batch Category:{' '}
                            <strong>
                              {categories.find((c) => c.id === bulkCategory)?.label}
                            </strong>
                            . All saved products appear live in their category immediately.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                          {bulkPendingCount > 0 && (
                            <button
                              type="button"
                              disabled={bulkSavingAll || bulkUploadingPhotos}
                              onClick={handleSaveAllBulkProducts}
                              className="px-7 py-3.5 rounded-full bg-[#F55B31] hover:bg-[#D94E28] disabled:opacity-50 text-white text-xs font-semibold uppercase tracking-[0.2em] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl shadow-[#F55B31]/25"
                            >
                              {bulkSavingAll ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>Saving Batch...</span>
                                </>
                              ) : bulkFailedCount > 0 ? (
                                <>
                                  <RefreshCw className="w-4 h-4" />
                                  <span>Retry Failed Products ({bulkPendingCount})</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4" />
                                  <span>Save All Products ({bulkPendingCount})</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. MANAGE CATEGORIES TAB */}
              {activeTab === 'manage-categories' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#F3EDE2] border border-[#3A2618]/12 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#231C16]">
                        8 Signature Product Categories
                      </h3>
                      <p className="text-xs text-[#5E4E40]">
                        View product counts per category, edit category showcase descriptions, or jump directly to single or bulk upload for any category.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {categories.map((cat, idx) => {
                      const count = categoryCounts[cat.id] || 0;
                      const isEditingCat = editingCatId === cat.id;

                      return (
                        <div
                          key={cat.id}
                          className="p-4 sm:p-5 rounded-2xl bg-white border border-[#3A2618]/12 flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2.5">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D94E28]">
                                Category 0{idx + 1}
                              </span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3EDE2] text-[#231C16] font-semibold tabular-nums">
                                {count} Products ({Math.min(4, count)} initial +{' '}
                                {Math.max(0, count - 4)} in See More)
                              </span>
                            </div>

                            <h4 className="text-base font-semibold text-[#231C16]">
                              {cat.label}
                            </h4>

                            {isEditingCat ? (
                              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                                <input
                                  type="text"
                                  maxLength={MAX_CATEGORY_DESC_LENGTH}
                                  value={editingCatDesc}
                                  onChange={(e) => setEditingCatDesc(e.target.value)}
                                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/20 text-xs text-[#231C16] outline-none focus:border-[#F55B31]"
                                />
                                <button
                                  type="button"
                                  disabled={savingCategory}
                                  onClick={() => handleSaveCategoryDescription(cat.id)}
                                  className="px-4 py-2 rounded-xl bg-[#231C16] text-white text-xs font-semibold cursor-pointer"
                                >
                                  {savingCategory ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingCatId(null)}
                                  className="px-3 py-2 rounded-xl bg-[#F3EDE2] text-[#5E4E40] text-xs font-semibold cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-[#5E4E40]">{cat.description}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {!isEditingCat && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatId(cat.id);
                                  setEditingCatDesc(cat.description);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-[#F3EDE2] hover:bg-[#3A2618]/15 text-[#231C16] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit Description</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setFilterCategory(cat.id);
                                setActiveTab('manage-products');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#231C16] border border-[#3A2618]/15 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Manage Items</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleBulkCategoryChange(cat.id);
                                setActiveTab('bulk-upload');
                              }}
                              className="px-4 py-2 rounded-xl bg-[#F55B31] hover:bg-[#D94E28] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Bulk Upload to {cat.label}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
