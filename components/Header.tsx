'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Lock } from 'lucide-react';

interface HeaderProps {
  onOpenAdmin?: () => void;
}

export default function Header({ onOpenAdmin }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#9E8269]/92 backdrop-blur-xl border-b border-white/20 py-4 shadow-xl shadow-[#3A2618]/15'
          : 'bg-[#3A2618]/12 backdrop-blur-md border-b border-white/15 py-5 md:py-7'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between gap-8">
        {/* Brand Wordmark — Pure #FFFFFF, 600 weight */}
        <a
          href="#"
          className="group flex flex-col tracking-[0.28em] text-white select-none header-logo shrink-0"
        >
          <span className="font-semibold text-base md:text-lg uppercase tracking-[0.32em] text-white drop-shadow-sm whitespace-nowrap">
            HUDA HOMES
          </span>
          <span className="text-[9px] uppercase tracking-[0.38em] text-[#FAF6F0] font-medium -mt-0.5 drop-shadow-sm whitespace-nowrap">
            Architectural Surfaces
          </span>
        </a>

        {/* Desktop Minimal Navigation — Pure #FFFFFF, 500 weight, full opacity */}
        <nav className="hidden md:flex items-center gap-9 text-xs tracking-[0.2em] uppercase header-nav">
          <button
            onClick={() => scrollTo('materials')}
            className="header-nav-link cursor-pointer whitespace-nowrap shrink-0"
          >
            Materials
          </button>
          <button
            onClick={() => scrollTo('about')}
            className="header-nav-link cursor-pointer whitespace-nowrap shrink-0"
          >
            About
          </button>
          <button
            onClick={() => scrollTo('enquire')}
            className="header-nav-link cursor-pointer whitespace-nowrap shrink-0"
          >
            Enquire
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-full text-white bg-white/15 border border-white/30 backdrop-blur-md hover:bg-white/25 transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[69px] bg-[#9E8269]/96 backdrop-blur-2xl border-b border-white/20 px-6 py-8 flex flex-col gap-5 shadow-2xl transition-all">
          <nav className="flex flex-col gap-4 text-sm tracking-[0.2em] uppercase font-medium text-white">
            <button
              onClick={() => scrollTo('materials')}
              className="text-left py-2 border-b border-white/10 hover:text-[#F68B55] transition-colors"
            >
              Materials
            </button>
            <button
              onClick={() => scrollTo('about')}
              className="text-left py-2 border-b border-white/10 hover:text-[#F68B55] transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollTo('enquire')}
              className="text-left py-2 border-b border-white/10 hover:text-[#F68B55] transition-colors"
            >
              Enquire
            </button>
            {onOpenAdmin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="text-left py-2 pt-3 flex items-center gap-2 text-xs text-[#FAF6F0]/85 hover:text-white transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Panel</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
