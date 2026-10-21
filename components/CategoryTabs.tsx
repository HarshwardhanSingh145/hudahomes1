'use client';

import React from 'react';
import { Layers, Mountain, Grid3X3, Square, Gem, Sparkles } from 'lucide-react';
import { CATEGORIES, CategoryId } from '@/data/products';

interface CategoryTabsProps {
  activeCategory: CategoryId | 'all';
  onSelectCategory: (id: CategoryId | 'all') => void;
  productCounts?: Record<string, number>;
}

export default function CategoryTabs({
  activeCategory,
  onSelectCategory,
  productCounts,
}: CategoryTabsProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'Layers':
        return <Layers className="w-3.5 h-3.5" />;
      case 'Mountain':
        return <Mountain className="w-3.5 h-3.5" />;
      case 'Grid3X3':
        return <Grid3X3 className="w-3.5 h-3.5" />;
      case 'Square':
        return <Square className="w-3.5 h-3.5" />;
      case 'Gem':
        return <Gem className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="w-full flex items-center justify-start xl:justify-center overflow-x-auto no-scrollbar py-2 px-1">
      <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap min-w-max p-1.5 rounded-full bg-[#FAF7F2]/30 border border-white/30 backdrop-blur-md shadow-sm">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const count = productCounts ? productCounts[cat.id] : undefined;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`glass-tab cursor-pointer text-xs font-medium tracking-wide whitespace-nowrap shrink-0 ${
                isActive ? 'active' : ''
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#D94E28]'}>
                {getIcon(cat.icon)}
              </span>
              <span>{cat.label}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full tabular-nums transition-colors ${
                    isActive
                      ? 'bg-white/25 text-white font-semibold'
                      : 'bg-[#231C16]/8 text-[#5E4E40]'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
