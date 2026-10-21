'use client';

import React from 'react';
import { ArrowUp, Instagram, Linkedin, Globe, Phone, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenAdmin }: FooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#9B7E66] text-white border-t border-white/25 pt-20 pb-12 px-6 md:px-12 select-none">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/20">
          {/* Brand Info */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-lg uppercase tracking-[0.32em] text-white camel-heading-shadow">
                HUDA HOMES
              </span>
              <p className="text-[10px] uppercase tracking-[0.38em] text-[#FAF6F0] mt-1 camel-subtext-shadow">
                Architectural Surfaces &amp; Natural Stone
              </p>
              <p className="mt-6 text-xs text-[#FAF6F0]/90 leading-relaxed font-normal max-w-sm camel-subtext-shadow">
                Curating rare Italian marble, natural stone slabs, porcelain and ceramic tiles for visionary private residences and commercial architecture worldwide.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="text-xs text-[#FAF6F0] tracking-wider camel-subtext-shadow">
                Private Viewing Gallery · Open by Appointment
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h4 className="text-[11px] uppercase tracking-[0.24em] text-[#FAF6F0]/80 mb-5 font-semibold camel-subtext-shadow">
              Navigation
            </h4>
            <ul className="space-y-3 text-xs tracking-wider font-normal text-[#FAF6F0]">
              <li>
                <button
                  onClick={() => scrollTo('materials')}
                  className="hover:text-white transition-colors cursor-pointer camel-subtext-shadow whitespace-nowrap"
                >
                  Curated Materials Library
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('about')}
                  className="hover:text-white transition-colors cursor-pointer camel-subtext-shadow whitespace-nowrap"
                >
                  Our Philosophy &amp; Sourcing
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('enquire')}
                  className="hover:text-white transition-colors cursor-pointer camel-subtext-shadow whitespace-nowrap"
                >
                  Architectural Enquiry
                </button>
              </li>
            </ul>
          </div>

          {/* Material Categories */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] uppercase tracking-[0.24em] text-[#FAF6F0]/80 mb-5 font-semibold camel-subtext-shadow">
              Categories
            </h4>
            <ul className="space-y-2.5 text-xs tracking-wider font-normal text-[#FAF6F0] camel-subtext-shadow">
              <li>Console Table</li>
              <li>Lander</li>
              <li>Side Tables</li>
              <li>Dining Tables</li>
              <li>Fireplace</li>
              <li>Pedistal</li>
              <li>Washbasin</li>
              <li>Other Beautiful Handicrafts</li>
            </ul>
          </div>

          {/* Connect / Social (Email/Gmail removed) */}
          <div className="lg:col-span-2">
            <h4 className="text-[11px] uppercase tracking-[0.24em] text-[#FAF6F0]/80 mb-5 font-semibold camel-subtext-shadow">
              Studio
            </h4>
            <div className="flex flex-col gap-3 text-xs text-[#FAF6F0]">
              <a
                href="tel:+918058694217"
                className="hover:text-white transition-colors flex items-center gap-2 camel-subtext-shadow tabular-nums"
              >
                <Phone className="w-3.5 h-3.5 text-white shrink-0" />
                <span>+91 80586 94217</span>
              </a>
              <a
                href="https://wa.me/918058694217"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors flex items-center gap-2 camel-subtext-shadow tabular-nums"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[#25D366] shrink-0" />
                <span>WhatsApp: +91 80586 94217</span>
              </a>
              <div className="pt-2 flex items-center gap-3 text-white">
                <a
                  href="#enquire"
                  aria-label="Instagram"
                  className="p-2 rounded-full bg-white/15 border border-white/25 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="#enquire"
                  aria-label="LinkedIn"
                  className="p-2 rounded-full bg-white/15 border border-white/25 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="#enquire"
                  aria-label="Studio Website"
                  className="p-2 rounded-full bg-white/15 border border-white/25 hover:bg-white/25 transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#FAF6F0]/85 font-normal camel-subtext-shadow">
          <p>© {new Date().getFullYear()} HUDA HOMES. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
            <a href="#materials" className="hover:text-white transition-colors cursor-pointer whitespace-nowrap">
              Architectural Specifications
            </a>
            <a href="#enquire" className="hover:text-white transition-colors cursor-pointer whitespace-nowrap">
              Privacy Policy
            </a>
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 text-[#FAF6F0]/85 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Lock className="w-3 h-3" />
                <span>Admin Panel</span>
              </button>
            )}
            <button
              onClick={scrollToTop}
              className="p-2 rounded-full bg-[#FAF7F2] hover:bg-white text-[#231C16] border border-[#3A2618]/15 transition-colors cursor-pointer shadow-sm"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
