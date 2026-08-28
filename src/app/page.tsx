"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Sparkles, Hash, Upload, Info,
  Search, ShieldAlert, ChevronRight, Globe, FileText,
  MapPin, Mail, Phone, Loader2, Car, X, Plus, AlertCircle
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Part = {
  id: string;
  name: string;
  severity: string;
  description: string;
  oem_status: string;
  oem: string | null;
};

type Report = {
  status: string;
  detected_make: string | null;
  detected_model: string | null;
  detected_year: number | null;
  cost_low: number | null;
  cost_high: number | null;
  error_message: string | null;
  parts: Part[];
};

// --- Static Components ---
const TopNav = () => (
  <nav className="w-full border-b border-gray-100 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <Car className="w-8 h-8 text-[#FFC72C]" />
          <span className="text-xl font-black tracking-tight text-slate-900">CarFix<span className="text-[#FFC72C]">.am</span></span>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-sm font-semibold text-slate-700">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs uppercase tracking-wider">Collaboration</span>
          <a href="#" className="hover:text-black transition-colors">How does it work?</a>
          <a href="#" className="hover:text-black transition-colors">About us</a>
        </div>
      </div>
      <div className="hidden md:flex items-center space-x-4 text-sm font-semibold text-slate-700">
        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-slate-100">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="bg-slate-800 text-white px-2 py-0.5 rounded-full text-xs">EN</span>
        </div>
        <a href="#" className="hover:text-black">Login</a>
        <button className="px-5 py-2.5 bg-[#FFC72C] hover:bg-[#F0B920] text-slate-900 rounded-full transition-colors font-bold shadow-sm">
          Register
        </button>
      </div>
    </div>
  </nav>
);

const Footer = () => (
  <footer className="bg-[#0B1527] text-slate-400 py-16 mt-20 border-t border-slate-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-2 space-y-6">
          <div className="flex items-center space-x-2">
            <Car className="w-6 h-6 text-[#FFC72C]" />
            <span className="text-xl font-black text-white">CarFix<span className="text-[#FFC72C]">.am</span></span>
          </div>
          <p className="text-sm leading-relaxed max-w-sm">
            Artificial intelligence car damage assessment by trusted drivers, auto repair shops, and importers in Armenia and the CIS.
          </p>
          <div className="space-y-2 text-sm">
            <p className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> Yerevan, Armenia</p>
            <p className="flex items-center"><Mail className="w-4 h-4 mr-2" /> info@carfix.am</p>
            <p className="flex items-center"><Phone className="w-4 h-4 mr-2" /> +374 43 422 421</p>
          </div>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-6">Company</h4>
          <ul className="space-y-4 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">About us</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-6">Legal</h4>
          <ul className="space-y-4 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-16 pt-8 border-t border-slate-800 text-sm">
        © 2026 CarFix.am · All rights reserved
      </div>
    </div>
  </footer>
);

const AIBanner = () => (
  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex items-start space-x-3">
    <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
    <p className="text-sm text-slate-600 leading-relaxed">
      <strong className="text-slate-900 font-semibold">AI-generated.</strong> Data is generated using artificial intelligence and may contain errors. Please double-check all important details before ordering or arranging a repair.
    </p>
  </div>
);

const SeverityBars = ({ severity }: { severity: string }) => {
  const isHeavy = severity === "SEVERE";
  const isMedium = severity === "MODERATE";
  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        <div className={cn("h-2 w-6 rounded-sm", (isHeavy || isMedium || severity === "LIGHT") ? (isHeavy ? "bg-red-500" : isMedium ? "bg-orange-500" : "bg-emerald-500") : "bg-slate-200")} />
        <div className={cn("h-2 w-6 rounded-sm", (isHeavy || isMedium) ? (isHeavy ? "bg-red-500" : "bg-orange-500") : "bg-slate-200")} />
        <div className={cn("h-2 w-6 rounded-sm", isHeavy ? "bg-red-500" : "bg-slate-200")} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider w-16 text-right">
        {isHeavy ? "HEAVY" : isMedium ? "MEDIUM" : "LIGHT"}
      </span>
    </div>
  );
};

