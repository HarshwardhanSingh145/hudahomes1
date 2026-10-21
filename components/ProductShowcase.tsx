'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  PRODUCTS,
  CATEGORIES,
  CategoryId,
  Product,
  normalizeProductRecord,
} from '@/data/products';
import { CategoryRecord } from '@/lib/catalog-store';
import CategoryTabs from './CategoryTabs';

interface ProductShowcaseProps {
  onEnquireProduct?: (productName: string) => void;
  products?: Product[];
  categories?: CategoryRecord[];
}

const INITIAL_PRODUCTS_PER_CATEGORY = 4;
const EXPANDED_STORAGE_KEY = 'huda_showcase_expanded_categories';

export default function ProductShowcase({
  products = PRODUCTS,
  categories = [...CATEGORIES],
}: ProductShowcaseProps) {
  const [activeCategoryJump, setActiveCategoryJump] = useState<CategoryId | 'all'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = sessionStorage.getItem(EXPANDED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const showcaseRef = useRef<HTMLElement>(null);
  const headingContainerRef = useRef<HTMLDivElement>(null);

  const normalizedProducts = useMemo(
    () => products.map((p) => normalizeProductRecord(p)),
    [products]
  );

  // Group products by category once for fast lookup and zero duplication
  const productsByCategory = useMemo(() => {
    const grouped: Record<CategoryId, Product[]> = {
      'console-table': [],
      'lander': [],
      'side-tables': [],
      'dining-tables': [],
      'fireplace': [],
      'pedistal': [],
      'washbasin': [],
      'other-beautiful-handicrafts': [],
    };
    normalizedProducts.forEach((product) => {
      if (grouped[product.category]) {
        grouped[product.category].push(product);
      }
    });
    return grouped;
  }, [normalizedProducts]);

  // Category counts for the top navigation pills
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = { all: normalizedProducts.length };
    categories.forEach((cat) => {
      counts[cat.id] = productsByCategory[cat.id]?.length || 0;
    });
    return counts;
  }, [normalizedProducts.length, categories, productsByCategory]);

  // GSAP Animation applied strictly to the Products Section Heading (not product cards or images)
  useEffect(() => {
    const headingEl = headingContainerRef.current;
    if (!headingEl || typeof window === 'undefined') return;

    // Respect reduced-motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      const kicker = headingEl.querySelector('.products-heading-kicker');
      const words = headingEl.querySelectorAll('.products-heading-word');
      const subtitle = headingEl.querySelector('.products-heading-subtitle');

      gsap.set(words, {
        opacity: 0,
        y: 28,
      });

      if (kicker) {
        gsap.set(kicker, { opacity: 0, y: 14 });
      }
      if (subtitle) {
        gsap.set(subtitle, { opacity: 0, y: 16 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: headingEl,
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
      });

      if (kicker) {
        tl.to(kicker, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          ease: 'power2.out',
        });
      }

      tl.to(
        words,
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.09,
          ease: 'power3.out',
        },
        kicker ? '-=0.25' : 0
      );

      if (subtitle) {
        tl.to(
          subtitle,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power2.out',
          },
          '-=0.35'
        );
      }
    }, headingEl);

    return () => {
      ctx.revert();
    };
  }, []);

  // Independent See More / See Less toggle for a single category
  const handleToggleCategoryExpand = (categoryId: CategoryId) => {
    setExpandedCategories((prev) => {
      const next = {
        ...prev,
        [categoryId]: !prev[categoryId],
      };
      try {
        sessionStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  // Smooth jump to a specific category section when clicking top category pills
  const handleSelectCategoryPill = (id: CategoryId | 'all') => {
    setActiveCategoryJump(id);
    if (id !== 'all') {
      const sectionEl = document.getElementById(`category-section-${id}`);
      if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const headingWords = ['Materials', '&', 'Bespoke', 'Creations.'];

  return (
    <section
      ref={showcaseRef}
      id="materials"
      className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-10 lg:px-14"
    >
      <div className="max-w-[1440px] mx-auto">
        {/* Main Showcase Header — Animated with GSAP Word-by-Word Reveal */}
        <div
          ref={headingContainerRef}
          className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 sm:mb-12 md:mb-16"
        >
          <span className="products-heading-kicker text-[11px] uppercase tracking-[0.28em] font-semibold text-[#FAF6F0] camel-subtext-shadow mb-3 sm:mb-4">
            Curated Architectural Catalogue
          </span>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-light tracking-[-0.02em] text-white camel-heading-shadow text-balance"
            aria-label="Materials & Bespoke Creations."
          >
            {headingWords.map((word, idx) => (
              <React.Fragment key={`${word}-${idx}`}>
                <span className="products-heading-word inline-block">
                  {word}
                </span>
                {idx < headingWords.length - 1 ? ' ' : ''}
              </React.Fragment>
            ))}
          </h2>

          <p className="products-heading-subtitle mt-2.5 sm:mt-4 text-xs sm:text-base text-[#FAF6F0] font-normal tracking-wide max-w-lg camel-subtext-shadow">
            Explore our eight signature collections of carved marble furniture, architectural landers, fireplaces, washbasins, and stone handicrafts.
          </p>
        </div>

        {/* Quick Category Jump Bar */}
        <div className="mb-12 sm:mb-16 md:mb-20">
          <CategoryTabs
            activeCategory={activeCategoryJump}
            onSelectCategory={handleSelectCategoryPill}
            productCounts={productCounts}
          />
        </div>

        {/* 8 Separate Category Showcase Sections */}
        <div className="space-y-16 sm:space-y-20 md:space-y-24">
          {categories.map((category, catIdx) => {
            const allCategoryProducts = productsByCategory[category.id] || [];
            const isExpanded = !!expandedCategories[category.id];
            const hasMoreThanFour = allCategoryProducts.length > INITIAL_PRODUCTS_PER_CATEGORY;
            const visibleProducts = isExpanded
              ? allCategoryProducts
              : allCategoryProducts.slice(0, INITIAL_PRODUCTS_PER_CATEGORY);

            return (
              <div
                key={category.id}
                id={`category-section-${category.id}`}
                className={`scroll-mt-28 ${
                  catIdx > 0 ? 'pt-12 sm:pt-16 border-t border-white/20' : ''
                }`}
              >
                {/* Category Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-7 sm:mb-10">
                  <div>
                    <div className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em] text-[#FAF6F0] font-semibold camel-subtext-shadow mb-1.5">
                      <span className="tabular-nums">0{catIdx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {visibleProducts.length} of {allCategoryProducts.length} Pieces Shown
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-white camel-heading-shadow">
                      {category.label}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-[#FAF6F0]/95 font-normal max-w-md camel-subtext-shadow">
                    {category.description}
                  </p>
                </div>

                {/* Large, Prominent Product Grid — 1 Col Mobile, 2 Col Tablet/Desktop, 3 Col Wide */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
                  {visibleProducts.map((product) => {
                    const isOriginalRatio = product.imageFitMode === 'original';
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${encodeURIComponent(product.id)}`}
                        className="catalogue-card group flex flex-col bg-[#FAF7F2] rounded-2xl overflow-hidden border border-[#3A2618]/12 hover:border-[#F55B31]/60 transition-colors duration-200 cursor-pointer shadow-lg shadow-[#3A2618]/12 hover:shadow-2xl hover:shadow-[#3A2618]/20"
                      >
                        {/* Product Photograph Container — Supports Edge-to-Edge or Original Aspect Ratio Showcase (Zero Text Overlays) */}
                        <div
                          className={
                            isOriginalRatio
                              ? 'relative w-full bg-[#EFE9DF] flex items-center justify-center overflow-hidden'
                              : 'relative w-full aspect-[4/3] bg-[#EFE9DF] p-0 overflow-hidden'
                          }
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image}
                            alt={product.name}
                            loading="lazy"
                            className={
                              isOriginalRatio
                                ? 'w-full h-auto max-h-[440px] object-contain object-center select-none block'
                                : 'w-full h-full object-cover object-center select-none block'
                            }
                            referrerPolicy="no-referrer"
                          />
                        </div>

                      {/* Product Information Plate — Strictly 3 Fields Outside the Photograph */}
                      <div className="p-5 sm:p-6 flex flex-col gap-3.5 bg-gradient-to-b from-[#FAF7F2] to-[#F3EDE2] border-t border-[#3A2618]/10">
                        {/* 1. Product Name */}
                        <div>
                          <span className="block text-[10px] uppercase tracking-[0.2em] text-[#7A6858] font-semibold mb-0.5">
                            Product Name
                          </span>
                          <h4 className="text-base sm:text-lg md:text-xl font-semibold tracking-tight text-[#231C16] group-hover:text-[#D94E28] transition-colors">
                            {product.name}
                          </h4>
                        </div>

                        {/* 2. Quantity & 3. Material */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#3A2618]/10">
                          <div>
                            <span className="block text-[10px] uppercase tracking-[0.18em] text-[#7A6858] font-semibold mb-0.5">
                              Quantity
                            </span>
                            <p className="text-xs sm:text-sm font-semibold text-[#231C16] tabular-nums">
                              {product.quantity}
                            </p>
                          </div>

                          <div>
                            <span className="block text-[10px] uppercase tracking-[0.18em] text-[#7A6858] font-semibold mb-0.5">
                              Material
                            </span>
                            <p className="text-xs sm:text-sm font-semibold text-[#231C16]">
                              {product.material}
                            </p>
                          </div>
                        </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Independent See More / See Less Button (Hidden if category has 4 or fewer products) */}
                {hasMoreThanFour && (
                  <div className="mt-8 sm:mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryExpand(category.id)}
                      aria-expanded={isExpanded}
                      className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#FAF7F2] hover:bg-[#F55B31] text-[#231C16] hover:text-white border border-[#3A2618]/15 hover:border-[#F55B31] text-xs font-semibold uppercase tracking-[0.2em] shadow-md shadow-[#3A2618]/10 hover:shadow-xl hover:shadow-[#F55B31]/25 transition-all duration-200 cursor-pointer active:scale-[0.98] whitespace-nowrap"
                    >
                      <span>{isExpanded ? 'See Less' : 'See More'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 transition-transform" />
                      ) : (
                        <ChevronDown className="w-4 h-4 transition-transform" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-16 sm:mt-20 pt-10 border-t border-white/20 text-center">
          <p className="text-[11px] sm:text-xs text-[#FAF6F0]/90 tracking-widest uppercase camel-subtext-shadow">
            Custom dimensions, bookmatched quarry blocks, and bespoke stone carvings crafted to architectural specification.
          </p>
        </div>
      </div>
    </section>
  );
}
