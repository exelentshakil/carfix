'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, CheckCircle2, Edit3, ShieldCheck, X } from 'lucide-react';

export interface VehicleData {
  make: string;
  model: string;
  year?: number | string | null;
  trim?: string | null;
  bodyClass?: string | null;
  transmission?: string | null;
  fuelType?: string | null;
  vin?: string | null;
  source?: string;
  confidence?: number;
}

interface ConfirmCarModalProps {
  isOpen: boolean;
  vehicle: VehicleData | null;
  primaryPhotoUrl?: string | null;
  onConfirm: () => void;
  onEdit: () => void;
  onClose: () => void;
}

export function ConfirmCarModal({
  isOpen,
  vehicle,
  primaryPhotoUrl,
  onConfirm,
  onEdit,
  onClose,
}: ConfirmCarModalProps) {
  if (!isOpen || !vehicle) return null;

  const vehicleTitle = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .join(' ');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-emerald-950/20 overflow-hidden text-white"
        >
          {/* Header Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-7">
            {/* Modal Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white">
                Is this your car?
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                Please confirm your vehicle details so our AI can calibrate exact OEM parts catalog and labor rates.
              </p>
            </div>

            {/* Vehicle Card Preview */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {primaryPhotoUrl ? (
                  <div className="relative w-full sm:w-28 h-24 rounded-lg overflow-hidden border border-slate-800 shrink-0 bg-slate-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryPhotoUrl}
                      alt="Uploaded car"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white tracking-wider">
                      PHOTO
                    </div>
                  </div>
                ) : (
                  <div className="w-full sm:w-28 h-24 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-600 shrink-0">
                    <Car className="w-10 h-10" />
                  </div>
                )}

                <div className="flex-1 w-full text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      {vehicle.vin ? 'US NHTSA Verified' : 'AI Vision Identified'}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-white leading-tight">
                    {vehicleTitle || 'Identified Vehicle'}
                  </h4>
                  {vehicle.vin && (
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      VIN: <span className="text-slate-200">{vehicle.vin}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Make</span>
                  <span className="font-semibold text-slate-200">{vehicle.make || '—'}</span>
                </div>
                <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Model</span>
                  <span className="font-semibold text-slate-200">{vehicle.model || '—'}</span>
                </div>
                <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Year</span>
                  <span className="font-semibold text-slate-200">{vehicle.year || '—'}</span>
                </div>
                <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Body</span>
                  <span className="font-semibold text-slate-200">{vehicle.bodyClass || 'Sedan'}</span>
                </div>
                <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Trim</span>
                  <span className="font-semibold text-slate-200">{vehicle.trim || 'Standard'}</span>
                </div>
                <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-800/50">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Transmission</span>
                  <span className="font-semibold text-slate-200">{vehicle.transmission || 'Automatic'}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onEdit}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-slate-400" />
                Edit Details
              </button>

              <button
                type="button"
                onClick={onConfirm}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                Yes, that's right
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
