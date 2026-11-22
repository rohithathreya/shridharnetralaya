import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  FileImage,
  FileText,
  History,
  MessageCircle,
  Pencil,
  Phone,
  MapPin,
  Receipt,
  AlertCircle,
  Users,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDisplayDate, todayIsoDate, addDaysIso } from '../lib/dates';
import { sendFollowUpReminderWhatsApp } from '../lib/whatsapp';
import { PinGate } from '../components/PinGate';
import { PatientSearch } from '../components/PatientSearch';
import { PatientModal } from '../components/PatientModal';
import { InvoiceForm } from '../components/InvoiceForm';
import { DischargeSummaryForm } from '../components/DischargeSummaryForm';
import { DocumentUploadForm } from '../components/DocumentUploadForm';
import { PatientTimeline } from '../components/PatientTimeline';
import type {
  DischargeSummary,
  Invoice,
  Patient,
  PatientDocument,
  ServiceCatalogItem,
  SurgicalProtocol,
} from '../types/database';

type StaffSection = 'desk' | 'followups';
type PatientTab = 'history' | 'invoice' | 'discharge' | 'upload';

const CATALOG_CACHE_KEY = 'sn_catalog_cache_v1';
const PROTOCOLS_CACHE_KEY = 'sn_protocols_cache_v1';

