import fs from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { isRequestAuthorized } from '@/lib/catalog-store';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB per image
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface UploadedFileResult {
  index: number;
  name: string;
  url: string;
}

export interface RejectedFileResult {
  index: number;
  name: string;
  reason: string;
}

export async function POST(req: NextRequest) {
  if (!isRequestAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin authentication required to upload images.' },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No image files were provided for upload.' },
        { status: 400 }
      );
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const uploadedUrls: string[] = [];
    const uploaded: UploadedFileResult[] = [];
    const rejected: RejectedFileResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const entry = files[i];
      if (!(entry instanceof File)) {
        continue;
      }

      const mimeType = entry.type.toLowerCase();
      const ext = ALLOWED_MIME_TYPES[mimeType];

      if (!ext) {
        rejected.push({
          index: i,
          name: entry.name || `File #${i + 1}`,
          reason: `Unsupported file format (${entry.type || 'unknown'}). Allowed: JPG, JPEG, PNG, WebP.`,
        });
        continue;
      }

      if (entry.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (entry.size / (1024 * 1024)).toFixed(1);
        rejected.push({
          index: i,
          name: entry.name || `File #${i + 1}`,
          reason: `File size (${sizeMb} MB) exceeds the 10 MB maximum limit.`,
        });
        continue;
      }

      const arrayBuffer = await entry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const safeBaseName = entry.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 40);

      const uniqueFilename = `${safeBaseName || 'huda-product'}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.${ext}`;

      const filePath = path.join(UPLOAD_DIR, uniqueFilename);
      fs.writeFileSync(filePath, buffer);

      const url = `/api/uploads/${uniqueFilename}`;
      uploadedUrls.push(url);
      uploaded.push({
        index: i,
        name: entry.name,
        url,
      });
    }

    if (uploadedUrls.length === 0) {
      const firstReason =
        rejected[0]?.reason || 'No valid image files could be processed.';
      return NextResponse.json(
        {
          error: firstReason,
          rejected,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      urls: uploadedUrls,
      uploaded,
      rejected,
      message:
        rejected.length > 0
          ? `Uploaded ${uploadedUrls.length} photograph(s). ${rejected.length} file(s) skipped due to validation.`
          : `Successfully uploaded ${uploadedUrls.length} photograph(s).`,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json(
      { error: 'Failed to upload image files. Please try again.' },
      { status: 500 }
    );
  }
}
