'use client';

import { useState } from 'react';

interface DecodedVehicle {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyClass?: string;
}

interface VisualVehicle {
  make: string;
  model: string;
  approxYear?: string;
  bodyClass?: string;
  color?: string;
  visualCues?: string;
  confidence: number;
}

interface VinRecord {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  bodyClass?: string;
}

interface DiscrepancyInfo {
  hasDiscrepancy: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'MATCH' | 'INFO';
  title: string;
  summary: string;
  explanation: string;
  visualCues?: string;
  vinVehicleSummary: string;
  visualVehicleSummary: string;
  recommendedAction: string;
}

interface AnalysisResult {
  id: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | string;
  trim?: string | null;
  bodyClass?: string | null;
  color?: string | null;
  visualVehicle?: VisualVehicle;
  vinRecord?: VinRecord | null;
  discrepancy?: DiscrepancyInfo;
  confidence: number;
  severityOverall: string;
  costRangeLow: number;
  costRangeHigh: number;
  findings: Array<{
    id: string;
    name: string;
    description: string;
    severity: string;
    costLow: number;
    costHigh: number;
    oemNumber: string | null;
    oemStatus: string;
    oemNote?: string | null;
  }>;
  createdAt: string;
}

const SAMPLE_VINS = [
  { label: '2021 BMW 330i', vin: 'WBA5R1C58MFA00001', make: 'BMW' },
  { label: '2022 Cadillac Escalade', vin: '1GYS4HKL5NR123456', make: 'Cadillac' },
  { label: '2020 Toyota Camry', vin: '4T1B11HK4LU123456', make: 'Toyota' },
  { label: '2021 Ford F-150', vin: '1FTFW1ED5MFA00001', make: 'Ford' },
];

