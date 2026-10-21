'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, AlertCircle, Loader2, Phone, MapPin } from 'lucide-react';
import { PRODUCTS, Product } from '@/data/products';
import {
  saveEnquiryToFirestore,
  MAX_ENQUIRY_NAME_LENGTH,
  MAX_ENQUIRY_PHONE_LENGTH,
  MAX_ENQUIRY_COMPANY_LENGTH,
  MAX_ENQUIRY_QUANTITY_LENGTH,
  MAX_ENQUIRY_MESSAGE_LENGTH,
} from '@/lib/firebase';

interface EnquirySectionProps {
  prefilledMaterial?: string;
  products?: Product[];
}

export default function EnquirySection({
  prefilledMaterial,
  products = PRODUCTS,
}: EnquirySectionProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [projectType, setProjectType] = useState('Luxury Residential');
  const [selectedMaterialInput, setSelectedMaterialInput] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');

  const material =
    selectedMaterialInput !== null
      ? selectedMaterialInput
      : prefilledMaterial || 'Statuario Marble Console Table';

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [enquiryRef, setEnquiryRef] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setFeedbackMessage('');

    try {
      // If user is authenticated with verified Google account, also persist to Cloud Firestore
      try {
        await saveEnquiryToFirestore({
          name,
          phone,
          company,
          projectType,
          material,
          quantity,
          message,
        });
      } catch {
        // Continue to API submission even if Firestore write is skipped
      }

      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          company,
          projectType,
          material,
          quantity,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setFeedbackMessage(data.error || 'Unable to process your enquiry. Please check your details.');
        return;
      }

      setStatus('success');
      setFeedbackMessage(data.message);
      setEnquiryRef(data.enquiryId);
    } catch {
      setStatus('error');
      setFeedbackMessage('A network error occurred. Please try again or reach us directly via phone.');
    }
  };

  return (
    <section
      id="enquire"
      className="py-20 md:py-32 px-5 sm:px-8 md:px-14 max-w-[1440px] mx-auto border-t border-[#3A2618]/15"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column — Direct Studio Contact & Guidance */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-[1px] w-8 bg-[#F55B31]" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#D94E28] font-semibold">
                Private Consultation & Samples
              </span>
            </div>

            <h2
              className="font-normal tracking-[-0.03em] text-[#231C16] leading-[1.08]"
              style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)' }}
            >
              Request Samples, Slab Dossiers, or Project Pricing.
            </h2>

            <p className="mt-5 text-[#5E4E40] text-sm sm:text-base font-normal leading-relaxed">
              Whether specifying stone for a private residence, boutique hotel, or commercial
              development, our architectural stone specialists provide high-resolution lot
              photographs, physical sample boxes, and tailored cut-to-size quotations.
            </p>
          </div>

          {/* Direct Contact Details — Warm Alabaster Card (Phone & Gallery Only, Gmail removed) */}
          <div className="space-y-6 pt-6 border-t border-[#3A2618]/12 bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border shadow-md shadow-[#3A2618]/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/12 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 text-[#D94E28]" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-[0.22em] text-[#7A6858] block mb-1 font-semibold">
                  Direct Architectural Desk
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="tel:+918058694217"
                    className="text-base text-[#231C16] hover:text-[#D94E28] transition-colors font-medium tabular-nums"
                  >
                    +91 80586 94217
                  </a>
                  <span className="text-[#8C7A6B]">·</span>
                  <a
                    href="https://wa.me/918058694217"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold uppercase tracking-wider text-[#25D366] hover:underline"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
                <span className="block text-xs text-[#7A6858] mt-0.5">
                  Mon – Sat, 9:00 AM – 7:00 PM
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/12 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-[#D94E28]" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-[0.22em] text-[#7A6858] block mb-1 font-semibold">
                  Flagship Slab Gallery & Stone Yard
                </span>
                <p className="text-sm text-[#4A3C30] font-normal leading-relaxed">
                  HUDA HOMES Architectural Surfaces
                  <br />
                  Design District, Luxury Stone Pavilion
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Real-Time Interactive Form in Soft Alabaster Card */}
        <div className="lg:col-span-7">
          <div className="p-6 sm:p-10 md:p-12 rounded-3xl bg-[#FAF7F2] border border-[#3A2618]/12 shadow-xl shadow-[#3A2618]/8">
            {status === 'success' ? (
              <div className="py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#F55B31]/15 border border-[#F55B31]/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-[#D94E28]" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <span className="text-xs uppercase tracking-[0.25em] text-[#D94E28] font-semibold">
                    Enquiry Reference: {enquiryRef}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-normal text-[#231C16] tracking-tight">
                    Consultation Request Received
                  </h3>
                  <p className="text-sm text-[#5E4E40] font-normal leading-relaxed pt-2">
                    {feedbackMessage}
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('idle');
                      setMessage('');
                    }}
                    className="px-7 py-3.5 rounded-full bg-[#231C16] hover:bg-[#3A2E25] text-[#FAF7F2] text-xs font-semibold uppercase tracking-[0.18em] transition-all cursor-pointer"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="border-b border-[#3A2618]/10 pb-5 mb-6">
                  <h3 className="text-xl font-medium text-[#231C16] tracking-tight">
                    Project & Material Specification
                  </h3>
                  <p className="text-xs text-[#7A6858] mt-1 font-normal">
                    Complete the details below. Our stone specialists respond within 24 business hours.
                  </p>
                </div>

                {status === 'error' && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-600/30 flex items-center gap-3 text-red-900 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                    <span>{feedbackMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="enq-name"
                      className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold"
                    >
                      Full Name <span className="text-[#D94E28]">*</span>
                    </label>
                    <input
                      id="enq-name"
                      type="text"
                      required
                      maxLength={MAX_ENQUIRY_NAME_LENGTH}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Architect / Client Name"
                      className="w-full px-4 py-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 text-sm text-[#231C16] placeholder:text-[#8C7A6B] focus:outline-none focus:border-[#F55B31] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="enq-phone"
                      className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold"
                    >
                      Phone / WhatsApp <span className="text-[#D94E28]">*</span>
                    </label>
                    <input
                      id="enq-phone"
                      type="tel"
                      required
                      maxLength={MAX_ENQUIRY_PHONE_LENGTH}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 80586 94217"
                      className="w-full px-4 py-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 text-sm text-[#231C16] placeholder:text-[#8C7A6B] focus:outline-none focus:border-[#F55B31] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="enq-company"
                    className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold"
                  >
                    Firm / Studio Name
                  </label>
                  <input
                    id="enq-company"
                    type="text"
                    maxLength={MAX_ENQUIRY_COMPANY_LENGTH}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Optional architectural or design firm"
                    className="w-full px-4 py-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 text-sm text-[#231C16] placeholder:text-[#8C7A6B] focus:outline-none focus:border-[#F55B31] focus:bg-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="enq-material"
                      className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold"
                    >
                      Primary Product / Material Interest
                    </label>
                    <select
                      id="enq-material"
                      value={material}
                      onChange={(e) => setSelectedMaterialInput(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 text-sm text-[#231C16] focus:outline-none focus:border-[#F55B31] focus:bg-white transition-colors"
                    >
                      <option value="Bespoke Multi-Stone Specification">
                        Bespoke Multi-Stone Specification
                      </option>
                      {products.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.categoryLabel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="enq-project-type"
                      className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold"
                    >
                      Project Classification
                    </label>
                    <select
                      id="enq-project-type"
                      value={projectType}
                      onChange={(e) => setProjectType(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 text-sm text-[#231C16] focus:outline-none focus:border-[#F55B31] focus:bg-white transition-colors"
                    >
                      <option value="Luxury Residential">Luxury Residential / Private Villa</option>
                      <option value="Hospitality & Hotel">Hospitality & Boutique Hotel</option>
                      <option value="Commercial & Lobby">Commercial Tower & Executive Lobby</option>
                      <option value="Retail & Gallery">Retail Flagship & Art Gallery</option>
                      <option value="Trade Sample Box">Architect Sample Box Request</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="enq-quantity"
                    className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold"
                  >
                    Estimated Area / Slab Quantity (Optional)
                  </label>
                  <input
                    id="enq-quantity"
                    type="text"
                    maxLength={MAX_ENQUIRY_QUANTITY_LENGTH}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g., 120 sq. meters, 6 bookmatched slabs, or 20mm cut-to-size"
                    className="w-full px-4 py-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 text-sm text-[#231C16] placeholder:text-[#8C7A6B] focus:outline-none focus:border-[#F55B31] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="enq-message"
                    className="block text-[11px] uppercase tracking-[0.18em] text-[#4A3C30] mb-2 font-semibold"
                  >
                    Project Notes & Finish Requirements
                  </label>
                  <textarea
                    id="enq-message"
                    rows={4}
                    maxLength={MAX_ENQUIRY_MESSAGE_LENGTH}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Share preferred finishes (polished, honed, bookmatched), delivery location, or project timeline..."
                    className="w-full px-4 py-3.5 rounded-xl bg-[#F3EDE2] border border-[#3A2618]/15 text-sm text-[#231C16] placeholder:text-[#8C7A6B] focus:outline-none focus:border-[#F55B31] focus:bg-white transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-4 px-8 rounded-full bg-[#F55B31] hover:bg-[#D94E28] disabled:opacity-60 text-white font-semibold text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#F55B31]/25 cursor-pointer"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Registering Consultation...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Material Enquiry</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
