'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
  TrendingUp,
  User,
  Users,
  X,
  AlertCircle,
  PhoneCall,
  Send,
  Save,
} from 'lucide-react';
import { LeadRecord } from '@/lib/leadStore';

const STATUS_OPTIONS: Array<{
  value: LeadRecord['status'];
  label: string;
  badgeClass: string;
  bgLight: string;
}> = [
  {
    value: 'NEW',
    label: 'New Lead',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    bgLight: 'bg-emerald-500',
  },
  {
    value: 'CONTACTED',
    label: 'Contacted',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    bgLight: 'bg-blue-500',
  },
  {
    value: 'ESTIMATING',
    label: 'Estimating',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    bgLight: 'bg-amber-500',
  },
  {
    value: 'WON',
    label: 'Job Won',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    bgLight: 'bg-purple-500',
  },
  {
    value: 'LOST',
    label: 'Closed / Lost',
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
    bgLight: 'bg-slate-500',
  },
];

export default function AdminCrmPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [internalNotesDraft, setInternalNotesDraft] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveNotesSuccess, setSaveNotesSuccess] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = statusFilter !== 'ALL'
        ? `/api/leads?status=${statusFilter}`
        : '/api/leads';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch leads');
      }
      setLeads(data.leads || []);
    } catch (err: any) {
      console.error('Error fetching leads:', err);
      setError(err.message || 'Failed to connect to leads database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // Open drawer and sync internal notes
  const openLeadDetails = (lead: LeadRecord) => {
    setSelectedLead(lead);
    setInternalNotesDraft(lead.internalNotes || '');
    setSaveNotesSuccess(false);
  };

  const handleUpdateStatus = async (leadId: string, newStatus: LeadRecord['status']) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    }
  };

  const handleSaveInternalNotes = async () => {
    if (!selectedLead) return;
    setIsSavingNotes(true);
    setSaveNotesSuccess(false);
    try {
      const res = await fetch(`/api/leads/${selectedLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: internalNotesDraft }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === selectedLead.id ? { ...l, internalNotes: internalNotesDraft } : l
          )
        );
        setSelectedLead({ ...selectedLead, internalNotes: internalNotesDraft });
        setSaveNotesSuccess(true);
        setTimeout(() => setSaveNotesSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        lead.fullName.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        (lead.vin && lead.vin.toLowerCase().includes(q)) ||
        (lead.vehicleMake && lead.vehicleMake.toLowerCase().includes(q)) ||
        (lead.vehicleModel && lead.vehicleModel.toLowerCase().includes(q))
      );
    });
  }, [leads, searchQuery]);

  // Executive KPI calculations
  const kpis = useMemo(() => {
    const totalCount = leads.length;
    let totalPipeline = 0;
    let newLeadsCount = 0;
    let wonLeadsCount = 0;

    leads.forEach((l) => {
      if (l.estimatedCostHigh) totalPipeline += l.estimatedCostHigh;
      if (l.status === 'NEW') newLeadsCount++;
      if (l.status === 'WON') wonLeadsCount++;
    });

    const averageTicket = totalCount > 0 ? Math.round(totalPipeline / totalCount) : 0;

    return {
      totalCount,
      totalPipeline,
      averageTicket,
      newLeadsCount,
      wonLeadsCount,
    };
  }, [leads]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredLeads.length === 0) return;

    const headers = [
      'Lead ID',
      'Created At',
      'Status',
      'Full Name',
      'Phone',
      'Email',
      'VIN',
      'Year',
      'Make',
      'Model',
      'Trim',
      'Body Class',
      'Est Cost Low ($)',
      'Est Cost High ($)',
      'Damage Summary',
      'Customer Notes',
      'Internal Shop Notes',
    ];

    const rows = filteredLeads.map((l) => [
      `"${l.id}"`,
      `"${l.createdAt}"`,
      `"${l.status}"`,
      `"${l.fullName.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.vin || ''}"`,
      `"${l.vehicleYear || ''}"`,
      `"${l.vehicleMake || ''}"`,
      `"${l.vehicleModel || ''}"`,
      `"${l.vehicleTrim || ''}"`,
      `"${l.vehicleBody || ''}"`,
      l.estimatedCostLow || '',
      l.estimatedCostHigh || '',
      `"${(l.damageSummary || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${(l.internalNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `carfix_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. TOP NAV / EXECUTIVE BAR */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Return to Public Estimator"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <span>CARFIX</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-extrabold text-xs px-2 py-0.5 rounded bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20">
                    CRM
                  </span>
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live Inbound Feed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Shop Manager Collision Lead Pipeline & Conversion Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchLeads}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={filteredLeads.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CRM WORKSPACE */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* EXECUTIVE KPI METRICS STRIP */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* TOTAL LEADS */}
          <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Inbound Leads
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {kpis.totalCount}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +100%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Gated AI damage estimates</p>
          </div>

          {/* TOTAL PIPELINE REVENUE */}
          <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pipeline Value
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(kpis.totalPipeline)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Total estimated repair dollar volume</p>
          </div>

          {/* AVERAGE TICKET */}
          <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Average Ticket
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {formatCurrency(kpis.averageTicket)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Based on $95/hr labor benchmark</p>
          </div>

          {/* ACTION REQUIRED / NEW LEADS */}
          <div className="bg-white dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Action Required
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {kpis.newLeadsCount}
              </span>
              <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                Uncontacted
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Goal: Call within 15 minutes</p>
          </div>
        </div>

        {/* CONTROLS BAR: SEARCH & STATUS FILTER */}
        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          {/* SEARCH BAR */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, phone, email, VIN, car..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* STATUS FILTER PILLS */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All Leads ({leads.length})
            </button>
            {STATUS_OPTIONS.map((opt) => {
              const count = leads.filter((l) => l.status === opt.value).length;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    statusFilter === opt.value
                      ? `${opt.badgeClass} ring-2 ring-cyan-500/20 shadow-sm`
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3. LEADS TABLE */}
        <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Customer Lead</th>
                  <th className="py-3.5 px-4">Vehicle Details</th>
                  <th className="py-3.5 px-4">Est. Repair Range</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Captured</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <Car className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-semibold">No leads found matching your filter</p>
                      <p className="text-xs mt-1">Captured leads will appear here automatically.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const statusOpt =
                      STATUS_OPTIONS.find((s) => s.value === lead.status) || STATUS_OPTIONS[0];

                    const vehicleName = [lead.vehicleYear, lead.vehicleMake, lead.vehicleModel]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => openLeadDetails(lead)}
                      >
                        {/* CUSTOMER */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center shrink-0">
                              {lead.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                {lead.fullName}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                <a
                                  href={`tel:${lead.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{lead.phone}</span>
                                </a>
                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                <a
                                  href={`mailto:${lead.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center gap-1"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate max-w-[150px]">{lead.email}</span>
                                </a>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* VEHICLE */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {vehicleName || 'Vehicle Profile'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {lead.vin ? (
                              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                                {lead.vin}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No VIN</span>
                            )}
                            {lead.vehicleBody && (
                              <span className="text-[11px] text-slate-400">
                                • {lead.vehicleBody}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ESTIMATED REPAIR */}
                        <td className="py-4 px-4">
                          {lead.estimatedCostLow && lead.estimatedCostHigh ? (
                            <div>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(lead.estimatedCostLow)} - {formatCurrency(lead.estimatedCostHigh)}
                              </p>
                              {lead.damageSummary && (
                                <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">
                                  {lead.damageSummary}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">
                              Calculation Pending
                            </span>
                          )}
                        </td>

                        {/* STATUS DROPDOWN */}
                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={lead.status}
                            onChange={(e) =>
                              handleUpdateStatus(lead.id, e.target.value as LeadRecord['status'])
                            }
                            className={`text-xs font-bold py-1 px-2.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white dark:bg-slate-950 ${statusOpt.badgeClass}`}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value} className="text-slate-900 dark:text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* CAPTURED DATE */}
                        <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(lead.createdAt)}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-4 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openLeadDetails(lead)}
                            className="p-2 rounded-xl text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Inspect Lead"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 4. SLIDE-OVER / MODAL DETAIL DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* DRAWER HEADER */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                    {selectedLead.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">Lead ID: {selectedLead.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* DRAWER BODY */}
            <div className="p-6 space-y-6 flex-1">
              {/* STATUS BAR & QUICK CALL BUTTONS */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lead Status Workflow
                  </span>
                  <select
                    value={selectedLead.status}
                    onChange={(e) =>
                      handleUpdateStatus(selectedLead.id, e.target.value as LeadRecord['status'])
                    }
                    className="text-xs font-bold py-1 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-600/30"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    Call {selectedLead.phone}
                  </a>
                  <a
                    href={`mailto:${selectedLead.email}?subject=Your CARFIX Damage Appraisal Report`}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-600/30"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Email Customer
                  </a>
                </div>
              </div>

              {/* VEHICLE PROFILE */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-cyan-500" />
                  Vehicle Specifications
                </h4>
                <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Vehicle</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {[selectedLead.vehicleYear, selectedLead.vehicleMake, selectedLead.vehicleModel]
                        .filter(Boolean)
                        .join(' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Trim / Edition</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedLead.vehicleTrim || 'Standard'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">VIN</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {selectedLead.vin || 'Not Provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Body Class</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedLead.vehicleBody || 'Sedan'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Transmission</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedLead.transmission || 'Automatic'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Fuel Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedLead.fuelType || 'Gasoline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ESTIMATED REPAIR & DAMAGE SUMMARY */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  AI Damage & Cost Breakdown
                </h4>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Estimated Repair Range
                    </span>
                    <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                      {selectedLead.estimatedCostLow && selectedLead.estimatedCostHigh
                        ? `${formatCurrency(selectedLead.estimatedCostLow)} - ${formatCurrency(selectedLead.estimatedCostHigh)}`
                        : 'Calculation Pending'}
                    </span>
                  </div>
                  {selectedLead.damageSummary && (
                    <div className="pt-2 border-t border-emerald-500/10 text-slate-700 dark:text-slate-300 leading-relaxed">
                      <strong className="block text-[10px] uppercase text-emerald-600 dark:text-emerald-400">
                        Itemized Findings
                      </strong>
                      {selectedLead.damageSummary}
                    </div>
                  )}
                </div>
              </div>

              {/* CUSTOMER NOTES */}
              {selectedLead.notes && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Customer Submitted Notes
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{selectedLead.notes}&rdquo;
                  </div>
                </div>
              )}

              {/* UPLOADED PHOTO THUMBNAILS */}
              {selectedLead.imageUrls && selectedLead.imageUrls.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Damage Imagery ({selectedLead.imageUrls.length})
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedLead.imageUrls.map((img, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt="Damage" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SHOP ESTIMATOR INTERNAL NOTES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Shop Internal Notes
                  </h4>
                  {saveNotesSuccess && (
                    <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Saved
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={internalNotesDraft}
                  onChange={(e) => setInternalNotesDraft(e.target.value)}
                  placeholder="Record customer follow-up notes, insurance adjustor details, or parts lead time..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleSaveInternalNotes}
                  disabled={isSavingNotes}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Saving...' : 'Save Internal Notes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
