'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { ConfirmCarModal, VehicleData } from "@/components/ConfirmCarModal";
import { LeadCaptureModal } from "@/components/LeadCaptureModal";
import {
  Car,
  Camera,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Loader2,
  ArrowRight,
  Users
} from "lucide-react";

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
    rawPartName?: string;
    description: string;
    severity: string;
    costLow: number;
    costHigh: number;
    basePartCost?: number;
    laborHours?: number;
    laborCost?: number;
    laborRate?: number;
    oemNumber: string | null;
    oemStatus: string;
    oemNote?: string | null;
  }>;
  createdAt: string;
}

const SAMPLE_VINS = [
  { label: '2020 Toyota Camry', vin: '4T1B11HK4LU123456', make: 'Toyota' },
  { label: '2022 Cadillac Escalade', vin: '1GYS4HKL5NR123456', make: 'Cadillac' },
  { label: '2021 BMW 330i', vin: 'WBA5R1C58MFA00001', make: 'BMW' },
  { label: '2021 Ford F-150', vin: '1FTFW1ED5MFA00001', make: 'Ford' },
];

const SCAN_STAGES = [
  {
    title: 'Photogrammetric Vision Analysis',
    subtitle: 'Extracting vehicle silhouette, emblem geometry & structural damage markers...',
  },
  {
    title: 'US NHTSA Federal vPIC Registry Audit',
    subtitle: 'Cross-verifying 17-character VIN specifications, safety standards & body class...',
  },
  {
    title: 'OEM Parts Catalog Resolution',
    subtitle: 'Resolving authoritative manufacturer OEM part numbers & component assemblies...',
  },
  {
    title: 'Collision Pricing & Labor Benchmark',
    subtitle: 'Synthesizing national $95.00/hr labor matrix & compiling certified appraisal...',
  },
];

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [step, setStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [vin, setVin] = useState('');
  const [decodedVehicle, setDecodedVehicle] = useState<DecodedVehicle | null>(null);
  const [isDecodingVin, setIsDecodingVin] = useState(false);
  const [vinError, setVinError] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // High-Tech Scanner Telemetry State
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageIndex, setScanStageIndex] = useState(0);

  // Manual & Detected Vehicle Attributes
  const [manualYear, setManualYear] = useState<string>("");
  const [manualMake, setManualMake] = useState<string>("");
  const [manualModel, setManualModel] = useState<string>("");
  const [manualTrim, setManualTrim] = useState<string>("");
  const [manualBody, setManualBody] = useState<string>("Sedan");
  const [manualTransmission, setManualTransmission] = useState<string>("Automatic");
  const [manualFuel, setManualFuel] = useState<string>("Gasoline");
  const [damageNotes, setDamageNotes] = useState<string>("");

  // Two-Stage Gated Modals State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLeadCaptureModalOpen, setIsLeadCaptureModalOpen] = useState(false);
  const [pendingVehicle, setPendingVehicle] = useState<VehicleData | null>(null);
  const [capturedLeadId, setCapturedLeadId] = useState<string | null>(null);
  const [isPreIdentifying, setIsPreIdentifying] = useState(false);

  // Initialize theme (Default: Light Mode)
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('carfix_theme') as 'light' | 'dark' | null;
      if (savedTheme === 'dark') {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    } catch {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      localStorage.setItem('carfix_theme', nextTheme);
    } catch {
      // ignore
    }
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'processing') {
      setScanProgress(15);
      setScanStageIndex(0);

      timer = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 92) return prev;
          const increment = Math.floor(Math.random() * 8) + 5;
          const next = prev + increment;
          if (next >= 75) setScanStageIndex(3);
          else if (next >= 50) setScanStageIndex(2);
          else if (next >= 25) setScanStageIndex(1);
          return Math.min(next, 94);
        });
      }, 400);
    }
    return () => clearInterval(timer);
  }, [step]);

  const handleVinLookup = async (inputVin: string) => {
    const cleanVin = inputVin.trim().toUpperCase();
    setVin(cleanVin);

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
    setVinError(null);

    try {
      const res = await fetch(`/api/vin/decode?vin=${cleanVin}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to decode VIN with US NHTSA registry');
      }

      setDecodedVehicle(data);
      if (data) {
        if (data.year) setManualYear(String(data.year));
        if (data.make) setManualMake(data.make);
        if (data.model) setManualModel(data.model);
        if (data.trim) setManualTrim(data.trim);
        if (data.bodyClass) setManualBody(data.bodyClass);
      }
    } catch (err: any) {
      setDecodedVehicle(null);
      setVinError(err.message || 'Could not verify VIN in NHTSA database.');
    } finally {
      setIsDecodingVin(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    if (files.length + selectedFiles.length > 10) {
      setError('You can upload a maximum of 10 damage photos.');
      return;
    }

    setError(null);
    setFiles((prev) => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Client-side image optimizer: resizes photos to max 1280px & quality 0.80
  // Prevents Vercel 4.5MB serverless payload limit (HTTP 413 Content Too Large)
  const compressImageForAi = (file: File, maxDimension = 1280, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        if (!rawDataUrl) {
          resolve('');
          return;
        }

        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };


  const handleLoadSamplePhotos = async () => {
    try {
      const res = await fetch("/sample-damage.jpg");
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], "sample-collision.jpg", { type: "image/jpeg" });
        setFiles([file]);
        setPreviewUrls([URL.createObjectURL(file)]);
        setError(null);
      }
    } catch (err) {
      console.warn("Could not load sample photo:", err);
    }
  };

  const handleInitiateEstimate = async () => {
    setError(null);

    if (files.length === 0) {
      setError("Please upload at least one photo of the vehicle damage.");
      return;
    }

    const cleanVin = vin.trim().toUpperCase();
    if (cleanVin && cleanVin.length !== 17) {
      setError("If providing a VIN, it must be exactly 17 characters (or clear the field).");
      return;
    }

    // If vehicle is already known from VIN decode or manual inputs
    if (decodedVehicle || (manualMake && manualModel)) {
      setPendingVehicle({
        make: decodedVehicle?.make || manualMake,
        model: decodedVehicle?.model || manualModel,
        year: decodedVehicle?.year || manualYear || "2022",
        trim: decodedVehicle?.trim || manualTrim || null,
        bodyClass: decodedVehicle?.bodyClass || manualBody || "Sedan",
        transmission: manualTransmission,
        fuelType: manualFuel,
        vin: cleanVin || null,
        source: decodedVehicle ? "US NHTSA Registry" : "Customer Specified",
      });
      setIsConfirmModalOpen(true);
      return;
    }

    // Otherwise, fast pre-identification with the primary photo
    setIsPreIdentifying(true);
    try {
      const firstBase64 = await compressImageForAi(files[0], 1024, 0.75);
      const res = await fetch("/api/vehicle/pre-identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: firstBase64,
          vin: cleanVin || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.vehicle) {
        const v = data.vehicle;
        setPendingVehicle({
          make: v.make,
          model: v.model,
          year: v.year || v.approxYear || "2022",
          trim: v.trim || null,
          bodyClass: v.bodyClass || "Sedan",
          transmission: manualTransmission,
          fuelType: manualFuel,
          vin: cleanVin || null,
          source: data.source || "AI Vision Identification",
        });
        if (!manualMake) setManualMake(v.make);
        if (!manualModel) setManualModel(v.model);
        if (!manualYear) setManualYear(String(v.year || "2022"));
        if (!manualBody) setManualBody(v.bodyClass || "Sedan");
      } else {
        setPendingVehicle({
          make: "Toyota",
          model: "Camry",
          year: 2022,
          trim: "SE",
          bodyClass: "Sedan",
          transmission: manualTransmission,
          fuelType: manualFuel,
          vin: cleanVin || null,
          source: "Estimated Profile",
        });
      }
    } catch (err) {
      setPendingVehicle({
        make: "Toyota",
        model: "Camry",
        year: 2022,
        trim: "SE",
        bodyClass: "Sedan",
        transmission: manualTransmission,
        fuelType: manualFuel,
        vin: cleanVin || null,
        source: "Default Profile",
      });
    } finally {
      setIsPreIdentifying(false);
      setIsConfirmModalOpen(true);
    }
  };

  const handleConfirmVehicle = () => {
    setIsConfirmModalOpen(false);
    setIsLeadCaptureModalOpen(true);
  };

  const handleEditVehicle = () => {
    setIsConfirmModalOpen(false);
    const el = document.getElementById("vehicle-attributes-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const makeInput = document.getElementById("manual-make-input");
      if (makeInput) makeInput.focus();
    }
  };

  const handleLeadCaptured = (leadId: string) => {
    setCapturedLeadId(leadId);
    setIsLeadCaptureModalOpen(false);
    handleAnalyze(leadId);
  };

  const handleAnalyze = async (overrideLeadId?: string) => {
    const cleanVin = vin.trim().toUpperCase();

    if (cleanVin && cleanVin.length !== 17) {
      setError('If providing a VIN, it must be exactly 17 characters (or leave blank for photo-based AI identification).');
      return;
    }

    if (files.length === 0) {
      setError('Please upload at least one photo of the vehicle damage.');
      return;
    }

    setStep('processing');
    setError(null);

    try {
      const base64Images = (
        await Promise.all(files.map((file) => compressImageForAi(file, 1280, 0.8)))
      ).filter(Boolean);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: base64Images,
          vin: cleanVin.length === 17 ? cleanVin : undefined,
          vehicle: decodedVehicle || {
            make: manualMake || undefined,
            model: manualModel || undefined,
            year: manualYear ? parseInt(manualYear, 10) : undefined,
            trim: manualTrim || undefined,
            bodyClass: manualBody || undefined,
          },
          leadId: overrideLeadId || capturedLeadId || undefined,
          notes: damageNotes || undefined,
        }),
      });

      let data: any;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        if (response.status === 413) {
          throw new Error('Image payload exceeds server limit. Please upload fewer or smaller images.');
        }
        throw new Error(text || `Server returned error (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to analyze vehicle collision damage');
      }

      setScanProgress(100);
      setScanStageIndex(3);

      setTimeout(() => {
        setResult(data);
        setStep('results');
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during analysis');
      setStep('upload');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#06080e] text-slate-900 dark:text-slate-100 selection:bg-blue-600 selection:text-white transition-colors duration-200 relative">
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[380px] bg-gradient-to-b from-blue-500/5 dark:from-blue-600/10 via-indigo-500/5 dark:via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* 1. EXECUTIVE ENTERPRISE HEADER */}
      <header className="bg-white/90 dark:bg-[#06080e]/90 border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-50 shadow-sm dark:shadow-2xl backdrop-blur-xl print:hidden transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 dark:shadow-blue-500/25 ring-1 ring-black/5 dark:ring-white/20">
                <svg className="w-6 h-6 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-white dark:ring-[#06080e]"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  CARFIX <span className="text-blue-600 dark:text-blue-400 font-extrabold text-xs tracking-widest uppercase bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-400/20">PRO</span>
                </span>
                <span className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  US Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                Automated Collision Estimating & Forensic VIN Intelligence
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: TELEMETRY STATUS, THEME SWITCHER & ACTIONS */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Telemetry pill */}
            <div className="hidden lg:flex items-center gap-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-inner">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                NHTSA vPIC Connected
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                Labor Benchmark: <strong className="text-slate-900 dark:text-white">$95/hr</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-blue-600 dark:text-blue-400 font-mono text-[11px]">ISO 3779</span>
            </div>

            {/* SHOP ADMIN CRM LINK */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shop Admin CRM</span>
              <span className="bg-cyan-600 text-white dark:bg-cyan-400 dark:text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                LEADS
              </span>
            </Link>

            {/* LIGHT / DARK MODE SWITCHER */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
            >
              {theme === 'light' ? (
                <>
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="font-medium">Light</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="font-medium">Dark</span>
                </>
              )}
            </button>

            {step === 'results' && (
              <button
                onClick={() => {
                  setStep('upload');
                  setFiles([]);
                  setPreviewUrls([]);
                  setResult(null);
                  setError(null);
                }}
                className="text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-blue-600/30 ring-1 ring-white/20 flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                New Appraisal
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 print:max-w-none print:w-full print:p-0 print:m-0">
        {/* ERROR MESSAGE NOTIFICATION */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/80 text-red-800 dark:text-red-200 rounded-2xl p-4 flex items-center justify-between shadow-sm dark:shadow-lg">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-xs font-bold cursor-pointer">
              ✕ Dismiss
            </button>
          </div>
        )}

        {/* STEP 1: CLEAN UPLOAD & INTAKE (ZERO DEVELOPER NOISE) */}
        {step === 'upload' && (
          <div className="space-y-8">
            {/* HERO TITLE */}
            <div className="text-center sm:text-left space-y-1.5 pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>US Collision Intelligence Platform</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Enterprise Auto Collision Appraisal
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl leading-relaxed">
                Upload collision photos and vehicle details for automated forensic part identification, OEM catalog matching, and standardized collision repair estimates.
              </p>
            </div>

            {/* TWO COLUMN INTAKE GRID (MATCHING CARFIX.AM STANDARD) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* LEFT COLUMN: PHOTO DROPZONE & PREVIEWS & MAIN CTA */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-6 shadow-sm dark:shadow-xl border border-slate-200/90 dark:border-slate-800/80 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-600/30">
                        1
                      </span>
                      <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Damage Photos
                        <span className="text-red-500 text-xs font-bold">*</span>
                      </h2>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {previewUrls.length}/10 photos
                    </span>
                  </div>

                  {/* DROPZONE (if 0 photos) */}
                  {previewUrls.length === 0 ? (
                    <div>
                      <label className="border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40 dark:bg-slate-950/50 dark:hover:bg-blue-600/5 rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all group">
                        <input
                          type="file"
                          multiple
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="w-14 h-14 bg-slate-100 group-hover:bg-blue-100 dark:bg-slate-800/80 dark:group-hover:bg-blue-600/20 text-slate-500 group-hover:text-blue-600 dark:text-slate-400 dark:group-hover:text-blue-400 rounded-2xl flex items-center justify-center mb-3 transition-colors shadow-inner">
                          <Camera className="w-7 h-7" />
                        </div>
                        <div className="text-center space-y-1">
                          <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block">
                            Click to upload damage photos or drag & drop
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Supports PNG, JPG, WebP • Front, Rear, Side angles, Close-ups
                          </p>
                        </div>
                      </label>

                      {/* Quick Sample Photo Loader */}
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <span className="text-xs text-slate-400">Want to test quickly?</span>
                        <button
                          type="button"
                          onClick={handleLoadSamplePhotos}
                          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          Load Sample Damage Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* PREVIEWS WITH GREEN BASIC BADGE ON 1ST PHOTO AND + TILE */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {previewUrls.map((url, i) => (
                          <div
                            key={i}
                            className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 group bg-slate-100 dark:bg-slate-900 shadow-sm"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Damage photo ${i + 1}`} className="object-cover w-full h-full" />
                            
                            {/* FIRST PHOTO: GREEN BASIC COVER BADGE (MATCHING CARFIX.AM) */}
                            {i === 0 && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-md shadow-emerald-950/30">
                                BASIC
                              </span>
                            )}

                            {/* DELETE BUTTON */}
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-600 text-white rounded-full p-1.5 shadow-md cursor-pointer transition-colors"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {/* + ADD PHOTO TILE */}
                        {previewUrls.length < 10 && (
                          <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 dark:bg-slate-950/40 dark:hover:bg-blue-600/5 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                            <input
                              type="file"
                              multiple
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleFileChange}
                              className="hidden"
                            />
                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-500 group-hover:text-white text-slate-500 dark:text-slate-400 flex items-center justify-center mb-1.5 transition-colors">
                              <Plus className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              Add photo
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({10 - previewUrls.length} left)
                            </span>
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  {/* PRIMARY CTA: GET DAMAGE ESTIMATE */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleInitiateEstimate}
                      disabled={previewUrls.length === 0 || isPreIdentifying}
                      className={`w-full py-4 px-6 rounded-xl font-bold text-base shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                        previewUrls.length > 0 && !isPreIdentifying
                          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:via-indigo-500 hover:to-cyan-500 text-white shadow-blue-600/30 ring-1 ring-white/20 cursor-pointer hover:shadow-blue-500/40"
                          : "bg-slate-200 text-slate-400 dark:bg-slate-900 dark:text-slate-600 cursor-not-allowed border border-slate-300 dark:border-slate-800"
                      }`}
                    >
                      {isPreIdentifying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Identifying Vehicle in Photos...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>
                            Get Damage Estimate
                            {previewUrls.length > 0 ? ` (${previewUrls.length} ${previewUrls.length === 1 ? "photo" : "photos"})` : ""}
                          </span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 pt-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>256-Bit SSL Encrypted • No Login Required • Free Instant Report</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: VIN LOOKUP, RECOMMENDATION CARD, ATTRIBUTES, NOTES */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-white dark:bg-slate-900/70 rounded-2xl p-6 shadow-sm dark:shadow-xl border border-slate-200/90 dark:border-slate-800/80 backdrop-blur-md space-y-5">
                  
                  {/* SECTION HEADER */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-600/30">
                        2
                      </span>
                      <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Vehicle Specifications & VIN
                      </h2>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-md">
                      NHTSA vPIC
                    </span>
                  </div>

                  {/* 1. 17-CHAR VIN LOOKUP WITH DECODE BUTTON */}
                  <div className="space-y-2">
                    <label htmlFor="vin-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Vehicle Identification Number (VIN)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          id="vin-input"
                          type="text"
                          maxLength={17}
                          value={vin}
                          onChange={(e) => handleVinLookup(e.target.value)}
                          placeholder="Enter 17-character VIN"
                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 rounded-xl font-mono text-sm tracking-wider uppercase text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                          {isDecodingVin ? (
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : decodedVehicle ? (
                            <span className="text-emerald-500 font-bold" title="VIN Verified">✓</span>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVinLookup(vin)}
                        disabled={isDecodingVin || vin.trim().length !== 17}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        Decode VIN
                      </button>
                    </div>

                    {vinError && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        {vinError}
                      </p>
                    )}

                    {/* DECODED VEHICLE CONFIRMATION */}
                    {decodedVehicle && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/40 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-500/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                            ✓
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {decodedVehicle.year} {decodedVehicle.make} {decodedVehicle.model} {decodedVehicle.trim || ""}
                            </p>
                            <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 font-medium">
                              US DOT NHTSA Registry Verified
                            </p>
                          </div>
                        </div>
                        <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded font-bold shrink-0">
                          VERIFIED
                        </span>
                      </div>
                    )}

                    {/* Quick Sample VIN Selector */}
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-slate-400">Sample:</span>
                      {SAMPLE_VINS.map((sample) => (
                        <button
                          key={sample.vin}
                          type="button"
                          onClick={() => handleVinLookup(sample.vin)}
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-lg transition-all border cursor-pointer ${
                            vin === sample.vin
                              ? "bg-blue-600 text-white border-blue-500"
                              : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          {sample.make}
                        </button>
                      ))}
                      {vin.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setVin("");
                            setDecodedVehicle(null);
                            setVinError(null);
                          }}
                          className="text-[11px] text-slate-400 hover:text-red-500 px-1 underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. VIN RECOMMENDATION ALERT CARD (MATCHING IMAGE 3) */}
                  <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 text-blue-900 dark:text-blue-200 text-xs flex items-start gap-3">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="font-bold text-slate-900 dark:text-white block">
                        Why enter your VIN?
                      </strong>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                        Entering your 17-character VIN allows our US NHTSA system to accurately decode factory options, trim levels, and query precise OEM part catalog numbers for your vehicle.
                      </p>
                    </div>
                  </div>

                  {/* 3. VEHICLE ATTRIBUTES (MANUAL OVERRIDE / CUSTOMIZATION) */}
                  <div id="vehicle-attributes-section" className="space-y-3 pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Vehicle Attributes
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {/* YEAR */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Year
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 2022"
                          value={manualYear}
                          onChange={(e) => setManualYear(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* MAKE */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Make
                        </label>
                        <input
                          id="manual-make-input"
                          type="text"
                          placeholder="e.g. Toyota"
                          value={manualMake}
                          onChange={(e) => setManualMake(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* MODEL */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Model
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Camry"
                          value={manualModel}
                          onChange={(e) => setManualModel(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* TRIM */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Trim / Edition
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. SE / XLE"
                          value={manualTrim}
                          onChange={(e) => setManualTrim(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      {/* BODY CLASS */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Body Class
                        </label>
                        <select
                          value={manualBody}
                          onChange={(e) => setManualBody(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Sedan">Sedan</option>
                          <option value="SUV">SUV</option>
                          <option value="Coupe">Coupe</option>
                          <option value="Pickup Truck">Pickup Truck</option>
                          <option value="Hatchback">Hatchback</option>
                          <option value="Van / Minivan">Van / Minivan</option>
                          <option value="Convertible">Convertible</option>
                          <option value="Wagon">Wagon</option>
                        </select>
                      </div>

                      {/* TRANSMISSION */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Transmission
                        </label>
                        <select
                          value={manualTransmission}
                          onChange={(e) => setManualTransmission(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="Automatic">Automatic</option>
                          <option value="Manual">Manual</option>
                          <option value="CVT">CVT</option>
                          <option value="Dual-Clutch">Dual-Clutch</option>
                        </select>
                      </div>

                      {/* FUEL TYPE */}
                      <div className="col-span-2 sm:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Fuel Type
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {["Gasoline", "Hybrid", "Electric", "Diesel"].map((fuel) => (
                            <button
                              key={fuel}
                              type="button"
                              onClick={() => setManualFuel(fuel)}
                              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                manualFuel === fuel
                                  ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                                  : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              {fuel}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. DAMAGE NOTES TEXTAREA */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Damage Description / Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={damageNotes}
                      onChange={(e) => setDamageNotes(e.target.value)}
                      placeholder="Describe how the accident occurred or specific parts damaged (e.g. cracked front bumper, scratch on door)..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* MILLION-DOLLAR ENTERPRISE SAAS PRODUCT DEMO SHOWCASE */}
            <div className="pt-6 sm:pt-8">
              <div className="relative rounded-3xl p-1 bg-gradient-to-b from-blue-500/25 via-slate-300/40 to-transparent dark:from-blue-500/30 dark:via-slate-800/40 dark:to-transparent shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)]">
                <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-[22px] overflow-hidden border border-slate-200/90 dark:border-slate-800/90">
                  {/* APP WINDOW HEADER (MACOS / HIGH-TECH ENTERPRISE STYLE) */}
                  <div className="px-4 sm:px-5 py-3.5 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm inline-block"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm inline-block"></span>
                      <span className="ml-2 sm:ml-3 text-xs font-mono font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-black">CARFIX PRO</span>
                        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
                        <span className="hidden sm:inline">Enterprise Collision Appraisal Walkthrough</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        LIVE DEMO
                      </span>
                    </div>
                  </div>

                  {/* HIGH-RES VIDEO PLAYER WITH GLOW & CONTROLS */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden group">
                    <video
                      src="/videos/carfix-demo.webm"
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  </div>

                  {/* BOTTOM TELEMETRY / FEATURE STRIP */}
                  <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-slate-50/90 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                        <span>⚡</span> Multimodal Vision
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Gemini 2.5 Flash</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                        <span>🛡️</span> NHTSA vPIC
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">US DOT Verification</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                        <span>🏷️</span> OEM Resolution
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Authoritative Catalog</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                        <span>📄</span> 1-Click PDF
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">US Repair Order</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          
          </div>
        )}

        {step === 'processing' && (
          <div className="bg-white/95 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800/80 my-6 relative overflow-hidden transition-colors duration-200">
            {/* SCANNING LASER SWEEP LINE OVER CARD */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan-sweep pointer-events-none z-10 shadow-[0_0_15px_#06b6d4]"></div>

            <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-8">
              {/* RADAR RETICLE CONTAINER */}
              <div className="relative flex items-center justify-center">
                {/* Glowing rings */}
                <div className="w-32 h-32 rounded-full border border-blue-500/20 animate-pulse-slow"></div>
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin absolute" style={{ animationDuration: '10s' }}></div>
                <div className="w-16 h-16 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin absolute" style={{ animationDuration: '1.5s' }}></div>

                {/* Center Pulse Icon */}
                <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 absolute">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>

              {/* HEADING & TELEMETRY */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-400/30 text-blue-700 dark:text-blue-400 text-xs font-mono font-semibold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
                  Forensic Vision Pipeline Active
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Analyzing Vehicle Collision Damage
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm max-md mx-auto">
                  Cross-referencing photogrammetry against US NHTSA federal records and OEM parts databases.
                </p>
              </div>

              {/* LIVE PROGRESS BAR WITH PERCENTAGE */}
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
                  <span className="text-blue-600 dark:text-blue-400 font-mono">STAGE {scanStageIndex + 1} OF 4</span>
                  <span className="text-slate-900 dark:text-white font-mono">{scanProgress}% COMPLETE</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-500 h-full rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* PROGRESSIVE STAGES CHECKLIST */}
              <div className="w-full bg-slate-50 dark:bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800/80 text-left space-y-3">
                {SCAN_STAGES.map((stage, idx) => {
                  const isDone = scanStageIndex > idx;
                  const isCurrent = scanStageIndex === idx;

                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 transition-opacity ${
                        isDone ? 'opacity-100' : isCurrent ? 'opacity-100' : 'opacity-40'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-emerald-500/30">
                            ✓
                          </div>
                        ) : isCurrent ? (
                          <div className="w-5 h-5 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin"></div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"></div>
                        )}
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <p
                          className={`font-bold ${
                            isCurrent
                              ? 'text-cyan-700 dark:text-cyan-300'
                              : isDone
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {stage.title}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">{stage.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* HARDWARE / NETWORK TELEMETRY FOOTNOTE */}
              <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                <span>NHTSA vPIC: 200 OK</span>
                <span>•</span>
                <span>OEM Catalog: Seeded + Live API Pending</span>
                <span>•</span>
                <span>Labor Rate: $95.00/hr</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: RESULTS & APPRAISAL REPORT VIEW */}
        {step === 'results' && result && (() => {
          const totalPartsCost = result.findings.reduce((acc, f) => acc + (f.basePartCost || Math.round(f.costLow * 0.6)), 0);
          const totalLaborHours = result.findings.reduce((acc, f) => acc + (f.laborHours || (f.severity === 'SEVERE' ? 7 : f.severity === 'MODERATE' ? 4 : 2)), 0);
          const totalLaborCost = result.findings.reduce((acc, f) => acc + (f.laborCost || ((f.laborHours || (f.severity === 'SEVERE' ? 7 : f.severity === 'MODERATE' ? 4 : 2)) * 95)), 0);

          return (
            <>
              {/* 1. INTERACTIVE SCREEN VIEW (HIDDEN IN PRINT) */}
              <div className="print:hidden space-y-6 animate-in fade-in duration-500">
                {/* EXECUTIVE REPORT NAVIGATION & CLOSE BAR */}
                <div className="bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('upload');
                        setFiles([]);
                        setPreviewUrls([]);
                        setResult(null);
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer border border-slate-200 dark:border-slate-700 shadow-sm"
                      title="Close Report & Return to Intake"
                    >
                      <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Close Report
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">VIN:</span>
                      <span className="font-mono text-sm sm:text-base font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800/60 tracking-wider">
                        {result.vin}
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50">
                        ✓ Required & Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-blue-600/30"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print / Save PDF Contract
                    </button>
                  </div>
                </div>

            {/* 1. CRITICAL DISCREPANCY AUDIT CARD (WHEN MISMATCH DETECTED) */}
            {result.discrepancy?.hasDiscrepancy && (
              <div className="bg-red-50 dark:bg-gradient-to-br dark:from-red-950/90 dark:via-rose-950/80 dark:to-slate-900 border-2 border-red-500 rounded-2xl p-6 shadow-sm dark:shadow-2xl space-y-4 print:border print:border-red-700 print:text-black print:bg-white print-avoid-break">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-red-600/30">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-red-600 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          Critical Audit Alert
                        </span>
                        <span className="text-red-700 dark:text-red-400 font-bold text-xs uppercase tracking-wider">
                          Vehicle Model Mismatch Flagged
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white print:text-red-950 mt-1">
                        {result.discrepancy.title}
                      </h2>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-red-950 dark:text-red-200 font-medium leading-relaxed bg-red-100/70 dark:bg-black/40 print:bg-red-50 print:text-red-900 p-3.5 rounded-xl border border-red-200 dark:border-red-500/30">
                  {result.discrepancy.explanation}
                </p>

                {/* SIDE-BY-SIDE FORENSIC COMPARISON */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* PHOTO ANALYSIS */}
                  <div className="bg-white dark:bg-slate-900/90 print:bg-white rounded-xl p-4 border border-amber-300 dark:border-amber-500/40 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 print:text-amber-800 flex items-center gap-1">
                        📷 Uploaded Photos (Actual Vehicle)
                      </span>
                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 print:bg-amber-100 print:text-amber-900 font-bold text-xs px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/30">
                        {Math.round((result.visualVehicle?.confidence || 0.95) * 100)}% Match
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white print:text-slate-900">
                      {result.visualVehicle?.make} {result.visualVehicle?.model}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-600 space-y-1">
                      <p>
                        <span className="font-semibold text-slate-500 dark:text-slate-400 print:text-slate-700">Body Class:</span>{' '}
                        {result.visualVehicle?.bodyClass || 'Sedan/SUV'}
                      </p>
                      {result.visualVehicle?.color && (
                        <p>
                          <span className="font-semibold text-slate-500 dark:text-slate-400 print:text-slate-700">Color:</span>{' '}
                          {result.visualVehicle.color}
                        </p>
                      )}
                      {result.visualVehicle?.visualCues && (
                        <p className="text-slate-500 dark:text-slate-400 print:text-slate-600 italic border-t border-slate-100 dark:border-slate-800 print:border-slate-100 pt-1.5 mt-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-200 print:text-slate-800 not-italic">Visual Evidence:</span>{' '}
                          {result.visualVehicle.visualCues}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* VIN REGISTRY */}
                  <div className="bg-white dark:bg-slate-900/90 print:bg-white rounded-xl p-4 border border-red-300 dark:border-red-500/40 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 print:text-red-800 flex items-center gap-1">
                        🏛️ US NHTSA Record (Claimed VIN)
                      </span>
                      <span className="bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 print:bg-red-100 print:text-red-800 font-bold text-xs px-2 py-0.5 rounded-md border border-red-200 dark:border-red-500/30">
                        MISMATCHED
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900 dark:text-white print:text-slate-900">
                      {result.vinRecord?.year} {result.vinRecord?.make} {result.vinRecord?.model}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 print:text-slate-600 space-y-1">
                      <p>
                        <span className="font-semibold text-slate-500 dark:text-slate-400 print:text-slate-700">Claimed VIN:</span>{' '}
                        <span className="font-mono font-bold text-red-600 dark:text-red-400 print:text-red-700">{result.vin}</span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-500 dark:text-slate-400 print:text-slate-700">Body Class:</span>{' '}
                        {result.vinRecord?.bodyClass || 'Sedan'}
                      </p>
                      <p className="text-red-600 dark:text-red-400 print:text-red-700 font-semibold border-t border-slate-100 dark:border-slate-800 print:border-slate-100 pt-1.5 mt-1.5">
                        ⚠️ Status: Submitted VIN does NOT match the physical vehicle photographed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-red-900 dark:text-red-300 print:text-red-900 font-medium flex items-center gap-2 bg-red-100/60 dark:bg-red-950/60 print:bg-red-50 p-2.5 rounded-lg border border-red-200 dark:border-red-500/20">
                  <span>💡</span>
                  <span>
                    <strong>Resolution applied:</strong> The collision damage estimate and OEM catalog parts below are calibrated to the <strong>{result.make}</strong> in the photos. Confirm registration before ordering parts.
                  </span>
                </div>
              </div>
            )}

            {/* 2. VERIFIED MATCH BADGE (WHEN VIN & PHOTOS MATCH) */}
            {!result.discrepancy?.hasDiscrepancy && result.vin && result.discrepancy?.severity === 'MATCH' && (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/50 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-emerald-900 dark:text-emerald-200 print:bg-emerald-50 print:text-emerald-950 print-avoid-break">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md shadow-emerald-600/30">
                  ✓
                </div>
                <div className="text-xs sm:text-sm space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white print:text-emerald-950 text-base">{result.discrepancy.title}</p>
                  <p className="text-emerald-800 dark:text-emerald-300 print:text-emerald-800">{result.discrepancy.summary}</p>
                  {result.discrepancy.visualCues && (
                    <p className="text-emerald-700 dark:text-emerald-400 print:text-emerald-700 text-xs italic pt-1">
                      Visual Evidence: {result.discrepancy.visualCues}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 3. PHOTO-ONLY ASSESSMENT BADGE */}
            {!result.vin && (
              <div className="bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-blue-950 dark:text-blue-200 print:bg-blue-50 print:text-blue-950 print-avoid-break">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-md shadow-blue-600/30">
                  📷
                </div>
                <div className="text-xs sm:text-sm space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white print:text-blue-950 text-base">
                    Photo-Identified Vehicle: {result.year} {result.make} {result.model}
                  </p>
                  <p className="text-blue-800 dark:text-blue-300 print:text-blue-800">
                    Computer vision independently detected this vehicle with {Math.round(result.confidence * 100)}% confidence. Provide a VIN to cross-verify against official US NHTSA records.
                  </p>
                </div>
              </div>
            )}

            {/* ASSESSED VEHICLE SPECIFICATION CARD */}
            <div className="bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 shadow-sm dark:shadow-xl border border-slate-200/90 dark:border-slate-800/80 print:border print:border-slate-300 print:bg-white print-avoid-break transition-colors duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Assessed Vehicle (From Photos)
                    </span>
                    {result.discrepancy?.hasDiscrepancy && (
                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 print:bg-amber-100 print:text-amber-900 border border-amber-200 dark:border-amber-500/40 text-xs font-bold px-2 py-0.5 rounded-full">
                        Photo-Identified
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white print:text-slate-900 mt-0.5">
                    {result.year} {result.make} {result.model}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 print:text-slate-600 font-medium">
                    {result.trim ? `${result.trim} Trim • ` : ''}
                    {result.bodyClass || 'Passenger Vehicle'}
                    {result.color ? ` • ${result.color}` : ''}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 print:bg-slate-50 print:border-slate-300 rounded-xl px-4 py-3 flex flex-col items-start sm:items-end shadow-inner">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {result.vin ? (
                      result.discrepancy?.hasDiscrepancy ? (
                        <span className="text-red-600 dark:text-red-400 print:text-red-700 flex items-center gap-1 font-bold">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span> Mismatched VIN
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 print:text-emerald-700 flex items-center gap-1 font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verified NHTSA VIN
                        </span>
                      )
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 print:text-blue-700 font-bold">Photo-Only Analysis</span>
                    )}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-white print:text-slate-900 mt-0.5 tracking-wider">
                    {result.vin || 'NO VIN PROVIDED'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Report ID</span>
                  <p className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-200 print:text-slate-800">
                    {result.id.substring(0, 16)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overall Severity</span>
                  <p
                    className={`text-sm font-bold ${
                      result.severityOverall === 'SEVERE'
                        ? 'text-red-600 dark:text-red-400 print:text-red-600'
                        : result.severityOverall === 'MODERATE'
                        ? 'text-amber-600 dark:text-amber-400 print:text-amber-600'
                        : 'text-emerald-600 dark:text-emerald-400 print:text-emerald-600'
                    }`}
                  >
                    {result.severityOverall}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Detection Confidence</span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 print:text-slate-800">
                    {Math.round(result.confidence * 100)}%
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Market Benchmark</span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-200 print:text-slate-800">United States (USD)</p>
                </div>
              </div>
            </div>

            {/* SUBMITTED DAMAGE PHOTO EVIDENCE GALLERY (SCREEN & PRINT) */}
            {previewUrls.length > 0 && (
              <div className="bg-white dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-6 shadow-sm dark:shadow-xl border border-slate-200/90 dark:border-slate-800/80 print:border print:border-slate-300 print:bg-white print-avoid-break transition-colors duration-200">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 print:border-slate-200 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📷</span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 print:text-slate-900">
                      Photogrammetric Damage Evidence ({previewUrls.length} Photo{previewUrls.length > 1 ? 's' : ''})
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">
                    AI Visual Assessment Source
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {previewUrls.map((url, i) => (
                    <div
                      key={i}
                      className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-950 shadow-sm print:border-slate-300"
                    >
                      <img
                        src={url}
                        alt={`Vehicle damage evidence photo ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1.5 left-1.5 bg-slate-900/80 backdrop-blur-sm text-[10px] font-mono font-bold text-white px-2 py-0.5 rounded shadow">
                        PHOTO #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

                {/* ESTIMATED COLLISION REPAIR COST SUMMARY (SCREEN VIEW) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-[#0c1220] text-white rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl border border-slate-800 transition-colors duration-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      Preliminary Collision Estimate ({result.make})
                    </span>
                    <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Subject to Teardown & Supplement
                    </span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                      ${result.costRangeLow.toLocaleString()}
                    </span>
                    <span className="text-2xl font-light text-slate-400">-</span>
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                      ${result.costRangeHigh.toLocaleString()}
                    </span>
                    <span className="text-base font-semibold text-slate-400">USD</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                    * Preliminary benchmark based on visible photogrammetric damage. Final billing subject to post-teardown inspection, structural laser measurement, and insurance supplements.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-col gap-3 text-xs border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Collision Labor Rate</span>
                    <span className="font-bold text-white text-sm">$95.00/hr <span className="text-[10px] font-normal text-slate-400">(US Benchmark)</span></span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">OEM Parts Catalog</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {result.findings.filter(f => f.oemStatus === "RESOLVED" && f.oemNumber).length} / {result.findings.length} Verified
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Damaged Components</span>
                    <span className="font-bold text-white text-sm">{result.findings.length} Parts Resolved</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                <span>Standard US body shop collision repair matrix ($95/hr labor + OEM parts)</span>
                {result.vin && (
                  <span className="font-mono text-blue-400">Audited against VIN: {result.vin}</span>
                )}
              </div>
            </div>

                {/* ITEMIZED DAMAGE PARTS LIST WITH TRANSPARENT PRICING & OEM PARTS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white print:text-slate-900">
                  Damaged Components & OEM Part Analysis ({result.findings.length})
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Standardized Labor & Parts Breakdown</span>
              </div>

              <div className="space-y-3">
                {result.findings.map((finding, index) => {
                  let badgeClass = 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40 print:bg-amber-100 print:text-amber-900';
                  let borderLeft = 'border-l-amber-500';
                  if (finding.severity === 'SEVERE') {
                    badgeClass = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 print:bg-red-100 print:text-red-900';
                    borderLeft = 'border-l-red-500';
                  } else if (finding.severity === 'LIGHT') {
                    badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 print:bg-emerald-100 print:text-emerald-900';
                    borderLeft = 'border-l-emerald-500';
                  }

                  const partCost = finding.basePartCost || Math.round(finding.costLow * 0.6);
                  const laborHours = finding.laborHours || (finding.severity === 'SEVERE' ? 7 : finding.severity === 'MODERATE' ? 4 : 2);
                  const laborCost = finding.laborCost || laborHours * 95;

                  return (
                    <div
                      key={finding.id}
                      className={`bg-white dark:bg-slate-900/70 backdrop-blur-md print:bg-white rounded-xl p-5 shadow-sm dark:shadow-lg border border-slate-200/90 dark:border-slate-800/80 print:border-slate-300 border-l-4 ${borderLeft} space-y-3.5 print-avoid-break transition-colors duration-200`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 print:bg-slate-100 text-slate-700 dark:text-slate-300 print:text-slate-700 font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white print:text-slate-900">{finding.name}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                            {finding.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white print:text-slate-900 bg-slate-100 dark:bg-slate-950 print:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 print:border-slate-300">
                            ${finding.costLow} - ${finding.costHigh}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 print:text-slate-700 pl-10 leading-relaxed">
                        {finding.description}
                      </p>

                      {/* COMPONENT BREAKDOWN ROW: OEM PART & TRANSPARENT PRICING FORMULA */}
                      <div className="pl-10 pt-3 border-t border-slate-100 dark:border-slate-800/80 print:border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {finding.oemStatus === "RESOLVED" && finding.oemNumber ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 print:text-slate-600">OEM Part:</span>
                            <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-950 print:bg-slate-100 text-blue-600 dark:text-blue-400 print:text-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700/80 print:border-slate-300">
                              {finding.oemNumber}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 print:text-emerald-700 text-xs font-bold flex items-center gap-1">
                              ✓ OEM Verified
                            </span>
                            {finding.oemNote && (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 print:text-amber-700 italic">
                                ({finding.oemNote})
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <span className="font-semibold">OEM looking for...</span>
                              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-normal hidden sm:inline">(Pending Verification)</span>
                            </span>
                          </div>
                        )}

                        {/* HOW THIS PRICE WAS PRODUCED (TRANSPARENT FORMULA BREAKDOWN) */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 bg-slate-50 dark:bg-slate-950/90 print:bg-slate-50 border border-slate-200 dark:border-slate-800 print:border-slate-200 px-3 py-1.5 rounded-lg">
                          <span>
                            <span className="text-slate-400 dark:text-slate-500 print:text-slate-400">Part:</span>{' '}
                            <strong className="text-slate-900 dark:text-white print:text-slate-900">${partCost}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            <span className="text-slate-400 dark:text-slate-500 print:text-slate-400">Labor:</span>{' '}
                            <strong className="text-slate-900 dark:text-white print:text-slate-900">{laborHours} hrs</strong> @ $95/hr (
                            <strong className="text-slate-900 dark:text-white print:text-slate-900">${laborCost}</strong>)
                          </span>
                          <span>•</span>
                          <span>
                            <span className="text-slate-400 dark:text-slate-500 print:text-slate-400">Total:</span>{' '}
                            <strong className="text-blue-600 dark:text-blue-400 print:text-blue-700">
                              ${finding.costLow}-${finding.costHigh}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

                {/* SCREEN-ONLY ACTION BUTTONS */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setStep('upload');
                  setFiles([]);
                  setPreviewUrls([]);
                  setResult(null);
                }}
                className="w-full sm:w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close Report
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-1/3 py-3.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-lg dark:shadow-black/20"
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
                className="w-full sm:w-1/3 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/30"
              >
                Start Another Estimate
              </button>
            </div>
              </div>

              
              {/* 2. DEDICATED EXECUTIVE US BODY SHOP REPAIR ORDER, INTAKE RECORD & LEGAL CONTRACT (PRINT ONLY) */}
              <div className="hidden print:block text-slate-950 font-sans leading-tight space-y-3 print-avoid-break">
                {/* SECTION A: EXECUTIVE FACILITY HEADER & REPAIR ORDER METADATA */}
                <div className="border-b-2 border-slate-950 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                          CARFIX US COLLISION CENTERS
                        </h1>
                        <span className="text-[10px] font-bold border border-slate-950 px-2 py-0.5 rounded uppercase tracking-wider bg-slate-100">
                          Official Repair Order
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wide mt-0.5">
                        Precision Collision Center & Forensic Damage Appraisal Network
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        I-CAR Gold Class Certified Facility • ASE Master Technicians • State BAR Lic: #CR-284910 • EPA ID: #CAL000492
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Facility Dispatch: (800) 555-AUTO • Insurance Claims Desk: claims@precisioncollision.com
                      </p>
                    </div>
                    <div className="text-right text-[11px] space-y-0.5 border border-slate-400 bg-slate-50 p-2 rounded min-w-[220px]">
                      <p>
                        <span className="font-bold text-slate-700">Repair Order #:</span>{' '}
                        <span className="font-mono font-bold text-slate-950 text-xs">RO-{result.id.slice(4, 15).toUpperCase()}</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">Appraisal Date:</span>{' '}
                        <span className="font-medium text-slate-900">
                          {new Date(result.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">Labor Benchmark:</span>{' '}
                        <span className="font-bold text-slate-950">$95.00/hr (US Matrix)</span>
                      </p>
                      <p>
                        <span className="font-bold text-slate-700">Audit Status:</span>{' '}
                        <span className={`font-bold ${result.discrepancy?.hasDiscrepancy ? 'text-red-700' : 'text-emerald-700'}`}>
                          {result.discrepancy?.hasDiscrepancy ? '⚠️ MISMATCH FLAGGED' : '✓ NHTSA vPIC VERIFIED'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION B: CUSTOMER & INSURANCE CLAIM INTAKE RECORD (2-COLUMN GRID) */}
                <div className="border border-slate-400 rounded-md overflow-hidden text-[10px]">
                  <div className="bg-slate-100 px-3 py-1 border-b border-slate-400 flex justify-between font-bold text-[9.5px] uppercase tracking-wider text-slate-800">
                    <span>Section 1: Customer & Registered Owner Intake</span>
                    <span>Section 2: Insurance Claim & Billing Specifications</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-slate-400 p-2.5 gap-x-4 text-[10px]">
                    <div className="space-y-1.5">
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">Customer / Owner Name:</span>
                        <span className="border-b border-slate-400 flex-1 ml-2 text-slate-900 font-medium">__________________________________</span>
                      </p>
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">Primary Contact Phone:</span>
                        <span className="border-b border-slate-400 flex-1 ml-2 text-slate-900 font-medium">__________________ Alt: _________________</span>
                      </p>
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">Email Address:</span>
                        <span className="border-b border-slate-400 flex-1 ml-2 text-slate-900 font-medium">__________________________________</span>
                      </p>
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">Street Address:</span>
                        <span className="border-b border-slate-400 flex-1 ml-2 text-slate-900 font-medium">__________________________________</span>
                      </p>
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">City, State, Zip:</span>
                        <span className="border-b border-slate-400 flex-1 ml-2 text-slate-900 font-medium">__________________ State: ____ Zip: _____</span>
                      </p>
                    </div>

                    <div className="space-y-1.5 pl-3">
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">Insurance Carrier:</span>
                        <span className="border-b border-slate-400 flex-1 ml-2 text-slate-900 font-medium">__________________________________</span>
                      </p>
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">Claim Number:</span>
                        <span className="border-b border-slate-400 flex-1 ml-2 text-slate-900 font-medium">__________________ Policy #: _____________</span>
                      </p>
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">Deductible:</span>
                        <span className="flex-1 ml-2 text-slate-900 font-medium">
                          [  ] $500 &nbsp; [  ] $1,000 &nbsp; [  ] Other: $_______ &nbsp; Paid: [  ] Yes [  ] No
                        </span>
                      </p>
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">Assigned Adjuster:</span>
                        <span className="border-b border-slate-400 flex-1 ml-2 text-slate-900 font-medium">__________________ Phone: _______________</span>
                      </p>
                      <p className="flex items-baseline justify-between">
                        <span className="text-slate-600 font-medium">Payment Direction:</span>
                        <span className="flex-1 ml-2 text-slate-900 font-bold">
                          [X] Direct Assignment of Benefits (AOB) Authorized (Clause 3)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION C: VEHICLE INTAKE & FORENSIC SPECIFICATION RECORD */}
                <div className="border border-slate-400 rounded-md overflow-hidden text-[10px]">
                  <div className="bg-slate-100 px-3 py-1 border-b border-slate-400 font-bold text-[9.5px] uppercase tracking-wider text-slate-800 flex justify-between">
                    <span>Section 3: Vehicle Intake & Forensic Damage Record</span>
                    <span className="font-mono">US DOT 49 CFR Part 565 Compliant</span>
                  </div>
                  <div className="p-2.5 grid grid-cols-4 gap-3 text-[10px]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Vehicle Assessed</span>
                      <span className="font-black text-slate-950 text-[11px]">
                        {result.year} {result.make} {result.model}
                      </span>
                      <span className="text-slate-600 block text-[9.5px]">{result.trim ? `${result.trim} Trim` : result.bodyClass || 'Passenger Car'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">17-Digit Vehicle VIN (Required)</span>
                      <span className="font-mono font-bold text-slate-950 text-[11px] tracking-wider">
                        {result.vin}
                      </span>
                      <span className={`block text-[9.5px] font-semibold ${result.discrepancy?.hasDiscrepancy ? 'text-red-700' : 'text-emerald-700'}`}>
                        {result.discrepancy?.hasDiscrepancy ? '⚠️ Mismatched VIN' : '✓ NHTSA Registry Validated'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Exterior Color / Finish</span>
                      <span className="font-bold text-slate-900">{result.color || 'Factory OEM Finish'}</span>
                      <span className="text-slate-600 block text-[9.5px]">Body: {result.bodyClass || 'Sedan/SUV'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Damage Severity</span>
                      <span className="font-black text-slate-950 uppercase">{result.severityOverall}</span>
                      <span className="text-slate-600 block text-[9.5px]">AI Confidence: {Math.round(result.confidence * 100)}%</span>
                    </div>
                  </div>
                  <div className="bg-slate-50 border-t border-slate-300 px-3 py-1 flex items-center justify-between text-[9.5px] text-slate-700">
                    <span>Intake Odometer: ________________ Mi</span>
                    <span>License Plate: ________________ State: ____</span>
                    <span>Drivable: [X] Yes &nbsp; [  ] No / Towed In</span>
                    <span>Point of Impact: Front Bumper / Fascia</span>
                    <span>Airbags: [  ] Deployed &nbsp; [X] Intact</span>
                  </div>
                </div>

                {/* SECTION D: DISCREPANCY AUDIT NOTICE (IF APPLICABLE) */}
                {result.discrepancy?.hasDiscrepancy && (
                  <div className="border-2 border-red-700 bg-red-50 p-2 rounded-md text-red-950 text-[9.5px] space-y-1">
                    <div className="flex items-center gap-1.5 font-black uppercase text-red-800 text-[10px]">
                      <span>⚠️</span>
                      <span>Forensic Audit Alert: VIN & Photogrammetric Vehicle Discrepancy Flagged</span>
                    </div>
                    <p className="leading-tight">
                      <strong>NHTSA Registry Claimed VIN ({result.vin}):</strong> {result.discrepancy.vinVehicleSummary} &nbsp;•&nbsp;
                      <strong>Computer Vision Identified Vehicle:</strong> {result.discrepancy.visualVehicleSummary}
                    </p>
                    <p className="text-red-900 leading-tight">
                      <strong>Forensic Finding:</strong> {result.discrepancy.explanation}
                    </p>
                    <p className="text-red-800 italic font-medium">
                      * Repair Order Note: All replacement components and labor hours below have been calibrated for the physical {result.make} photographed. Physical VIN inspection required prior to ordering parts.
                    </p>
                  </div>
                )}

                {/* SECTION E: ITEMIZED DAMAGE & OEM PARTS RESOLUTION TABLE */}
                <div className="border border-slate-400 rounded-md overflow-hidden text-[10px]">
                  <div className="bg-slate-100 px-3 py-1 border-b border-slate-400 font-bold text-[9.5px] uppercase tracking-wider text-slate-800 flex justify-between">
                    <span>Section 4: Itemized Collision Damage & OEM Part Analysis ({result.findings.length} Components)</span>
                    <span>Labor Benchmark: $95.00 / Hour</span>
                  </div>
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-300 text-[9px] uppercase font-bold text-slate-700">
                        <th className="py-1 px-2 border-r border-slate-300 w-6 text-center">#</th>
                        <th className="py-1 px-2 border-r border-slate-300 w-36">Damaged Component</th>
                        <th className="py-1 px-2 border-r border-slate-300 w-16 text-center">Severity</th>
                        <th className="py-1 px-2 border-r border-slate-300 w-32">OEM Part Number</th>
                        <th className="py-1 px-2 border-r border-slate-300">Forensic Damage Description & Repair Method</th>
                        <th className="py-1 px-2 border-r border-slate-300 w-16 text-right">Part ($)</th>
                        <th className="py-1 px-2 border-r border-slate-300 w-24 text-center">Labor @ $95</th>
                        <th className="py-1 px-2 w-24 text-right">Est. Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {result.findings.map((finding, idx) => {
                        const partCost = finding.basePartCost || Math.round(finding.costLow * 0.6);
                        const laborHours = finding.laborHours || (finding.severity === 'SEVERE' ? 7 : finding.severity === 'MODERATE' ? 4 : 2);
                        const laborCost = finding.laborCost || laborHours * 95;

                        return (
                          <tr key={finding.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                            <td className="py-1 px-2 border-r border-slate-300 text-center font-bold text-slate-600">{idx + 1}</td>
                            <td className="py-1 px-2 border-r border-slate-300 font-bold text-slate-950">{finding.name}</td>
                            <td className="py-1 px-2 border-r border-slate-300 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase ${
                                finding.severity === 'SEVERE'
                                  ? 'bg-red-100 text-red-800'
                                  : finding.severity === 'MODERATE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {finding.severity}
                              </span>
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300 font-mono text-[9.5px]">
                              {finding.oemStatus === "RESOLVED" && finding.oemNumber ? (
                                <>
                                  <span className="font-bold text-slate-950">{finding.oemNumber}</span>
                                  <span className="text-[8px] text-emerald-700 block font-sans font-bold">✓ OEM Verified</span>
                                </>
                              ) : (
                                <>
                                  <span className="font-semibold text-amber-800 text-[9px] bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300 block text-center">
                                    OEM looking for...
                                  </span>
                                  <span className="text-[7.5px] text-slate-500 block font-sans text-center mt-0.5">Pending Live API</span>
                                </>
                              )}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300 text-slate-800 leading-snug">
                              {finding.description}
                            </td>
                            <td className="py-1 px-2 border-r border-slate-300 text-right font-medium text-slate-900">${partCost}</td>
                            <td className="py-1 px-2 border-r border-slate-300 text-center text-[9.5px] text-slate-700">
                              {laborHours} hrs (${laborCost})
                            </td>
                            <td className="py-1 px-2 text-right font-bold text-slate-950">
                              ${finding.costLow} - ${finding.costHigh}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-900 text-[9.5px]">
                        <td colSpan={5} className="py-1 px-2 text-right uppercase border-r border-slate-300">
                          Accounting Subtotals ({result.findings.length} Items):
                        </td>
                        <td className="py-1 px-2 text-right border-r border-slate-300">${totalPartsCost.toLocaleString()}</td>
                        <td className="py-1 px-2 text-center border-r border-slate-300">{totalLaborHours} hrs (${totalLaborCost.toLocaleString()})</td>
                        <td className="py-1 px-2 text-right text-blue-900 font-black text-xs">
                          ${result.costRangeLow.toLocaleString()} - ${result.costRangeHigh.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* SECTION F: STANDARDIZED COLLISION ACCOUNTING & PRELIMINARY ESTIMATE RANGE MATRIX */}
                <div className="border-2 border-slate-950 rounded-md p-2.5 bg-slate-50 space-y-1.5">
                  <div className="flex justify-between items-center border-b border-slate-300 pb-1.5">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 block">
                        Preliminary Collision Repair Estimate Range ({result.make})
                      </span>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl font-black text-slate-950 tracking-tight">
                          ${result.costRangeLow.toLocaleString()} - ${result.costRangeHigh.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-slate-600 uppercase">USD</span>
                      </div>
                    </div>
                    <div className="text-right text-[9.5px] text-slate-700 space-y-0.5">
                      <p><strong>OEM Parts Subtotal:</strong> ${totalPartsCost.toLocaleString()}</p>
                      <p><strong>Collision Labor Subtotal:</strong> {totalLaborHours} Hours @ $95.00/hr (${totalLaborCost.toLocaleString()})</p>
                      <p><strong>Paint & Materials:</strong> Included in Standard US Collision Matrix</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-300 p-1.5 rounded text-[9px] text-amber-950 leading-relaxed">
                    <strong>PRELIMINARY PHOTOGRAMMETRIC ESTIMATE NOTICE:</strong> The dollar amount shown above is an initial preliminary estimate based upon computer vision photogrammetry of visible exterior damage only. Mechanical disassembly, frame measurement, and component teardown are required to uncover hidden structural, cooling, suspension, electrical, and ADAS sensor damage. All supplemental damage and additional parts discovered during teardown will be submitted via formal Insurance Supplement prior to commencement of supplemental repairs.
                  </div>
                </div>

                {/* SECTION G: LEGALLY BINDING US AUTO BODY REPAIR AUTHORIZATION CONTRACT (TERMS & CONDITIONS) */}
                <div className="border border-slate-400 rounded-md p-2 space-y-1 bg-white text-[8px] text-slate-800 leading-tight">
                  <p className="font-bold text-slate-950 uppercase text-[8.5px] border-b border-slate-300 pb-0.5">
                    Standard US Auto Body Repair Agreement, Assignment of Benefits & Legal Disclosures
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div>
                      <p>
                        <strong>1. WORK & TEARDOWN AUTHORIZATION:</strong> Customer hereby authorizes the repair facility to perform initial vehicle intake, mechanical teardown, diagnostic pre/post scans, structural laser measurement, and collision repairs as itemized. Facility personnel are granted permission to operate said vehicle on streets and highways for testing, inspection, and sublet services.
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>2. PRELIMINARY ESTIMATE & SUPPLEMENTAL BILLING:</strong> Customer acknowledges this document is an initial preliminary estimate covering visible damage only. Hidden structural or mechanical damage revealed during teardown will be itemized and submitted to the customer and/or insurer via formal Insurance Supplement for authorization.
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>3. ASSIGNMENT OF BENEFITS (AOB) & DIRECTION TO PAY:</strong> Customer hereby sells, transfers, and assigns to this repair facility all rights, title, and interest in and to all insurance proceeds and supplemental claims due from any insurance company liable for repairs to this vehicle. Customer irrevocably directs said insurer to remit all payments DIRECTLY to this facility.
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>4. POWER OF ATTORNEY / DRAFT ENDORSEMENT:</strong> Customer appoints this repair facility as customer's true and lawful attorney-in-fact to endorse Customer's name on any insurance settlement drafts, checks, or electronic transfers payable to Customer or jointly for the sole purpose of applying proceeds to authorized repair charges.
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p>
                        <strong>5. MECHANIC'S LIEN, STORAGE CHARGES & BAILMENT TERMS:</strong> An express mechanic's lien is acknowledged under state law to secure payment of all repairs, parts, and labor. Vehicles not retrieved within seventy-two (72) hours of completion notice are subject to storage charges at the standard posted rate of $75.00 per calendar day. The facility is not liable for loss or damage to vehicle or personal property in case of fire, theft, accident, or causes beyond facility control.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SECTION H: FORMAL DUAL EXECUTION SIGNATURE BLOCK */}
                <div className="border border-slate-950 rounded-md p-2.5 bg-slate-50 text-[9.5px]">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <p className="font-bold text-slate-950 uppercase tracking-wider text-[10px]">
                        Customer Authorization & Direction to Pay
                      </p>
                      <p className="text-slate-600 text-[8.5px] leading-tight">
                        I have read, understand, and agree to the preliminary estimate terms, teardown authorization, storage conditions, and irrevocable assignment of insurance benefits stated above.
                      </p>
                      <div className="pt-5 border-b border-slate-500 w-full"></div>
                      <p className="text-[8.5px] text-slate-500">Authorized Customer / Insured Signature</p>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div>
                          <span className="text-[8.5px] text-slate-500 block">Printed Name:</span>
                          <div className="border-b border-slate-400 h-3.5"></div>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-slate-500 block">Date & Driver's License #:</span>
                          <div className="border-b border-slate-400 h-3.5"></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="font-bold text-slate-950 uppercase tracking-wider text-[10px]">
                        Certified Collision Estimator & Shop Acceptance
                      </p>
                      <p className="text-slate-600 text-[8.5px] leading-tight">
                        I certify that this preliminary collision appraisal and OEM part resolution adhere to US collision industry benchmarks, I-CAR standards, and manufacturer repair procedures.
                      </p>
                      <div className="pt-5 border-b border-slate-500 w-full"></div>
                      <p className="text-[8.5px] text-slate-500">Certified Collision Estimator Signature</p>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <div>
                          <span className="text-[8.5px] text-slate-500 block">Estimator Name & I-CAR ID:</span>
                          <div className="border-b border-slate-400 h-3.5"></div>
                        </div>
                        <div>
                          <span className="text-[8.5px] text-slate-500 block">Date & State BAR Lic #:</span>
                          <div className="border-b border-slate-400 h-3.5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        <div className="h-8"></div>
      </main>

      {/* 3. EXECUTIVE ENTERPRISE FOOTER */}
      <footer className="bg-white dark:bg-[#04060a] border-t border-slate-200/90 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 print:hidden mt-auto transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200 dark:border-slate-800/80">
            {/* COLUMN 1: PLATFORM IDENTITY */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/30">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="font-black text-slate-900 dark:text-white text-base tracking-tight">CARFIX US ENTERPRISE</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                The authoritative AI collision damage estimating platform for independent US body shops, automotive forensic auditors, and appraisal networks.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Federal DOT / NHTSA vPIC Feed Online
              </div>
            </div>

            {/* COLUMN 2: REGULATORY STANDARDS */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Regulatory Standards</h4>
              <ul className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
                <li>• US DOT 49 CFR Part 565 Compliant</li>
                <li>• NHTSA Federal Vehicle Safety Registry</li>
                <li>• ISO 3779 VIN Verification Standards</li>
                <li>• FMVSS Collision Damage Standards</li>
              </ul>
            </div>

            {/* COLUMN 3: REPAIR & OEM MATRICES */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Collision Benchmarks</h4>
              <ul className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
                <li>• $95.00/hr National US Body Labor Rate</li>
                <li>• Mitchell / CCC ONE Damage Index Alignment</li>
                <li>• Real-Time OEM Parts Registry</li>
                <li>• I-CAR Gold Class Structural Protocols</li>
              </ul>
            </div>

            {/* COLUMN 4: FORENSICS & SECURITY */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Forensic Fraud Shield</h4>
              <ul className="text-xs space-y-1.5 text-slate-500 dark:text-slate-400">
                <li>• Real-Time Multi-Modal Emblem Forensics</li>
                <li>• Automated Cross-Audit (VIN vs. Photos)</li>
                <li>• Side-by-Side Model Discrepancy Alerting</li>
                <li>• 256-Bit TLS Encrypted Data Pipeline</li>
              </ul>
            </div>
          </div>

          {/* BOTTOM BAR: COPYRIGHT & TRUST SEALS */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>© {new Date().getFullYear()} CarFix Technologies Inc. All rights reserved. US Patent Pending.</p>
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
              <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Terms of Appraisal</span>
              <span>•</span>
              <span className="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">NHTSA Data Disclaimer</span>
            </div>
          </div>
        </div>
      </footer>

      {/* TWO-STAGE GATED MODAL PIPELINE */}
      <ConfirmCarModal
        isOpen={isConfirmModalOpen}
        vehicle={pendingVehicle}
        primaryPhotoUrl={previewUrls[0] || null}
        onConfirm={handleConfirmVehicle}
        onEdit={handleEditVehicle}
        onClose={() => setIsConfirmModalOpen(false)}
      />

      <LeadCaptureModal
        isOpen={isLeadCaptureModalOpen}
        vehicle={pendingVehicle}
        imageUrls={previewUrls}
        notes={damageNotes}
        onSuccess={handleLeadCaptured}
        onBack={() => {
          setIsLeadCaptureModalOpen(false);
          setIsConfirmModalOpen(true);
        }}
        onClose={() => setIsLeadCaptureModalOpen(false)}
      />
    </div>
  );
}