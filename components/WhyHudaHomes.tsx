'use client';

import React from 'react';
import { Compass, Sparkles, Building2 } from 'lucide-react';

export default function WhyHudaHomes() {
  const pillars = [
    {
      icon: <Sparkles className="w-5 h-5 text-[#D94E28]" />,
      title: 'Carefully Selected Materials',
      subtitle: 'Ethical sourcing & block inspection',
      description:
        'Every block is hand-inspected at historic quarries in Tuscany, Spain, and northern Italy. We selectively curate only slabs with harmonious natural veining and structural purity.',
    },
    {
      icon: <Compass className="w-5 h-5 text-[#D94E28]" />,
      title: 'Timeless Design & Finishes',
      subtitle: 'Artisan honed, velvet & leathered surfaces',
      description:
        'From high-gloss bookmatched slabs to soft honed, tactile textures. Our finishes are crafted to age gracefully, reflecting light without distraction.',
    },
    {
      icon: <Building2 className="w-5 h-5 text-[#D94E28]" />,
      title: 'Support for Architectural Projects',
      subtitle: 'Bespoke cut-to-size & technical advisory',
      description:
        'Dedicated collaboration with architects, interior studios, and builders. We provide slab matching layouts, CAD cut schedules, and direct delivery to site.',
    },
  ];

  return (
    <section id="about" className="relative py-24 md:py-32 px-6 md:px-12 border-t border-white/20">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-xl mb-16">
          <span className="block text-[11px] uppercase tracking-[0.28em] font-semibold text-[#FAF6F0] camel-subtext-shadow mb-3">
            Our Philosophy
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight text-white camel-heading-shadow text-balance">
            Why HUDA HOMES.
          </h2>
          <p className="mt-4 text-sm text-[#FAF6F0] font-normal tracking-wide camel-subtext-shadow">
            An architectural perspective on natural stone and surfaces.
          </p>
        </div>

        {/* 3 Pillars — Soft Alabaster & Ivory Cards with Dark Espresso Text */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((item, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-gradient-to-b from-[#FAF7F2] to-[#F3EDE2] border border-[#3A2618]/12 hover:border-[#F55B31]/50 shadow-lg shadow-[#3A2618]/10 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#EAE2D6] border border-[#3A2618]/10 flex items-center justify-center mb-6 group-hover:bg-[#F55B31]/12 group-hover:border-[#F55B31]/30 transition-all">
                  {item.icon}
                </div>

                <h3 className="text-xl font-medium text-[#231C16]">
                  {item.title}
                </h3>

                <p className="text-[11px] uppercase tracking-[0.2em] text-[#D94E28] font-semibold mt-1">
                  {item.subtitle}
                </p>

                <p className="mt-4 text-xs sm:text-sm text-[#4A3C30] font-normal leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#3A2618]/10 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#7A6858] tabular-nums">
                <span>0{index + 1}. Pillar</span>
                <span>Craftsmanship</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
