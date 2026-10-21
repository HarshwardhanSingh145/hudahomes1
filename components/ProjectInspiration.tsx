'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { INSPIRATION_PROJECTS } from '@/data/projects';

export default function ProjectInspiration() {
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', 'Living', 'Bathroom', 'Kitchen', 'Exterior'];

  const filtered = filter === 'All'
    ? INSPIRATION_PROJECTS
    : INSPIRATION_PROJECTS.filter((p) => p.category === filter);

  return (
    <section id="inspiration" className="relative py-24 md:py-32 px-6 md:px-12 border-t border-white/20">
      <div className="max-w-7xl mx-auto">
        {/* Header — Crisp White & Warm Cream on #B2967D Camel */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="block text-[11px] uppercase tracking-[0.28em] font-semibold text-[#FAF6F0] camel-subtext-shadow mb-3">
              Realized Spaces
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white camel-heading-shadow text-balance">
              Project Inspiration.
            </h2>
          </div>

          {/* Interactive Filter Controls — Soft Alabaster & Coral Active State */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-xs uppercase tracking-wider font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  filter === cat
                    ? 'bg-[#F55B31] text-white shadow-md shadow-[#F55B31]/25 border border-[#F55B31]'
                    : 'bg-[#FAF7F2]/92 text-[#231C16] hover:bg-white hover:text-[#D94E28] border border-[#3A2618]/12 shadow-xs'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Editorial Grid — Framed in Soft Alabaster with Dark Text Plate */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filtered.map((project, idx) => (
            <div
              key={project.id}
              className={`group relative rounded-2xl overflow-hidden bg-[#FAF7F2] p-2 sm:p-2.5 border border-[#3A2618]/12 hover:border-[#F55B31]/50 shadow-lg shadow-[#3A2618]/10 transition-all duration-300 ${
                idx === 0 ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div className="relative w-full h-80 sm:h-96 min-h-[300px] rounded-xl overflow-hidden bg-[#EFE9DF]">
                <Image
                  src={project.image}
                  alt={`${project.title} — architectural photography`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                />

                {/* Subtle top-to-bottom depth scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#231C16]/45 via-transparent to-transparent transition-all duration-300" />

                {/* Category label */}
                <div className="absolute top-3.5 left-3.5">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold bg-[#FAF7F2]/92 backdrop-blur-md px-3 py-1 rounded-md border border-[#3A2618]/12 text-[#231C16]">
                    {project.category}
                  </span>
                </div>

                {/* Soft Alabaster & Ivory Caption Card with Dark Text */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-[#FAF7F2]/95 backdrop-blur-md rounded-xl p-4 border border-[#3A2618]/12 shadow-md">
                  <div className="flex items-center gap-1.5 text-xs text-[#5E4E40] mb-0.5">
                    <MapPin className="w-3 h-3 text-[#D94E28] shrink-0" />
                    <span>{project.location}</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-medium text-[#231C16]">
                    {project.title}
                  </h3>

                  <div className="mt-2 pt-2 border-t border-[#3A2618]/10 flex items-center justify-between text-xs text-[#4A3C30]">
                    <span className="font-medium truncate">{project.material}</span>
                    {project.architect && (
                      <span className="text-[10px] uppercase tracking-wider text-[#7A6858] shrink-0">
                        {project.architect}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
