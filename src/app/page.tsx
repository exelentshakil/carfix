"use client";

import { useState, FormEvent, useRef } from "react";

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

export default function Home() {
  const [status, setStatus] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFilesCount, setSelectedFilesCount] = useState(0);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setReport(null);
    setStatus("Uploading...");

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/analyze", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setStatus("Error: " + data.error);
      setBusy(false);
      return;
    }

    setStatus("Analyzing photos, this can take up to a minute...");
    poll(data.id);
  }

  function poll(id: string) {
    const interval = setInterval(async () => {
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
      }
    }, 3000);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFilesCount(e.target.files.length);
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "LIGHT":
        return "bg-green-100 text-green-800 border-green-200";
      case "MODERATE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SEVERE":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            AI Car Damage Assessment
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Upload photos of the damaged vehicle to receive an instant AI-powered repair estimate and parts analysis.
          </p>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Upload Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Photos (Max 10)
              </label>
              <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <span className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload files</span>
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, WebP up to 10MB
                  </p>
                  {selectedFilesCount > 0 && (
                    <p className="text-sm font-semibold text-blue-600 mt-2">
                      {selectedFilesCount} file(s) selected
                    </p>
                  )}
                </div>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                name="images" 
                accept="image/*" 
                multiple 
                required 
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="vin" className="block text-sm font-medium text-gray-700">
                  VIN (Optional)
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="vin"
                    id="vin"
                    placeholder="Enter 17-digit VIN"
                    maxLength={17}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-lg p-3 border"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Improves vehicle identification accuracy.</p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Additional Notes (Optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="e.g., Scratched in a parking lot, highway debris damage..."
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-lg p-3 border"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={busy}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors
                  ${busy 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
              >
                {busy ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Analysis...
                  </span>
                ) : (
                  'Start AI Analysis'
                )}
              </button>
            </div>
          </form>
          
          {/* Status Message */}
          {status && !report && (
            <div className="mt-6 p-4 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center">
              <svg className="animate-spin mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">{status}</span>
            </div>
          )}
        </div>

        {/* Report Section */}
        {report && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-8 animate-fade-in-up">
            
            {/* Report Header */}
            <div className="bg-slate-900 px-6 py-8 sm:px-8 text-white">
              <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                  <h2 className="text-sm font-semibold tracking-wide uppercase text-blue-400 mb-1">
                    Analysis Report
                  </h2>
                  <h3 className="text-3xl font-bold">
                    {[report.detected_year, report.detected_make, report.detected_model]
                      .filter(Boolean)
                      .join(" ") || "Vehicle not identified"}
                  </h3>
                </div>
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 text-right">
                  <p className="text-sm text-slate-400 mb-1">Estimated Repair Cost</p>
                  <p className="text-2xl font-bold text-white">
                    ${report.cost_low} <span className="text-slate-500 font-normal mx-1">-</span> ${report.cost_high}
                  </p>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Detected Damage ({report.parts?.length || 0} parts)
                </h3>
              </div>

              {(!report.parts || report.parts.length === 0) ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No damage detected</h3>
                  <p className="mt-1 text-sm text-gray-500">The AI could not identify any significant damage in the provided photos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report.parts.map((p, i) => (
                    <div key={p.id || i} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                              {i + 1}
                            </span>
                            <h4 className="text-lg font-bold text-gray-900 capitalize">{p.name}</h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityBadgeClass(p.severity)}`}>
                              {p.severity}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mt-2 pl-9 leading-relaxed">
                            {p.description}
                          </p>
                        </div>
                        <div className="sm:text-right pl-9 sm:pl-0">
                          <div className="inline-flex flex-col">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">OEM Part No.</span>
                            {p.oem_status === "PENDING" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Lookup Pending
                              </span>
                            ) : p.oem ? (
                              <span className="text-sm font-mono font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                {p.oem}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Not found</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-center sm:text-left">
              <p className="text-xs text-gray-500">
                This is an AI-generated estimate and does not constitute a guaranteed repair quote. Prices and part availability may vary by location and shop.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
