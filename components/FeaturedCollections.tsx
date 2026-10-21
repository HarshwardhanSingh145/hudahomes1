'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { FEATURED_COLLECTIONS, Collection } from '@/data/collections';

interface FeaturedCollectionsProps {
  onSelectCollection?: (collection: Collection) => void;
}

export default function FeaturedCollections({ onSelectCollection }: FeaturedCollectionsProps) {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="collections" className="relative py-24 md:py-32 px-6 md:px-12 border-t border-white/20">
      <div className="max-w-7xl mx-auto">
        {/* Section Header — Crisp White & Warm Cream on #B2967D Camel */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="block text-[11px] uppercase tracking-[0.28em] font-semibold text-[#FAF6F0] camel-subtext-shadow mb-3">
              Editorial Series
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white camel-heading-shadow text-balance">
              Featured Collections
            </h2>
          </div>
          <p className="text-sm text-[#FAF6F0] font-normal max-w-sm tracking-wide camel-subtext-shadow">
            Curated stone narratives composed for bespoke residential residences and contemporary architectural landmarks.
          </p>
        </div>

        {/* 3 Editorial Collection Cards — Soft Alabaster & Ivory with Dark Espresso Text */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {FEATURED_COLLECTIONS.map((col, index) => (
            <div
              key={col.id}
              onClick={() => {
                if (onSelectCollection) onSelectCollection(col);
                scrollTo('materials');
              }}
              className="group relative rounded-2xl md:rounded-3xl overflow-hidden bg-[#FAF7F2] border border-[#3A2618]/12 hover:border-[#F55B31]/55 transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-lg shadow-[#3A2618]/10 hover:shadow-xl hover:shadow-[#3A2618]/16 hover:-translate-y-0.5"
            >
              {/* Large Rectangular 2D Image */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFE9DF]">
                <Image
                  src={col.image}
                  alt={`${col.title} — 2D architectural collection photograph`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#231C16]/45 via-transparent to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="text-[10px] uppercase tracking-[0.22em] font-semibold bg-[#FAF7F2]/92 backdrop-blur-md px-3 py-1 rounded-md border border-[#3A2618]/12 text-[#231C16] tabular-nums">
                    0{index + 1}. Series
                  </span>
                </div>

                <div className="absolute bottom-4 right-4">
                  <span className="text-[10px] uppercase tracking-wider font-medium text-[#231C16] bg-[#FAF7F2]/92 backdrop-blur-md px-2.5 py-1 rounded-md border border-[#3A2618]/12 tabular-nums">
                    {col.materialsCount}
                  </span>
                </div>
              </div>

              {/* Alabaster & Ivory Card Body with Dark Text */}
              <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between bg-gradient-to-b from-[#FAF7F2] to-[#F3EDE2]">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#D94E28] font-semibold">
                    {col.category}
                  </span>
                  <h3 className="text-2xl font-medium text-[#231C16] mt-1 group-hover:text-[#D94E28] transition-colors">
                    {col.title}
                  </h3>
                  <p className="text-xs text-[#635345] tracking-wider font-normal mt-0.5">
                    {col.tagline}
                  </p>

                  <p className="mt-4 text-xs sm:text-sm text-[#4A3C30] font-normal leading-relaxed">
                    {col.description}
                  </p>

                  {/* Curated Aspects */}
                  <ul className="mt-5 space-y-1.5 text-xs text-[#5E4E40]">
                    {col.aspects.map((aspect, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-[#D94E28] font-bold" aria-hidden="true">·</span>
                        <span>{aspect}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom link */}
                <div className="mt-8 pt-4 border-t border-[#3A2618]/10 flex items-center justify-between text-xs">
                  <span className="text-[#231C16] group-hover:text-[#D94E28] font-semibold tracking-[0.16em] uppercase flex items-center gap-2 transition-colors whitespace-nowrap">
                    View Materials
                    <ArrowRight className="w-3.5 h-3.5 text-[#D94E28] group-hover:translate-x-1.5 transition-transform" />
                  </span>
                  <span className="text-[10px] text-[#7A6858] tracking-widest uppercase">
                    Inquire Availability
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