export default function Home() {
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [vin, setVin] = useState('');
  const [decodedVehicle, setDecodedVehicle] = useState<DecodedVehicle | null>(null);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle live VIN lookup with NHTSA
  const handleVinLookup = async (inputVin: string) => {
    const cleanVin = inputVin.trim().toUpperCase();
    setVin(cleanVin);
    setVinError(null);

    if (cleanVin.length === 0) {
      setDecodedVehicle(null);
      setVinError(null);
      return;
    }

    if (cleanVin.length !== 17) {
      setDecodedVehicle(null);
      setVinError(`VIN must be 17 characters (${cleanVin.length}/17) or clear field for photo-only analysis`);
      return;
    }

    setIsDecodingVin(true);
    try {
      const res = await fetch(`/api/vin/decode?vin=${encodeURIComponent(cleanVin)}`);
      const data = await res.json();
      if (res.ok && data.vehicle) {
        setDecodedVehicle(data.vehicle);
        setVinError(null);
      } else {
        setDecodedVehicle(null);
        setVinError(data.error || 'Could not verify VIN with US NHTSA registry');
      }
    } catch {
      setVinError('Network error checking VIN');
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removePhoto = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = err => reject(err);
    });
  };

  const handleAnalyze = async () => {
    const cleanVin = vin.trim().toUpperCase();

    if (cleanVin.length > 0 && cleanVin.length !== 17) {
      setError('VIN must be 17 characters, or clear the VIN input to run photo-only analysis.');
      return;
    }

    if (files.length === 0) {
      setError('Please upload at least one vehicle damage photo.');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      const base64Images = await Promise.all(files.map(convertFileToBase64));

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: base64Images,
          vin: cleanVin.length === 17 ? cleanVin : undefined,
          vehicle: decodedVehicle,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze vehicle collision damage');
      }

      setResult(data);
      setStep('results');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis');
      setStep('upload');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl tracking-tight text-slate-900">CarFix</span>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">US Edition</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">AI Collision Estimating & VIN Discrepancy Recognition</p>
            </div>
          </div>
          {step === 'results' && (
            <button
              onClick={() => {
                setStep('upload');
                setFiles([]);
                setPreviewUrls([]);
                setResult(null);
                setError(null);
              }}
              className="text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + New Estimate
            </button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="text-center space-y-2 pt-2">
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                US Auto Collision Estimator
              </h1>
              <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
                Upload damage photos and optionally provide a VIN. The vision AI independently identifies the vehicle, cross-verifies against NHTSA records to flag model discrepancies, and generates repair estimates.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* AUDIT & DISCREPANCY TESTING TIP CALLOUT */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="space-y-1 text-xs sm:text-sm">
                <p className="font-bold text-slate-900">
                  ⚡ Model Discrepancy & Fraud Audit Active
                </p>
                <p className="text-slate-600 leading-relaxed">
                  Our multi-modal vision system inspects brand emblems, grille geometry, and body profiles. <strong>Test it now:</strong> Enter a <strong>BMW VIN</strong> below and upload photos of a <strong>Cadillac</strong> (or any different car). The system will recognize the Cadillac in the photo, flag the critical VIN mismatch, and calibrate the estimate accordingly!
                </p>
              </div>
            </div>

            {/* SECTION 1: VIN INPUT */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                  <label htmlFor="vin-input" className="font-bold text-slate-900 text-base">
                    Vehicle Identification Number (VIN)
                  </label>
                </div>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  NHTSA Audit & OEM Matching
                </span>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <input
                    id="vin-input"
                    type="text"
                    maxLength={17}
                    value={vin}
                    onChange={(e) => handleVinLookup(e.target.value)}
                    placeholder="Enter 17-character VIN (e.g. WBA5R1C58MFA00001) or pick sample below"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base tracking-wider uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {isDecodingVin && (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {!isDecodingVin && decodedVehicle && (
                      <span className="text-green-600 text-lg" title="NHTSA Verified">✓</span>
                    )}
                  </div>
                </div>

                {vinError && (
                  <p className="text-xs text-amber-600 font-medium">{vinError}</p>
                )}

                {/* Decoded Vehicle Preview Badge */}
                {decodedVehicle && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        US
                      </div>
                      <div>
                        <p className="font-bold text-emerald-950 text-sm">
                          {decodedVehicle.year} {decodedVehicle.make} {decodedVehicle.model} {decodedVehicle.trim || ''}
                        </p>
                        <p className="text-xs text-emerald-700">
                          {decodedVehicle.bodyClass || 'Passenger Car'} • US DOT (NHTSA) Verified Record
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-200 text-emerald-800 font-mono text-xs px-2.5 py-1 rounded-md font-semibold">
                      NHTSA VERIFIED
                    </span>
                  </div>
                )}

                {/* Quick Test VIN Pills */}
                <div className="pt-2">
                  <p className="text-xs font-medium text-slate-500 mb-1.5">
                    Click to test US VINs (Try BMW vs. Cadillac photos for mismatch demo):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_VINS.map(sample => (
                      <button
                        key={sample.vin}
                        type="button"
                        onClick={() => handleVinLookup(sample.vin)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors border cursor-pointer ${
                          vin === sample.vin
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        + {sample.label}
                      </button>
                    ))}
                    {vin.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setVin('');
                          setDecodedVehicle(null);
                          setVinError(null);
                        }}
                        className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 underline cursor-pointer"
                      >
                        Clear VIN (Photo-Only Mode)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PHOTO UPLOAD */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
                  <h2 className="font-bold text-slate-900 text-base">
                    Upload Damage Photos <span className="text-red-500">* Required</span>
                  </h2>
                </div>
                <span className="text-xs font-medium text-slate-500">Up to 10 photos</span>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 transition-all cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-blue-600 font-bold hover:underline">Click to upload damage photos</span> or drag & drop
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, WebP (Front, Rear, Side, Close-ups, Brand badges)</p>
                  </div>
                </label>
              </div>

              {previewUrls.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Uploaded Damage Photos ({previewUrls.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Damage photo ${i + 1}`} className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-90 hover:opacity-100 shadow-sm cursor-pointer"
                          title="Remove photo"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={previewUrls.length === 0 || (vin.length > 0 && vin.length !== 17)}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                previewUrls.length > 0 && (vin.length === 0 || vin.length === 17)
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25 cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Run AI Collision Assessment & VIN Audit
            </button>
          </div>
        )}

        {/* PROCESSING STATE */}
        {step === 'processing' && (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center space-y-6 my-10">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-slate-100 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
              <svg className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Forensic AI Analysis in Progress</h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                1. Identifying vehicle make & model from visual styling & emblems...
                <br />
                2. Cross-referencing against US NHTSA VIN registry for discrepancies...
                <br />
                3. Evaluating collision damage and calculating OEM parts...
              </p>
            </div>
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
          </div>
        )}

        {/* RESULTS REPORT VIEW */}
        {step === 'results' && result && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* 1. CRITICAL DISCREPANCY AUDIT CARD (WHEN MISMATCH DETECTED) */}
            {result.discrepancy?.hasDiscrepancy && (
              <div className="bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 border-2 border-red-500/80 rounded-2xl p-6 shadow-md space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-red-500/30">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Critical Audit Alert
                        </span>
                        <span className="text-red-700 font-bold text-xs uppercase tracking-wider">
                          Vehicle Model Mismatch
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-red-950 mt-1">
                        {result.discrepancy.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-red-900 font-medium leading-relaxed bg-white/70 p-3.5 rounded-xl border border-red-200">
                  {result.discrepancy.explanation}
                </p>

                {/* SIDE-BY-SIDE FORENSIC COMPARISON */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* PHOTO ANALYSIS */}
                  <div className="bg-white rounded-xl p-4 border-2 border-amber-300 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                        📷 Uploaded Photos (Actual Vehicle)
                      </span>
                      <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2 py-0.5 rounded-md">
                        {Math.round((result.visualVehicle?.confidence || 0.95) * 100)}% Match
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {result.visualVehicle?.make} {result.visualVehicle?.model}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p><span className="font-semibold text-slate-700">Body Class:</span> {result.visualVehicle?.bodyClass || 'Sedan/SUV'}</p>
                      {result.visualVehicle?.color && <p><span className="font-semibold text-slate-700">Color:</span> {result.visualVehicle.color}</p>}
                      {result.visualVehicle?.visualCues && (
                        <p className="text-slate-600 italic border-t border-slate-100 pt-1.5 mt-1.5">
                          <span className="font-bold text-slate-800 not-italic">Visual Evidence:</span> {result.visualVehicle.visualCues}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* VIN REGISTRY */}
                  <div className="bg-white rounded-xl p-4 border-2 border-red-300 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-red-700 flex items-center gap-1">
                        🏛️ US NHTSA Record (Claimed VIN)
                      </span>
                      <span className="bg-red-100 text-red-800 font-bold text-xs px-2 py-0.5 rounded-md">
                        MISMATCHED
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {result.vinRecord?.year} {result.vinRecord?.make} {result.vinRecord?.model}
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p><span className="font-semibold text-slate-700">Claimed VIN:</span> <span className="font-mono font-bold text-red-700">{result.vin}</span></p>
                      <p><span className="font-semibold text-slate-700">Body Class:</span> {result.vinRecord?.bodyClass || 'Sedan'}</p>
                      <p className="text-red-700 font-semibold border-t border-slate-100 pt-1.5 mt-1.5">
                        ⚠️ Status: Submitted VIN does NOT match the physical vehicle photographed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-red-800 font-medium flex items-center gap-2 bg-red-100/60 p-2.5 rounded-lg">
                  <span>💡</span>
                  <span>
                    <strong>Resolution applied:</strong> The collision damage estimate below has been calibrated to the <strong>{result.make}</strong> in the photos. Verify vehicle registration before ordering parts.
                  </span>
                </div>
              </div>
            )}

            {/* 2. VERIFIED MATCH BADGE (WHEN VIN & PHOTOS MATCH) */}
            {!result.discrepancy?.hasDiscrepancy && result.vin && result.discrepancy?.severity === 'MATCH' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-emerald-900">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  ✓
                </div>
                <div className="text-xs sm:text-sm space-y-0.5">
                  <p className="font-bold text-emerald-950">
                    {result.discrepancy.title}
                  </p>
                  <p className="text-emerald-800">
                    {result.discrepancy.summary}
                  </p>
                  {result.discrepancy.visualCues && (
                    <p className="text-emerald-700 text-xs italic pt-1">
                      Visual Evidence: {result.discrepancy.visualCues}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 3. PHOTO-ONLY ASSESSMENT BADGE */}
            {!result.vin && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-900">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold">
                  📷
                </div>
                <div className="text-xs sm:text-sm space-y-0.5">
                  <p className="font-bold text-blue-950">
                    Photo-Identified Vehicle: {result.year} {result.make} {result.model}
                  </p>
                  <p className="text-blue-800">
                    Computer vision independently detected this vehicle with {Math.round(result.confidence * 100)}% confidence. Provide a VIN to cross-verify against US NHTSA records.
                  </p>
                </div>
              </div>
            )}

            {/* PROMINENT VEHICLE & ASSESSMENT CARD */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Assessed Vehicle (From Photos)
                    </span>
                    {result.discrepancy?.hasDiscrepancy && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        Photo-Identified
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                    {result.year} {result.make} {result.model}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {result.trim ? `${result.trim} Trim • ` : ''}{result.bodyClass || 'Passenger Vehicle'}
                    {result.color ? ` • ${result.color}` : ''}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col items-start sm:items-end">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {result.vin ? (
                      result.discrepancy?.hasDiscrepancy ? (
                        <span className="text-red-600 flex items-center gap-1 font-bold">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> Mismatched VIN
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-1 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verified NHTSA VIN
                        </span>
                      )
                    ) : (
                      <span className="text-blue-600 font-bold">Photo-Only Analysis</span>
                    )}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-slate-900 mt-0.5 tracking-wider">
                    {result.vin || 'NO VIN PROVIDED'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Report ID</span>
                  <p className="font-mono text-sm font-semibold text-slate-700">{result.id.substring(0, 14)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Overall Severity</span>
                  <p className={`text-sm font-bold ${
                    result.severityOverall === 'SEVERE' ? 'text-red-600' :
                    result.severityOverall === 'MODERATE' ? 'text-amber-600' : 'text-emerald-600'
                  }`}>
                    {result.severityOverall}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Detection Confidence</span>
                  <p className="text-sm font-semibold text-slate-700">{Math.round(result.confidence * 100)}%</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Market Benchmark</span>
                  <p className="text-sm font-semibold text-slate-700">United States (USD)</p>
                </div>
              </div>
            </div>

            {/* US ESTIMATED REPAIR COST CARD */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg">
              <span className="text-xs font-bold tracking-wider uppercase text-blue-400">
                Estimated US Repair Cost ({result.make})
              </span>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black tracking-tight">
                  ${result.costRangeLow.toLocaleString()}
                </span>
                <span className="text-2xl font-light text-slate-400">-</span>
                <span className="text-4xl sm:text-5xl font-black tracking-tight">
                  ${result.costRangeHigh.toLocaleString()}
                </span>
                <span className="text-base font-semibold text-slate-400">USD</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-300 gap-2">
                <span>Standard US body shop collision labor rate ($95/hr) + OEM replacement parts</span>
                {result.vin && (
                  <span className="font-mono text-blue-300">Audited against VIN: {result.vin}</span>
                )}
              </div>
            </div>

            {/* ITEMIZED DAMAGE PARTS LIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Damaged Components Detected ({result.findings.length})
                </h3>
                <span className="text-xs text-slate-500 font-medium">Ranked by severity</span>
              </div>

              <div className="space-y-3">
                {result.findings.map((finding, index) => {
                  let badgeBg = "bg-amber-100 text-amber-800 border-amber-200";
                  let borderLeft = "border-l-amber-500";
                  if (finding.severity === 'SEVERE') {
                    badgeBg = "bg-red-100 text-red-800 border-red-200";
                    borderLeft = "border-l-red-500";
                  } else if (finding.severity === 'LIGHT') {
                    badgeBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                    borderLeft = "border-l-emerald-500";
                  }

                  return (
                    <div
                      key={finding.id}
                      className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200 border-l-4 ${borderLeft} space-y-3`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <h4 className="font-bold text-base text-slate-900">{finding.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                            {finding.severity}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            ${finding.costLow} - ${finding.costHigh}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 pl-10 leading-relaxed">
                        {finding.description}
                      </p>

                      <div className="pl-10 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">OEM Part Number</span>
                        <div className="flex items-center gap-2">
                          {finding.oemNumber ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200">
                                {finding.oemNumber}
                              </span>
                              <span className="text-emerald-600 text-xs font-semibold">✓ OEM</span>
                            </div>
                          ) : (
                            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              PENDING VERIFICATION
                            </span>
                          )}
                          {finding.oemNote && (
                            <span className="text-xs text-slate-400 italic">
                              ({finding.oemNote})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {result.findings.length === 0 && (
                  <div className="bg-white rounded-xl p-8 text-center border border-slate-200 text-slate-500 text-sm">
                    No exterior collision damage detected in the provided photos.
                  </div>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-1/2 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print / Save PDF Report
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('upload');
                  setFiles([]);
                  setPreviewUrls([]);
                  setResult(null);
                }}
                className="w-full sm:w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Another Estimate
              </button>
            </div>
          </div>
        )}

        <div className="h-8"></div>
      </div>
    </main>
  );
}