export function StaffWorkspace() {
  const { role, loading, clinic } = useAuth();
  const [section, setSection] = useState<StaffSection>('desk');

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<PatientTab>('invoice');

  // Modals
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Catalog & Protocols
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>(() => {
    try {
      const c = localStorage.getItem(CATALOG_CACHE_KEY);
      return c ? JSON.parse(c) : [];
    } catch {
      return [];
    }
  });
  const [protocols, setProtocols] = useState<SurgicalProtocol[]>(() => {
    try {
      const p = localStorage.getItem(PROTOCOLS_CACHE_KEY);
      return p ? JSON.parse(p) : [];
    } catch {
      return [];
    }
  });

  // Patient History
  const [historyLoading, setHistoryLoading] = useState(false);
  const [summaries, setSummaries] = useState<DischargeSummary[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);

  // Follow-ups list
  const [followUps, setFollowUps] = useState<Patient[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    const [catRes, protoRes] = await Promise.all([
      supabase.from('service_catalog').select('*').order('sort_order', { ascending: true }),
      supabase.from('surgical_protocols').select('*').order('sort_order', { ascending: true }),
    ]);
    if (catRes.data) {
      setCatalog(catRes.data as ServiceCatalogItem[]);
      try { localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catRes.data)); } catch {}
    }
    if (protoRes.data) {
      setProtocols(protoRes.data as SurgicalProtocol[]);
      try { localStorage.setItem(PROTOCOLS_CACHE_KEY, JSON.stringify(protoRes.data)); } catch {}
    }
  }, []);

  const loadPatientHistory = useCallback(async (patientId: string) => {
    setHistoryLoading(true);
    const [dsRes, invRes, docRes] = await Promise.all([
      supabase.from('discharge_summaries').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }),
      supabase.from('patient_documents').select('*').eq('patient_id', patientId).order('visit_date', { ascending: false }),
    ]);
    setSummaries((dsRes.data as DischargeSummary[]) || []);
    setInvoices((invRes.data as Invoice[]) || []);
    setDocuments((docRes.data as PatientDocument[]) || []);
    setHistoryLoading(false);
  }, []);

  const loadFollowUps = useCallback(async () => {
    setFollowUpsLoading(true);
    const weekAhead = addDaysIso(7);
    const weekAgo = addDaysIso(-7);
    const { data } = await supabase
      .from('patients')
      .select('*')
      .not('next_follow_up', 'is', null)
      .gte('next_follow_up', weekAgo)
      .lte('next_follow_up', weekAhead)
      .order('next_follow_up', { ascending: true });
    setFollowUps((data as Patient[]) || []);
    setFollowUpsLoading(false);
  }, []);

  useEffect(() => {
    if (role === 'staff' || role === 'admin') {
      loadConfig();
    }
  }, [role, loadConfig]);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientHistory(selectedPatient.id);
    }
  }, [selectedPatient, loadPatientHistory]);

  useEffect(() => {
    if ((role === 'staff' || role === 'admin') && section === 'followups') {
      loadFollowUps();
    }
  }, [role, section, loadFollowUps]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-clinic-400" />
      </div>
    );
  }

  if (role !== 'staff' && role !== 'admin') {
    return <PinGate requiredTier="staff" />;
  }

  const today = todayIsoDate();

  return (
    <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6">
      {/* Top Staff Switcher */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSection('desk')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              section === 'desk' ? 'section-tab-active' : 'section-tab-idle'
            }`}
          >
            <Users className="h-4 w-4" />
            Patient Desk
          </button>
          <button
            type="button"
            onClick={() => setSection('followups')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              section === 'followups' ? 'section-tab-active' : 'section-tab-idle'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Follow-Ups Due
          </button>
        </div>

        {selectedPatient && section === 'desk' && (
          <button
            type="button"
            onClick={() => setSelectedPatient(null)}
            className="btn-ghost py-2 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Switch Patient
          </button>
        )}
      </div>

      {/* SECTION A: FOLLOW-UPS DUE */}
      {section === 'followups' && (
        <div className="space-y-3">
          <div className="card-surface p-4">
            <h2 className="text-base font-bold text-white">
              Follow-ups due (±7 days)
            </h2>
            <p className="text-xs text-slate-500">
              Send 1-click Kannada + English WhatsApp reminders or tap any patient to open their file.
            </p>
          </div>

          {followUpsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-clinic-600" />
            </div>
          ) : followUps.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-obsidian-900/40 p-8 text-center text-sm text-slate-500">
              No scheduled follow-ups in this 14-day window yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {followUps.map((p) => {
                const isToday = p.next_follow_up === today;
                const isOverdue = Boolean(p.next_follow_up && p.next_follow_up < today);
                return (
                  <div
                    key={p.id}
                    className="card-surface flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-white">{p.full_name}</span>
                        <span className="rounded bg-obsidian-800 px-2 py-0.5 text-xs font-bold text-gold-400">
                          {p.patient_code}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            isToday
                              ? 'bg-clinic-600 text-white'
                              : isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isToday
                            ? 'TODAY'
                            : isOverdue
                              ? `Overdue (${formatDisplayDate(p.next_follow_up)})`
                              : formatDisplayDate(p.next_follow_up)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Phone: <strong>{p.phone}</strong>
                        {p.village_address ? ` • ${p.village_address}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => sendFollowUpReminderWhatsApp(p, clinic)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Reminder
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setSection('desk');
                          setActiveTab('history');
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
                      >
                        Open File
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION B: PATIENT DESK */}
      {section === 'desk' && !selectedPatient && (
        <PatientSearch
          onSelectPatient={(p) => {
            setSelectedPatient(p);
            setActiveTab('invoice');
          }}
          onRequestNewPatient={(phone) => {
            setEditingPatient(null);
            setNewPatientPhone(phone);
            setPatientModalOpen(true);
          }}
        />
      )}

      {section === 'desk' && selectedPatient && (
        <div className="space-y-5">
          {/* Patient Header Banner */}
          <div className="card-surface no-print p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{selectedPatient.full_name}</h2>
                  <span className="rounded-lg bg-clinic-600/90 px-2.5 py-0.5 text-xs font-bold text-white">
                    {selectedPatient.patient_code}
                  </span>
                  {selectedPatient.allergies && selectedPatient.allergies.toUpperCase() !== 'NKDA' && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-2.5 py-0.5 text-xs font-extrabold text-red-800">
                      <AlertCircle className="h-3.5 w-3.5" /> Allergy: {selectedPatient.allergies}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
                  <span>
                    {selectedPatient.age ? `${selectedPatient.age} yrs` : 'Age —'} / {selectedPatient.sex || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-slate-900">
                    <Phone className="h-3.5 w-3.5 text-clinic-600" />
                    {selectedPatient.phone}
                  </span>
                  {selectedPatient.village_address && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {selectedPatient.village_address}
                    </span>
                  )}
                  {selectedPatient.next_follow_up && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-800">
                      <Calendar className="h-3.5 w-3.5" />
                      Follow-Up: {formatDisplayDate(selectedPatient.next_follow_up)}
                    </span>
                  )}
                </div>
                {selectedPatient.comorbidities?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedPatient.comorbidities.map((c) => (
                      <span
                        key={c}
                        className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 ring-1 ring-amber-200"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingPatient(selectedPatient);
                  setPatientModalOpen(true);
                }}
                className="btn-ghost py-2 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Details
              </button>
            </div>

            {/* 4 Big Action Tabs */}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
              {(
                [
                  { id: 'invoice', label: 'New Invoice', icon: <Receipt className="h-4 w-4" /> },
                  { id: 'discharge', label: 'Discharge Summary', icon: <FileText className="h-4 w-4" /> },
                  { id: 'upload', label: 'Upload Rx / Photo', icon: <FileImage className="h-4 w-4" /> },
                  {
                    id: 'history',
                    label: `History (${invoices.length + summaries.length + documents.length})`,
                    icon: <History className="h-4 w-4" />,
                  },
                ] as { id: PatientTab; label: string; icon: React.ReactNode }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-xs font-extrabold transition sm:text-sm ${
                    activeTab === tab.id
                      ? 'border-clinic-500/50 bg-clinic-600/25 text-clinic-100 shadow-glow'
                      : 'border-white/10 bg-obsidian-950/50 text-slate-400 hover:border-clinic-500/25'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Workspace Tab */}
          {activeTab === 'invoice' && (
            <InvoiceForm
              patient={selectedPatient}
              clinic={clinic}
              catalog={catalog}
              onCreated={(inv) => setInvoices((prev) => [inv, ...prev])}
            />
          )}

          {activeTab === 'discharge' && (
            <DischargeSummaryForm
              patient={selectedPatient}
              clinic={clinic}
              protocols={protocols}
              onCreated={(ds) => {
                setSummaries((prev) => [ds, ...prev]);
                if (ds.follow_up_1) {
                  setSelectedPatient((prev) => (prev ? { ...prev, next_follow_up: ds.follow_up_1 } : prev));
                }
              }}
            />
          )}

          {activeTab === 'upload' && (
            <DocumentUploadForm
              patient={selectedPatient}
              clinic={clinic}
              onUploaded={(doc) => setDocuments((prev) => [doc, ...prev])}
            />
          )}

          {activeTab === 'history' &&
            (historyLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-clinic-600" />
              </div>
            ) : (
              <PatientTimeline
                patient={selectedPatient}
                clinic={clinic}
                summaries={summaries}
                invoices={invoices}
                documents={documents}
              />
            ))}
        </div>
      )}

      {/* New / Edit Patient Modal */}
      {patientModalOpen && (
        <PatientModal
          initialPhone={newPatientPhone}
          editingPatient={editingPatient}
          onClose={() => setPatientModalOpen(false)}
          onSaved={(saved) => {
            setPatientModalOpen(false);
            setSelectedPatient(saved);
          }}
        />
      )}
    </div>
  );
}
