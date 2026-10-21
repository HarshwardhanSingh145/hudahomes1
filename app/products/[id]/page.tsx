'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Loader2,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  PRODUCTS,
  Product,
  normalizeProductRecord,
  OWNER_PHONE_DISPLAY,
  OWNER_TEL_URL,
  OWNER_WHATSAPP_URL,
} from '@/data/products';
import { useFirebase } from '@/components/FirebaseProvider';
import { subscribePublicProducts } from '@/lib/firebase';
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton';

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { authReady } = useFirebase();

  const rawId = typeof params?.id === 'string' ? decodeURIComponent(params.id) : '';

  const [product, setProduct] = useState<Product | null>(() => {
    const fromSeed = PRODUCTS.find((p) => p.id === rawId);
    return fromSeed ? normalizeProductRecord(fromSeed) : null;
  });
  const [loading, setLoading] = useState<boolean>(!product);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Full-Screen Zoomable Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; originX: number; originY: number }>({
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
  });
  const didDragMoveRef = useRef<boolean>(false);
  const lightboxImgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const imgEl = lightboxImgRef.current;
    if (!imgEl) return;
    imgEl.style.transform = `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomScale})`;
    imgEl.style.transition = isDragging
      ? 'none'
      : 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)';
  }, [panOffset.x, panOffset.y, zoomScale, isDragging, isLightboxOpen, activeImageIndex]);

  const resetZoomAndPan = useCallback(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  const openLightbox = useCallback(() => {
    resetZoomAndPan();
    setIsLightboxOpen(true);
  }, [resetZoomAndPan]);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    resetZoomAndPan();
  }, [resetZoomAndPan]);

  const handleZoomIn = useCallback(() => {
    setZoomScale((prev) => Math.min(MAX_ZOOM, Number((prev + ZOOM_STEP).toFixed(2))));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomScale((prev) => {
      const next = Math.max(MIN_ZOOM, Number((prev - ZOOM_STEP).toFixed(2)));
      if (next <= 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  // Fetch from persistent server store on mount (covers newly added & bulk-uploaded products)
  useEffect(() => {
    if (!rawId) return;
    let active = true;

    fetch(`/api/products?id=${encodeURIComponent(rawId)}`)
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (data?.product) {
          setProduct(normalizeProductRecord(data.product));
          setActiveImageIndex(0);
        }
      })
      .catch(() => {
        // Fallback to seed or Firestore subscription
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [rawId]);

  // Also listen to real-time Cloud Firestore updates if available
  useEffect(() => {
    if (!authReady || !rawId) return;
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribePublicProducts((firestoreProducts) => {
        const matched = firestoreProducts.find((p) => p.id === rawId);
        if (matched) {
          setProduct(normalizeProductRecord(matched));
          setLoading(false);
        }
      });
    } catch {
      // Ignore if offline
    }
    return () => {
      if (unsub) unsub();
    };
  }, [authReady, rawId]);

  const galleryImages = product
    ? Array.isArray(product.images) && product.images.length > 0
      ? product.images.filter(Boolean)
      : [
          product.image,
          ...(product.detailImage && product.detailImage !== product.image
            ? [product.detailImage]
            : []),
        ].filter(Boolean)
    : [];

  const displayedImage =
    galleryImages[activeImageIndex] || product?.image || '';

  // Lock background scroll and bind keyboard shortcuts while Lightbox is open
  useEffect(() => {
    if (!isLightboxOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoomAndPan();
      } else if (e.key === 'ArrowRight' && galleryImages.length > 1) {
        e.preventDefault();
        resetZoomAndPan();
        setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
      } else if (e.key === 'ArrowLeft' && galleryImages.length > 1) {
        e.preventDefault();
        resetZoomAndPan();
        setActiveImageIndex(
          (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isLightboxOpen,
    closeLightbox,
    handleZoomIn,
    handleZoomOut,
    resetZoomAndPan,
    galleryImages.length,
  ]);

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    setZoomScale((prev) => {
      const next = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, Number((prev + delta).toFixed(2)))
      );
      if (next <= 1) {
        setPanOffset({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    didDragMoveRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      originX: panOffset.x,
      originY: panOffset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || zoomScale <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      didDragMoveRef.current = true;
    }
    setPanOffset({
      x: dragStartRef.current.originX + dx,
      y: dragStartRef.current.originY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer not captured
      }
      setIsDragging(false);
    }
  };

  const handleLightboxImageClick = () => {
    if (didDragMoveRef.current) {
      didDragMoveRef.current = false;
      return;
    }
    if (zoomScale > 1) {
      resetZoomAndPan();
    } else {
      setZoomScale(2.25);
    }
  };

  const handleBackToCatalogue = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/#materials');
    }
  };

  return (
    <div className="min-h-screen bg-[#B2967D] text-white flex flex-col">
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-40 bg-[#9E8269]/95 backdrop-blur-xl border-b border-white/20 py-4 px-5 sm:px-8 md:px-12 shadow-lg shadow-[#3A2618]/10">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBackToCatalogue}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#FAF7F2] hover:bg-white text-[#231C16] border border-[#3A2618]/15 text-xs font-semibold uppercase tracking-[0.18em] transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-[#D94E28]" />
            <span>Back to Catalogue</span>
          </button>

          <Link
            href="/"
            className="flex flex-col items-end text-right tracking-[0.28em] text-white select-none"
          >
            <span className="font-semibold text-sm sm:text-base uppercase tracking-[0.32em] text-white">
              HUDA HOMES
            </span>
            <span className="text-[9px] uppercase tracking-[0.36em] text-[#FAF6F0]">
              Architectural Surfaces
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 sm:py-12 md:py-16 px-4 sm:px-8 md:px-12">
        <div className="max-w-[1440px] mx-auto">
          {loading ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-[#FAF6F0]">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
              <span className="text-xs uppercase tracking-[0.24em]">
                Loading Product Photograph...
              </span>
            </div>
          ) : !product ? (
            <div className="max-w-xl mx-auto my-16 p-8 sm:p-12 rounded-3xl bg-[#FAF7F2] text-[#231C16] border border-[#3A2618]/15 text-center shadow-xl">
              <span className="text-[11px] uppercase tracking-[0.24em] text-[#D94E28] font-semibold">
                Catalogue Notice
              </span>
              <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#231C16] mt-2">
                Product Not Found
              </h1>
              <p className="mt-3 text-sm text-[#5E4E40] leading-relaxed">
                This product may have been moved or removed from the catalogue.
              </p>
              <div className="mt-7">
                <Link
                  href="/#materials"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#F55B31] hover:bg-[#D94E28] text-white text-xs font-semibold uppercase tracking-[0.2em] transition-all shadow-lg shadow-[#F55B31]/25"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Product Showcase</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF7F2] text-[#231C16] rounded-2xl sm:rounded-3xl border border-[#3A2618]/15 shadow-2xl shadow-[#3A2618]/20 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Left / Main Area: Product Photograph Showcase (Click Image to Open Full-Screen Zoomable Lightbox) */}
                <div
                  className={`lg:col-span-8 bg-[#EFE9DF] flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#3A2618]/12 ${
                    product.imageFitMode === 'original'
                      ? 'p-3 sm:p-6 md:p-8'
                      : 'p-0'
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={openLightbox}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openLightbox();
                      }
                    }}
                    aria-label={`Open full-screen zoomable view of ${product.name}`}
                    className={
                      product.imageFitMode === 'original'
                        ? 'relative w-full min-h-[320px] sm:min-h-[480px] lg:min-h-[600px] flex items-center justify-center rounded-xl sm:rounded-2xl bg-[#EFE9DF] overflow-hidden cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-[#F55B31]'
                        : 'relative w-full aspect-[4/3] lg:aspect-auto lg:min-h-[620px] flex items-center justify-center bg-[#EFE9DF] overflow-hidden cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-[#F55B31]'
                    }
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayedImage}
                      alt={product.name}
                      className={
                        product.imageFitMode === 'original'
                          ? 'w-full h-auto max-h-[78vh] object-contain mx-auto select-none block'
                          : 'w-full h-full object-cover object-center select-none block'
                      }
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Multi-Photograph Switcher (Outside the Main Photograph) */}
                  {galleryImages.length > 1 && (
                    <div
                      className={`${
                        product.imageFitMode === 'original'
                          ? 'mt-4 pt-4'
                          : 'p-4'
                      } border-t border-[#3A2618]/10 flex items-center gap-3 overflow-x-auto no-scrollbar`}
                    >
                      {galleryImages.map((imgUrl, idx) => (
                        <button
                          key={`${imgUrl}-${idx}`}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#FAF7F2] border-2 shrink-0 transition-all cursor-pointer ${
                            product.imageFitMode === 'original' ? 'p-1' : 'p-0'
                          } ${
                            activeImageIndex === idx
                              ? 'border-[#F55B31] shadow-md scale-[1.03]'
                              : 'border-[#3A2618]/15 opacity-75 hover:opacity-100'
                          }`}
                          aria-label={`View photograph ${idx + 1} of ${product.name}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt=""
                            className={`w-full h-full ${
                              product.imageFitMode === 'original'
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

                {/* Right / Information Panel: Strictly the 3 Required Fields Outside the Image */}
                <div className="lg:col-span-4 p-6 sm:p-8 md:p-10 flex flex-col justify-between bg-gradient-to-b from-[#FAF7F2] to-[#F3EDE2]">
                  <div className="space-y-7">
                    {/* Field 1: Product Name */}
                    <div className="pb-6 border-b border-[#3A2618]/12">
                      <span className="block text-[10px] uppercase tracking-[0.24em] text-[#7A6858] font-semibold mb-2">
                        Product Name
                      </span>
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-[#231C16] leading-tight">
                        {product.name}
                      </h1>
                    </div>

                    {/* Field 2: Quantity */}
                    <div className="p-5 rounded-2xl bg-white border border-[#3A2618]/12 shadow-xs">
                      <span className="block text-[10px] uppercase tracking-[0.24em] text-[#7A6858] font-semibold mb-1.5">
                        Quantity
                      </span>
                      <p className="text-lg sm:text-xl font-semibold text-[#231C16] tabular-nums">
                        {product.quantity}
                      </p>
                    </div>

                    {/* Field 3: Material */}
                    <div className="p-5 rounded-2xl bg-white border border-[#3A2618]/12 shadow-xs">
                      <span className="block text-[10px] uppercase tracking-[0.24em] text-[#7A6858] font-semibold mb-1.5">
                        Material
                      </span>
                      <p className="text-lg sm:text-xl font-semibold text-[#231C16]">
                        {product.material}
                      </p>
                    </div>
                  </div>

                  {/* Direct Owner Contact Links (+91 80586 94217) */}
                  <div className="mt-10 pt-6 border-t border-[#3A2618]/12 space-y-3">
                    <a
                      href={OWNER_WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-semibold uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/25 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                      <span>WhatsApp ({OWNER_PHONE_DISPLAY})</span>
                    </a>

                    <a
                      href={OWNER_TEL_URL}
                      className="w-full py-3.5 px-6 rounded-full bg-[#231C16] hover:bg-[#3A2E25] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-[#F55B31]" />
                      <span>Call {OWNER_PHONE_DISPLAY}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Full-Screen Zoomable Lightbox Modal for Inspecting Marble Texture & Details */}
      {isLightboxOpen && product && (
        <div
          className="fixed inset-0 z-50 bg-[#1A1410]/95 backdrop-blur-xl flex flex-col select-none"
          role="dialog"
          aria-modal="true"
          aria-label={`Full-screen texture inspection for ${product.name}`}
        >
          {/* Lightbox Top Control Bar */}
          <div className="px-4 sm:px-6 py-3.5 bg-[#231C16]/90 border-b border-white/15 flex items-center justify-between gap-4 z-20 shrink-0">
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-[0.24em] text-[#F55B31] font-semibold">
                Texture &amp; Detail Inspection
              </span>
              <h2 className="text-sm sm:text-base font-semibold text-[#FAF7F2] truncate">
                {product.name}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 bg-[#FAF7F2]/10 border border-white/15 rounded-full p-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomScale <= MIN_ZOOM}
                  className="p-2 rounded-full text-[#FAF7F2] hover:bg-white/15 disabled:opacity-35 transition-colors cursor-pointer"
                  aria-label="Zoom out"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="px-2.5 text-xs font-semibold tabular-nums text-[#FAF7F2] min-w-[54px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomScale >= MAX_ZOOM}
                  className="p-2 rounded-full text-[#FAF7F2] hover:bg-white/15 disabled:opacity-35 transition-colors cursor-pointer"
                  aria-label="Zoom in"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={resetZoomAndPan}
                  disabled={zoomScale === 1 && panOffset.x === 0 && panOffset.y === 0}
                  className="p-2 rounded-full text-[#FAF7F2] hover:bg-white/15 disabled:opacity-35 transition-colors cursor-pointer"
                  aria-label="Reset zoom"
                  title="Reset Zoom (100%)"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={closeLightbox}
                className="p-2.5 rounded-full bg-[#FAF7F2] hover:bg-white text-[#231C16] transition-colors cursor-pointer shadow-md"
                aria-label="Close full-screen view"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Zoom & Pan Viewport */}
          <div
            onWheel={handleWheelZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                closeLightbox();
              }
            }}
            className={`relative flex-1 w-full h-full overflow-hidden flex items-center justify-center touch-none ${
              zoomScale > 1
                ? isDragging
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in'
            }`}
          >
            {/* Previous / Next Photo Controls inside Lightbox when multiple photos exist */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetZoomAndPan();
                    setActiveImageIndex(
                      (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
                    );
                  }}
                  className="absolute left-3 sm:left-6 z-20 p-3 rounded-full bg-[#231C16]/80 hover:bg-[#F55B31] text-white border border-white/20 transition-all cursor-pointer shadow-lg"
                  aria-label="Previous photograph"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetZoomAndPan();
                    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
                  }}
                  className="absolute right-3 sm:right-6 z-20 p-3 rounded-full bg-[#231C16]/80 hover:bg-[#F55B31] text-white border border-white/20 transition-all cursor-pointer shadow-lg"
                  aria-label="Next photograph"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={lightboxImgRef}
              src={displayedImage}
              alt={product.name}
              onClick={(e) => {
                e.stopPropagation();
                handleLightboxImageClick();
              }}
              draggable={false}
              referrerPolicy="no-referrer"
              className="max-w-[92vw] max-h-[80vh] w-auto h-auto object-contain select-none will-change-transform"
            />
          </div>

          {/* Bottom Thumbnail Strip & Zoom Instructions */}
          <div className="px-4 sm:px-6 py-3 bg-[#231C16]/90 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 z-20 shrink-0">
            <span className="text-[11px] text-[#FAF6F0]/80 tracking-wide">
              {zoomScale > 1
                ? 'Drag to pan across the stone surface · Click image or Reset to return to 100%'
                : 'Click image or use + / scroll wheel to zoom in and inspect texture details'}
            </span>

            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={`lightbox-thumb-${imgUrl}-${idx}`}
                    type="button"
                    onClick={() => {
                      resetZoomAndPan();
                      setActiveImageIndex(idx);
                    }}
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-[#FAF7F2] ${
                      activeImageIndex === idx
                        ? 'border-[#F55B31] scale-105'
                        : 'border-white/20 opacity-65 hover:opacity-100'
                    }`}
                    aria-label={`Inspect photograph ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating WhatsApp Button */}
      <FloatingWhatsAppButton />
    </div>
  );
}
