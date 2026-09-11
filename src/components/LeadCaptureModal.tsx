'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, CheckCircle, Lock, Mail, Phone, ShieldCheck, User, X, AlertCircle, Loader2 } from 'lucide-react';
import { VehicleData } from './ConfirmCarModal';

interface LeadCaptureModalProps {
  isOpen: boolean;
  vehicle: VehicleData | null;
  imageUrls?: string[];
  notes?: string;
  onSuccess: (leadId: string) => void;
  onBack: () => void;
  onClose: () => void;
}

export function LeadCaptureModal({
  isOpen,
  vehicle,
  imageUrls = [],
  notes = '',
  onSuccess,
  onBack,
  onClose,
}: LeadCaptureModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const vehicleTitle = vehicle
    ? [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')
    : 'Selected Vehicle';

  const formatUsPhone = (val: string) => {
    // Strip non-digits
    const clean = val.replace(/\D/g, '');
    if (clean.length === 0) return '';
    if (clean.length <= 3) return `(${clean}`;
    if (clean.length <= 6) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUsPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorMessage('Please enter a valid 10-digit US phone number.');
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please consent to receiving your damage calculation report.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: `+1 ${phone}`,
          email: email.trim().toLowerCase(),
          vehicleYear: vehicle?.year || null,
          vehicleMake: vehicle?.make || null,
          vehicleModel: vehicle?.model || null,
          vehicleTrim: vehicle?.trim || null,
          vehicleBody: vehicle?.bodyClass || null,
          transmission: vehicle?.transmission || null,
          fuelType: vehicle?.fuelType || null,
          vin: vehicle?.vin || null,
          notes: notes || null,
          imageUrls: imageUrls.slice(0, 5), // pass initial thumbnails if available
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to capture lead details.');
      }

      // Store lead ID in sessionStorage for report binding
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('current_lead_id', data.lead.id);
      }

      onSuccess(data.lead.id);
    } catch (err: any) {
      console.error('Lead capture error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/30 overflow-hidden text-white"
        >
          {/* Top Progress / Brand Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Your calculation is almost ready
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Confirm your contact details so our shop estimator can deliver your official itemized appraisal and OEM part pricing.
              </p>
            </div>

            {/* Confirmed Car Badge Chip */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Confirmed Vehicle
                  </span>
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {vehicleTitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onBack}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded hover:bg-cyan-500/10 transition-colors shrink-0"
              >
                Change
              </button>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. David Miller"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              {/* Phone Number with US country code */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  US Phone Number <span className="text-cyan-400">*</span>
                </label>
                <div className="relative flex">
                  <div className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-700/80 bg-slate-800 text-slate-300 text-xs font-semibold tracking-wider">
                    🇺🇸 +1
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="(555) 234-5678"
                    maxLength={14}
                    className="w-full px-3.5 py-2.5 rounded-r-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Our estimators call within 15 minutes to review part availability.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. david.miller@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span>
                    I authorize CARFIX US partner repair shops to contact me with my formal repair quote and OEM part availability.
                  </span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:via-teal-400 hover:to-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Calculation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Show My Calculation & Free Estimate</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>256-Bit SSL Encrypted • Zero Spam Guarantee</span>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
