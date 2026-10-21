'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import {
  OWNER_PHONE_INTL,
  OWNER_WHATSAPP_URL,
  formatIndianWhatsAppDigits,
} from '@/data/products';

// Owner's Indian WhatsApp number in international digits-only format (918058694217)
export const WHATSAPP_NUMBER = formatIndianWhatsAppDigits(
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || OWNER_PHONE_INTL
);

export default function FloatingWhatsAppButton() {
  const whatsappUrl =
    WHATSAPP_NUMBER === OWNER_PHONE_INTL
      ? OWNER_WHATSAPP_URL
      : `https://wa.me/${WHATSAPP_NUMBER}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with HUDA HOMES on WhatsApp (+91 80586 94217)"
      title="WhatsApp"
      className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 group flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white border border-white/35 shadow-xl shadow-[#231C16]/30 hover:shadow-2xl hover:shadow-[#25D366]/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer select-none"
    >
      <MessageCircle className="w-7 h-7 fill-white text-[#25D366] transition-transform duration-200 group-hover:scale-110" />
    </a>
  );
}
