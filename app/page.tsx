'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import ProductShowcase from '@/components/ProductShowcase';
import WhyHudaHomes from '@/components/WhyHudaHomes';
import EnquirySection from '@/components/EnquirySection';
import Footer from '@/components/Footer';
import AdminPanelModal from '@/components/AdminPanelModal';
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton';
import { PRODUCTS, CATEGORIES, Product } from '@/data/products';
import { CategoryRecord } from '@/lib/catalog-store';
import { useFirebase } from '@/components/FirebaseProvider';
import {
  subscribePublicProducts,
  subscribePublicCategories,
} from '@/lib/firebase';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Home() {
  const { authReady } = useFirebase();
  const [selectedMaterialForEnquiry, setSelectedMaterialForEnquiry] = useState<string>('');
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(PRODUCTS);
  const [catalogCategories, setCatalogCategories] = useState<CategoryRecord[]>([...CATEGORIES]);
  const [adminOpen, setAdminOpen] = useState<boolean>(false);

  const darkSectionRef = useRef<HTMLElement>(null);
  const orbRef = useRef<HTMLDivElement>(null);

  // Fetch initial persisted catalog from backend on mount
  useEffect(() => {
    let active = true;
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data.products) && data.products.length > 0) {
          setCatalogProducts(data.products);
        }
        if (Array.isArray(data.categories) && data.categories.length === 8) {
          setCatalogCategories(data.categories);
        }
      })
      .catch(() => {
        // Fallback to static seed if offline
      });
    return () => {
      active = false;
    };
  }, []);

  // Subscribe to real-time Cloud Firestore public showcase updates once Firebase Auth is ready
  useEffect(() => {
    if (!authReady) return;

    let unsubProducts: (() => void) | undefined;
    let unsubCategories: (() => void) | undefined;

    try {
      unsubProducts = subscribePublicProducts((firestoreProducts) => {
        if (firestoreProducts.length > 0) {
          setCatalogProducts(firestoreProducts);
        }
      });

      unsubCategories = subscribePublicCategories((firestoreCategories) => {
        if (firestoreCategories.length === 8) {
          setCatalogCategories(firestoreCategories);
        }
      });
    } catch {
      // Handled via handleFirestoreError
    }

    return () => {
      if (unsubProducts) unsubProducts();
      if (unsubCategories) unsubCategories();
    };
  }, [authReady]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const darkSec = darkSectionRef.current;
    const orb = orbRef.current;

    if (!darkSec || !orb) return;

    // Initially hide the orb while user is in the hero section
    gsap.set(orb, { x: 0, y: 0, opacity: 0 });

    // ScrollTrigger: When scrolling through the camel section, move the coral-red light DOWN and RIGHT
    const st = ScrollTrigger.create({
      trigger: darkSec,
      start: 'top 85%',
      end: 'bottom 15%',
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        // Smoothly translates diagonally: X moves Right (+58vw), Y moves Down (+65vh)
        const targetX = window.innerWidth * 0.58 * progress;
        const targetY = window.innerHeight * 0.65 * progress;

        gsap.to(orb, {
          x: targetX,
          y: targetY,
          duration: 0.15,
          ease: 'none',
          overwrite: 'auto',
        });
      },
      onEnter: () => gsap.to(orb, { opacity: 1, duration: 0.5, ease: 'power2.out' }),
      onLeave: () => gsap.to(orb, { opacity: 0, duration: 0.5, ease: 'power2.out' }),
      onEnterBack: () => gsap.to(orb, { opacity: 1, duration: 0.5, ease: 'power2.out' }),
      onLeaveBack: () => gsap.to(orb, { opacity: 0, duration: 0.5, ease: 'power2.out' }),
    });

    return () => {
      st.kill();
    };
  }, []);

  const handleEnquireProduct = (productName: string) => {
    setSelectedMaterialForEnquiry(productName);
    const enquireEl = document.getElementById('enquire');
    if (enquireEl) {
      enquireEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCatalogUpdated = (
    nextProducts: Product[],
    nextCategories?: CategoryRecord[]
  ) => {
    setCatalogProducts(nextProducts);
    if (nextCategories) {
      setCatalogCategories(nextCategories);
    }
    // Refresh ScrollTrigger measurements if product heights changed
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#B2967D] text-white flex flex-col">
      {/* 1. Minimal Header — Clean Wordmark & Essential Navigation */}
      <Header onOpenAdmin={() => setAdminOpen(true)} />

      {/* 2. Hero Section — 3D Volumetric Living Gradient, Minimal Text, Edge-to-Edge Video Plate */}
      <Hero />

      {/* 3. Warm Architectural Camel Section (#B2967D) with Down-Right Scroll-Triggered Coral-Red Light */}
      <main ref={darkSectionRef} className="dark-section relative w-full">
        {/* Scroll-Triggered Coral-Red Light Orb (Floats down-right on scroll) */}
        <div ref={orbRef} className="dark-gradient-orb" aria-hidden="true" />

        {/* Foreground Content (z-10 to sit above the ambient red light) */}
        <div className="relative z-10">
          {/* Product Showcase with 8 Category Sections & Independent See More */}
          <ProductShowcase
            onEnquireProduct={handleEnquireProduct}
            products={catalogProducts}
            categories={catalogCategories}
          />

          {/* Why HUDA HOMES — 3 Architectural Pillars */}
          <WhyHudaHomes />

          {/* Real-time Enquiry Section */}
          <EnquirySection
            prefilledMaterial={selectedMaterialForEnquiry}
            products={catalogProducts}
          />
        </div>
      </main>

      {/* 4. Understated Premium Footer with Discreet Admin Panel Trigger */}
      <Footer onOpenAdmin={() => setAdminOpen(true)} />

      {/* 5. Floating WhatsApp Direct Chat Round Logo Button (Bottom-Right) */}
      <FloatingWhatsAppButton />

      {/* 6. Dedicated Owner Admin Panel Modal */}
      <AdminPanelModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        products={catalogProducts}
        categories={catalogCategories}
        onCatalogUpdated={handleCatalogUpdated}
      />
    </div>
  );
}