// --- Main App ---
export default function Home() {
  const [status, setStatus] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  // Update object URLs when files change
  useEffect(() => {
    const objectUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(objectUrls);
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  async function handleSubmit(e?: FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    if (files.length === 0) return;
    
    setBusy(true);
    setReport(null);
    setStatus("Uploading files...");

    const formData = new FormData();
    files.forEach(file => formData.append("images", file));
    
    const vinInput = document.getElementById('vin') as HTMLInputElement;
    const notesInput = document.getElementById('notes') as HTMLTextAreaElement;
    if (vinInput?.value) formData.append("vin", vinInput.value);
    if (notesInput?.value) formData.append("notes", notesInput.value);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setStatus("Error: " + data.error);
        setBusy(false);
        return;
      }
      setStatus("Analyzing photos...");
      poll(data.id);
    } catch (err) {
      setStatus("Error connecting to server.");
      setBusy(false);
    }
  }

  function poll(id: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/analysis/${id}`);
        const data: Report = await res.json();
        if (data.status === "COMPLETED") {
          clearInterval(interval);
          setStatus("");
          setReport(data);
          setBusy(false);
        } else if (data.status === "FAILED") {
          clearInterval(interval);
          setStatus("Analysis failed: " + (data.error_message || "unknown error"));
          setBusy(false);
        } else {
          setStatus("AI is processing the damage...");
        }
      } catch (e) {
        // keep polling
      }
    }, 3000);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 10)); // Max 10
    }
    // Reset the input value so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles].slice(0, 10)); // Max 10
    }
  };
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const vehicleName = report 
    ? [report.detected_make, report.detected_model, report.detected_year].filter(Boolean).join(" ")
    : "";

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#FFC72C]/30 selection:text-slate-900 flex flex-col">
      <TopNav />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <AnimatePresence mode="wait">
          
          {/* UPLOAD VIEW */}
          {!report && (
            <motion.div 
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-10 space-y-4">
                <h1 className="text-4xl md:text-[2.75rem] font-extrabold tracking-tight text-[#0B1527]">
                  Perform a damage analysis. Free.
                </h1>
                <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">
                  Upload photos of your vehicle or damaged part and the VIN number. The more photos, the more accurate the AI analysis will be.
                </p>
              </div>

              <div className="max-w-2xl mx-auto mb-10">
                <AIBanner />
              </div>

              {busy ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center shadow-sm">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                    <Loader2 className="w-8 h-8 text-[#FFC72C] animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing your vehicle...</h3>
                  <p className="text-slate-500">{status}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Col: Upload */}
                  <div className="lg:col-span-7 space-y-4">
                    <div 
                      className={cn(
                        "relative bg-white rounded-[2rem] border-2 border-dashed transition-all duration-200 text-center flex flex-col items-center justify-center p-12",
                        dragActive ? "border-[#FFC72C] bg-amber-50/30" : "border-slate-200 hover:border-slate-300"
                      )}
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    >
                      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                      
                      <div className="w-16 h-16 bg-[#0B1527] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                        <Camera className="w-8 h-8 text-[#FFC72C]" />
                      </div>
                      
                      <h3 className="text-xl font-bold text-[#0B1527] mb-2">
                        {files.length > 0 ? `Add another photo (${10 - files.length} left)` : "Drop photos here or click to select"}
                      </h3>
                      <p className="text-sm text-slate-400 mb-8">
                        JPG · PNG · WebP · automatically resized to 1920px before uploading
                      </p>
                      
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-[#FFC72C] hover:bg-[#F0B920] text-slate-900 font-bold py-3 px-8 rounded-full transition-colors flex items-center"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Select photos
                      </button>
                    </div>

                    {/* Image Thumbnails Grid */}
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-6">
                        {previews.map((src, i) => (
                          <div key={i} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group bg-slate-100">
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-[#FFC72C] text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                              Basic
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeFile(i)} 
                              className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1 rounded-full text-slate-700 shadow-sm"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Add More Button */}
                        {files.length < 10 && (
                          <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()} 
                            className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-400 hover:text-slate-500 hover:border-slate-300 bg-white"
                          >
                            <Plus className="w-8 h-8" />
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={files.length === 0}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold transition-all text-center flex items-center justify-center mt-8",
                        files.length === 0 
                          ? "bg-amber-100 text-amber-700/50 cursor-not-allowed" 
                          : "bg-[#FFC72C] hover:bg-[#F0B920] text-slate-900 shadow-sm hover:shadow"
                      )}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {files.length === 0 ? "Add at least one photo" : "Start Analysis"}
                    </button>
                  </div>

                  {/* Right Col: Fields */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                      <label htmlFor="vin" className="flex items-center text-sm font-bold text-slate-900 mb-4">
                        <Hash className="w-4 h-4 mr-2 text-[#FFC72C]" />
                        Vehicle VIN number
                      </label>
                      <input
                        type="text"
                        id="vin"
                        placeholder="JT2BF22K8X0123456"
                        maxLength={17}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC72C] focus:border-transparent font-mono placeholder:text-slate-300 mb-4"
                      />
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">
                        The VIN number is not required, but is recommended. It helps the AI correctly identify the make and model of your vehicle, providing more accurate analysis.
                      </p>
                      <p className="text-xs font-semibold text-amber-600 leading-relaxed">
                        Don't want to type it in manually? Just add a photo of the VIN code and AI will automatically read it.
                      </p>
                    </div>
                    
                    {/* VIN strongly recommended banner when files exist */}
                    {files.length > 0 && (
                      <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-6 shadow-sm flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 mb-2">VIN is strongly recommended</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            We couldn't read the VIN from your photos. Enter it above if you have it — it helps guide the AI to your exact vehicle. Otherwise, fill in your vehicle details below so we can find the right parts.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                      <label htmlFor="notes" className="flex items-center text-sm font-bold text-slate-900 mb-4">
                        Something else we need to know
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        placeholder="Scratched in the parking lot? Highway damage? Hail damage?"
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFC72C] focus:border-transparent placeholder:text-slate-300 resize-none"
                      />
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          )}

          {/* REPORT VIEW */}
          {report && (
            <motion.div 
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Image & Cost */}
              <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
                {previews[0] && (
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-md border border-slate-200 bg-slate-100">
                    <img src={previews[0]} alt="Uploaded Vehicle" className="w-full h-full object-cover" />
                    
                    {/* Top Left Badge */}
                    <div className="absolute top-4 left-4 bg-[#0B1527] text-white rounded-xl px-4 py-2 text-sm shadow-lg">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">CAR</div>
                      <div className="font-bold">{vehicleName || "Unknown Vehicle"}</div>
                    </div>

                    {/* Bottom Right Badge */}
                    <div className="absolute bottom-4 right-4 bg-[#FFC72C] text-slate-900 rounded-xl px-4 py-2 text-sm font-bold shadow-lg flex items-center">
                      <div className="text-right mr-2">
                        <div className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5">RESULTS</div>
                        <div>{report.parts?.length || 0} parts</div>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                )}

                <div className="bg-[#0B1527] rounded-[2rem] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      COST OF PARTS <span className="opacity-60">(ESTIMATED)</span>
                    </h3>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">WEIGHT</span>
                      <SeverityBars severity="SEVERE" />
                    </div>
                  </div>
                  
                  <div className="text-3xl font-black mb-2">
                    {report.cost_low?.toLocaleString()} ֏ – {report.cost_high?.toLocaleString()} ֏
                  </div>
                  <p className="text-sm text-slate-400 mb-8 max-w-sm leading-relaxed">
                    The range reflects estimated prices of parts. You will see the actual price when you select a supplier or purchase a part online.
                  </p>
                  
                  <div className="flex items-center space-x-3">
                    <button className="bg-[#FFC72C] hover:bg-[#F0B920] text-slate-900 font-bold py-3 px-6 rounded-full transition-colors text-sm">
                      Save this analysis
                    </button>
                    <button className="border border-slate-600 hover:border-slate-400 text-white font-bold py-3 px-6 rounded-full transition-colors text-sm bg-slate-800/50 relative overflow-hidden">
                      <span className="absolute top-0 right-2 bg-[#FFC72C] text-slate-900 text-[9px] font-bold px-1.5 rounded-b-sm uppercase">NEW</span>
                      Get a repair quote
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Parts List */}
              <div className="lg:col-span-7 space-y-6">
                <div className="mb-8">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">DIAGNOSTIC REPORT</h4>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1527] mb-2 leading-tight">
                    We found {report.parts?.length || 0} parts that need attention.
                  </h2>
                  <p className="text-slate-500">Click on the part to compare verified suppliers and online offers.</p>
                </div>

                <AIBanner />

                <div className="space-y-4">
                  {(!report.parts || report.parts.length === 0) ? (
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-12 text-center shadow-sm">
                      <ShieldAlert className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-slate-900 mb-2">No structural damage detected</h3>
                      <p className="text-slate-500">The AI could not identify any significant damage requiring repair.</p>
                    </div>
                  ) : (
                    report.parts.map((p, i) => (
                      <div key={p.id || i} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:border-[#FFC72C] transition-colors">
                        <div className="flex items-start">
                          {/* Number Badge */}
                          <div className="w-12 h-12 rounded-xl bg-[#0B1527] text-white flex items-center justify-center font-bold text-lg shrink-0 mr-5 mt-1 shadow-md">
                            {(i + 1).toString().padStart(2, '0')}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                              <h4 className="text-xl font-bold text-slate-900 capitalize truncate">{p.name}</h4>
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                                PRICE IS EXPECTED. <ChevronRight className="w-4 h-4 ml-1" />
                              </div>
                            </div>
                            
                            <div className="flex items-center flex-wrap gap-4 mb-4">
                              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50/50 border border-amber-200 text-amber-700 text-sm font-bold">
                                <Search className="w-4 h-4" />
                                <span>{p.oem_status === "PENDING" ? "OEM looking for..." : p.oem || "Not available"}</span>
                              </div>
                              <SeverityBars severity={p.severity} />
                            </div>
                            
                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                              {p.description}
                            </p>

                            <button className="w-full py-3 border border-amber-200 hover:bg-amber-50 rounded-xl text-amber-700 font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center">
                              View Replacement Details <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Share Card Mock */}
                  <div className="bg-[#FFC72C] rounded-3xl p-8 mt-8 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Help other drivers — share this analysis</h4>
                        <p className="text-slate-800 text-sm mb-4 leading-relaxed">
                          Let other drivers see your case photos, parts, and prices on the CarFix.am homepage. <br/><br/>
                          <strong>Your email, location, IP, and VIN remain confidential.</strong><br/>
                          Our team reviews each application before publishing.
                        </p>
                        <button className="bg-[#0B1527] hover:bg-black text-white font-bold py-3 px-6 rounded-full transition-colors text-sm w-full sm:w-auto flex items-center justify-center">
                          <Globe className="w-4 h-4 mr-2 opacity-50" />
                          PUBLISH THIS ANALYSIS
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <Footer />
    </div>
  );
}
