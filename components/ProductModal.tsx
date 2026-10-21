'use client';

import React, { useEffect, useState } from 'react';
import { X, Phone, MessageCircle } from 'lucide-react';
import {
  Product,
  normalizeProductRecord,
  OWNER_PHONE_DISPLAY,
  OWNER_TEL_URL,
  OWNER_WHATSAPP_URL,
} from '@/data/products';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onEnquireProduct?: (productName: string) => void;
}

export default function ProductModal({
  product,
  onClose,
}: ProductModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [prevProductId, setPrevProductId] = useState<string | null>(null);

  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id);
    setActiveImageIndex(0);
  }

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  if (!product) return null;

  const norm = normalizeProductRecord(product);
  const galleryImages =
    Array.isArray(norm.images) && norm.images.length > 0
      ? norm.images
      : [
          norm.image,
          ...(norm.detailImage && norm.detailImage !== norm.image
            ? [norm.detailImage]
            : []),
        ].filter(Boolean);

  const displayedImage = galleryImages[activeImageIndex] || norm.image;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#2B1E14]/65 backdrop-blur-xl transition-opacity"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl bg-[#FAF7F2] border border-[#3A2618]/15 rounded-2xl md:rounded-3xl shadow-2xl shadow-[#2B1E14]/35 overflow-hidden z-10 max-h-[88svh] flex flex-col md:flex-row my-auto">
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-30 p-2 sm:p-2.5 rounded-full bg-[#FAF7F2]/92 hover:bg-white text-[#231C16] border border-[#3A2618]/15 backdrop-blur-md transition-all cursor-pointer shadow-md"
          aria-label="Close product details"
        >
          <X className="w-4 h-4 text-[#231C16]" />
        </button>

        {/* Left: Product Photograph — Supports Edge-to-Edge or Original Aspect Ratio (Zero Text Overlays) */}
        <div
          className={`w-full md:w-[58%] bg-[#EFE9DF] flex flex-col justify-between ${
            norm.imageFitMode === 'original' ? 'p-4' : 'p-0'
          }`}
        >
          <div
            className={
              norm.imageFitMode === 'original'
                ? 'relative w-full min-h-[260px] sm:min-h-[360px] flex items-center justify-center'
                : 'relative w-full aspect-[4/3] md:aspect-auto md:min-h-[380px] flex-1 overflow-hidden'
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayedImage}
              alt={norm.name}
              className={
                norm.imageFitMode === 'original'
                  ? 'w-full h-auto max-h-[55vh] object-contain mx-auto select-none block'
                  : 'w-full h-full object-cover object-center select-none block'
              }
              referrerPolicy="no-referrer"
            />
          </div>

          {galleryImages.length > 1 && (
            <div
              className={`${
                norm.imageFitMode === 'original' ? 'mt-3 pt-3' : 'p-3'
              } border-t border-[#3A2618]/10 flex items-center gap-2 overflow-x-auto`}
            >
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    norm.imageFitMode === 'original' ? 'p-0.5' : 'p-0'
                  } bg-[#FAF7F2] ${
                    activeImageIndex === idx
                      ? 'border-[#F55B31] shadow-sm'
                      : 'border-[#3A2618]/15 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt=""
                    className={`w-full h-full ${
                      norm.imageFitMode === 'original'
                        ? 'object-contain'
                        : 'object-cover'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Strictly the 3 Required Fields Outside the Image */}
        <div className="w-full md:w-[42%] p-5 sm:p-7 flex flex-col justify-between bg-[#FAF7F2]">
          <div className="space-y-5">
            <div>
              <span className="block text-[10px] uppercase tracking-[0.22em] text-[#7A6858] font-semibold mb-1">
                Product Name
              </span>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#231C16]">
                {norm.name}
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/10">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-[#7A6858] font-semibold mb-0.5">
                Quantity
              </span>
              <p className="text-sm sm:text-base font-semibold text-[#231C16]">
                {norm.quantity}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/10">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-[#7A6858] font-semibold mb-0.5">
                Material
              </span>
              <p className="text-sm sm:text-base font-semibold text-[#231C16]">
                {norm.material}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#3A2618]/10 space-y-2.5">
            <a
              href={OWNER_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-xs tracking-[0.16em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
              <span>WhatsApp ({OWNER_PHONE_DISPLAY})</span>
            </a>
            <a
              href={OWNER_TEL_URL}
              className="w-full py-3 px-4 rounded-full bg-[#231C16] hover:bg-[#3A2E25] text-[#FAF7F2] font-semibold text-xs tracking-[0.16em] uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-[#F55B31]" />
              <span>Call {OWNER_PHONE_DISPLAY}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
