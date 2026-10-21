import { NextRequest, NextResponse } from 'next/server';
import {
  readCatalogStore,
  writeCatalogStore,
  isRequestAuthorized,
} from '@/lib/catalog-store';
import {
  CATEGORIES,
  CategoryId,
  ImageFitMode,
  Product,
  normalizeProductRecord,
} from '@/data/products';

const VALID_CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

function buildProductSlugId(name: string, preferredId?: string): string {
  if (preferredId && typeof preferredId === 'string' && preferredId.trim()) {
    const cleaned = preferredId
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_\-]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 120);
    if (cleaned) return cleaned;
  }
  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
  return `${slugBase || 'piece'}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

export async function GET(req: NextRequest) {
  const store = readCatalogStore();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const found = store.products.find((p) => p.id === id);
    if (!found) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json({ product: found });
  }

  return NextResponse.json({
    products: store.products,
    categories: store.categories,
    updatedAt: store.updatedAt,
  });
}

export async function POST(req: NextRequest) {
  if (!isRequestAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();

    // Support Bulk Upload Creation (Step 4 — Save All Products)
    if (body.action === 'bulk-create' && Array.isArray(body.items)) {
      const store = readCatalogStore();
      const savedProducts: Product[] = [];
      const failedItems: { clientId?: string; index: number; error: string }[] = [];

      for (let i = 0; i < body.items.length; i++) {
        const rawItem = body.items[i] || {};
        const clientId = rawItem.clientId ? String(rawItem.clientId) : undefined;
        const itemName = typeof rawItem.name === 'string' ? rawItem.name.trim() : '';
        const itemQuantity = typeof rawItem.quantity === 'string' ? rawItem.quantity.trim() : '';
        const itemMaterial = typeof rawItem.material === 'string' ? rawItem.material.trim() : '';
        const itemCategory = rawItem.category || body.category;

        if (!itemName) {
          failedItems.push({ clientId, index: i, error: 'Product Name is required.' });
          continue;
        }
        if (!itemQuantity) {
          failedItems.push({ clientId, index: i, error: 'Quantity is required.' });
          continue;
        }
        if (!itemMaterial) {
          failedItems.push({ clientId, index: i, error: 'Material is required.' });
          continue;
        }
        if (!itemCategory || !VALID_CATEGORY_IDS.has(itemCategory)) {
          failedItems.push({
            clientId,
            index: i,
            error: 'Valid category selection is required.',
          });
          continue;
        }

        const itemImages: string[] = Array.isArray(rawItem.images)
          ? rawItem.images.filter(
              (img: unknown) => typeof img === 'string' && img.trim().length > 0
            )
          : typeof rawItem.image === 'string' && rawItem.image.trim().length > 0
          ? [rawItem.image.trim()]
          : [];

        if (itemImages.length === 0) {
          failedItems.push({
            clientId,
            index: i,
            error: 'At least one product photograph is required.',
          });
          continue;
        }

        const matchedCategory =
          store.categories.find((c) => c.id === itemCategory) ||
          CATEGORIES.find((c) => c.id === itemCategory)!;

        const productId = buildProductSlugId(itemName, rawItem.id || clientId);

        // Idempotency check: prevent duplicate records during retries
        const existingIdx = store.products.findIndex((p) => p.id === productId);

        const itemFitMode: ImageFitMode =
          rawItem.imageFitMode === 'original'
            ? 'original'
            : rawItem.imageFitMode === 'edge-to-edge'
            ? 'edge-to-edge'
            : body.imageFitMode === 'original'
            ? 'original'
            : 'edge-to-edge';

        const productRecord = normalizeProductRecord({
          id: productId,
          name: itemName,
          category: itemCategory as CategoryId,
          categoryLabel: matchedCategory.label,
          quantity: itemQuantity,
          material: itemMaterial,
          imageFitMode: itemFitMode,
          price: 'Price on Request',
          subtitle: `${itemMaterial} · ${itemQuantity}`,
          origin: 'HUDA HOMES Artisanal Quarry Selection',
          finishes: ['Polished', 'Honed'],
          standardFormat: itemQuantity,
          thickness: '20mm & 30mm Solid Block',
          applications: ['Luxury Residential', 'Architectural Interiors'],
          description: `Handcrafted ${itemName} sculpted from ${itemMaterial}. Available quantity: ${itemQuantity}.`,
          image: itemImages[0],
          detailImage: itemImages[1] || itemImages[0],
          images: itemImages,
          bookmatched: false,
          featured: false,
        });

        if (existingIdx >= 0) {
          store.products[existingIdx] = productRecord;
        } else {
          const firstIndexInCat = store.products.findIndex(
            (p) => p.category === itemCategory
          );
          if (firstIndexInCat >= 0) {
            store.products.splice(firstIndexInCat, 0, productRecord);
          } else {
            store.products.unshift(productRecord);
          }
        }

        savedProducts.push(productRecord);
      }

      if (savedProducts.length > 0) {
        writeCatalogStore(store);
      }

      return NextResponse.json(
        {
          savedProducts,
          failedItems,
          products: store.products,
          message:
            failedItems.length === 0
              ? `Successfully published ${savedProducts.length} product(s) to the showcase.`
              : `Published ${savedProducts.length} product(s). ${failedItems.length} item(s) need attention.`,
        },
        { status: savedProducts.length > 0 ? 201 : 400 }
      );
    }

    // Standard Single Product Creation
    const {
      id: preferredId,
      name,
      category,
      quantity,
      material,
      imageFitMode,
      images,
      image,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Product Name is required.' },
        { status: 400 }
      );
    }

    if (!quantity || typeof quantity !== 'string' || !quantity.trim()) {
      return NextResponse.json(
        { error: 'Quantity is required (e.g., 1 Piece, 2 Units, 1 Set).' },
        { status: 400 }
      );
    }

    if (!material || typeof material !== 'string' || !material.trim()) {
      return NextResponse.json(
        { error: 'Material is required (e.g., Statuario White Marble).' },
        { status: 400 }
      );
    }

    if (!category || !VALID_CATEGORY_IDS.has(category)) {
      return NextResponse.json(
        { error: 'Please select a valid category from the 8 signature categories.' },
        { status: 400 }
      );
    }

    const imageList: string[] = Array.isArray(images)
      ? images.filter((img: unknown) => typeof img === 'string' && img.trim().length > 0)
      : typeof image === 'string' && image.trim().length > 0
      ? [image.trim()]
      : [];

    if (imageList.length === 0) {
      return NextResponse.json(
        { error: 'Please upload or provide at least one product photograph.' },
        { status: 400 }
      );
    }

    const store = readCatalogStore();
    const matchedCategory =
      store.categories.find((c) => c.id === category) ||
      CATEGORIES.find((c) => c.id === category)!;

    const id = buildProductSlugId(name.trim(), preferredId);
    const trimmedName = name.trim();
    const trimmedQuantity = quantity.trim();
    const trimmedMaterial = material.trim();
    const resolvedFitMode: ImageFitMode =
      imageFitMode === 'original' ? 'original' : 'edge-to-edge';

    const newProduct: Product = normalizeProductRecord({
      id,
      name: trimmedName,
      category: category as CategoryId,
      categoryLabel: matchedCategory.label,
      quantity: trimmedQuantity,
      material: trimmedMaterial,
      imageFitMode: resolvedFitMode,
      price: 'Price on Request',
      subtitle: `${trimmedMaterial} · ${trimmedQuantity}`,
      origin: 'HUDA HOMES Artisanal Quarry Selection',
      finishes: ['Polished', 'Honed'],
      standardFormat: trimmedQuantity,
      thickness: '20mm & 30mm Solid Block',
      applications: ['Private Residences', 'Signature Galleries'],
      description: `Handcrafted ${trimmedName} sculpted from ${trimmedMaterial}. Quantity: ${trimmedQuantity}.`,
      image: imageList[0],
      detailImage: imageList[1] || imageList[0],
      images: imageList,
      bookmatched: false,
      featured: false,
    });

    // Place newly added product at the beginning of its category so it is immediately visible in the first 4 items
    const existingIdx = store.products.findIndex((p) => p.id === id);
    if (existingIdx >= 0) {
      store.products[existingIdx] = newProduct;
    } else {
      const firstIndexInCat = store.products.findIndex((p) => p.category === category);
      if (firstIndexInCat >= 0) {
        store.products.splice(firstIndexInCat, 0, newProduct);
      } else {
        store.products.unshift(newProduct);
      }
    }

    writeCatalogStore(store);

    return NextResponse.json(
      {
        product: newProduct,
        products: store.products,
        message: 'Product published and added to the live showcase.',
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Error creating product:', err);
    return NextResponse.json(
      { error: 'Failed to create product. Please check your inputs.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  if (!isRequestAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const store = readCatalogStore();

    // Category description update
    if (body.action === 'update-category') {
      const { categoryId, description } = body;
      const catIndex = store.categories.findIndex((c) => c.id === categoryId);
      if (catIndex === -1) {
        return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
      }
      store.categories[catIndex] = {
        ...store.categories[catIndex],
        description: String(description || '').trim() || store.categories[catIndex].description,
      };
      writeCatalogStore(store);
      return NextResponse.json({
        categories: store.categories,
        message: 'Category details updated.',
      });
    }

    const {
      id,
      name,
      category,
      quantity,
      material,
      imageFitMode,
      images,
      image,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    if (name !== undefined && (!String(name).trim())) {
      return NextResponse.json({ error: 'Product Name is required.' }, { status: 400 });
    }

    if (quantity !== undefined && (!String(quantity).trim())) {
      return NextResponse.json({ error: 'Quantity is required.' }, { status: 400 });
    }

    if (material !== undefined && (!String(material).trim())) {
      return NextResponse.json({ error: 'Material is required.' }, { status: 400 });
    }

    const index = store.products.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const existing = store.products[index];
    const targetCategory: CategoryId =
      category && VALID_CATEGORY_IDS.has(category) ? (category as CategoryId) : existing.category;
    const matchedCategory =
      store.categories.find((c) => c.id === targetCategory) ||
      CATEGORIES.find((c) => c.id === targetCategory)!;

    const imageList: string[] = Array.isArray(images)
      ? images.filter((img: unknown) => typeof img === 'string' && img.trim().length > 0)
      : typeof image === 'string' && image.trim().length > 0
      ? [image.trim()]
      : existing.images && existing.images.length > 0
      ? existing.images
      : [existing.image];

    const updatedName =
      name !== undefined && String(name).trim() ? String(name).trim() : existing.name;
    const updatedQuantity =
      quantity !== undefined && String(quantity).trim()
        ? String(quantity).trim()
        : existing.quantity;
    const updatedMaterial =
      material !== undefined && String(material).trim()
        ? String(material).trim()
        : existing.material;
    const updatedFitMode: ImageFitMode =
      imageFitMode === 'original'
        ? 'original'
        : imageFitMode === 'edge-to-edge'
        ? 'edge-to-edge'
        : existing.imageFitMode === 'original'
        ? 'original'
        : 'edge-to-edge';

    const updatedProduct: Product = normalizeProductRecord({
      ...existing,
      name: updatedName,
      category: targetCategory,
      categoryLabel: matchedCategory.label,
      quantity: updatedQuantity,
      material: updatedMaterial,
      imageFitMode: updatedFitMode,
      image: imageList[0] || existing.image,
      detailImage: imageList[1] || imageList[0] || existing.detailImage,
      images: imageList,
    });

    store.products[index] = updatedProduct;
    writeCatalogStore(store);

    return NextResponse.json({
      product: updatedProduct,
      products: store.products,
      message: 'Product updated successfully.',
    });
  } catch (err) {
    console.error('Error updating product:', err);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isRequestAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }

    const store = readCatalogStore();
    const initialLen = store.products.length;
    store.products = store.products.filter((p) => p.id !== id);

    if (store.products.length === initialLen) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    writeCatalogStore(store);

    return NextResponse.json({
      products: store.products,
      message: 'Product deleted successfully.',
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}
