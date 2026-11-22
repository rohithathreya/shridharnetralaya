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

  const patientTabs = [
    { id: 'invoice' as PatientTab, label: 'Bill', long: 'New invoice', icon: <Receipt className="h-4 w-4" /> },
    { id: 'discharge' as PatientTab, label: 'Discharge', long: 'Discharge', icon: <FileText className="h-4 w-4" /> },
    { id: 'upload' as PatientTab, label: 'Upload', long: 'Upload', icon: <FileImage className="h-4 w-4" /> },
    {
      id: 'history' as PatientTab,
      label: `Files (${invoices.length + summaries.length + documents.length})`,
      long: `History (${invoices.length + summaries.length + documents.length})`,
      icon: <History className="h-4 w-4" />,
    },
  ];

  return (
    <div className="page-shell">
      <div className="no-print mb-6 space-y-4">
        <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={() => setSection('desk')}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 px-3 text-xs font-medium uppercase tracking-[0.14em] ${
              section === 'desk' ? 'section-tab-active' : 'section-tab-idle'
            }`}
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Patient desk</span>
            <span className="sm:hidden">Desk</span>
          </button>
          <button
            type="button"
            onClick={() => setSection('followups')}
            className={`inline-flex min-h-[48px] items-center justify-center gap-2 px-3 text-xs font-medium uppercase tracking-[0.14em] ${
              section === 'followups' ? 'section-tab-active' : 'section-tab-idle'
            }`}
          >
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Follow-ups</span>
            <span className="sm:hidden">Recalls</span>
          </button>
        </div>

        {selectedPatient && section === 'desk' && (
          <button
            type="button"
            onClick={() => setSelectedPatient(null)}
            className="btn-ghost !w-full sm:!w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </button>
        )}
      </div>

      {/* SECTION A: FOLLOW-UPS DUE */}
      {section === 'followups' && (
        <div className="space-y-3">
          <header className="space-y-2">
            <span className="step-badge">Follow-ups · ±7 days</span>
            <p className="text-sm font-light text-ivory-500">
              Tap a patient to open their chart or send a WhatsApp reminder.
            </p>
          </header>

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
                      <div className="mt-1 text-xs text-ivory-500">
                        Phone: <strong>{p.phone}</strong>
                        {p.village_address ? ` • ${p.village_address}` : ''}
                      </div>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <button
                        type="button"
                        onClick={() => sendFollowUpReminderWhatsApp(p, clinic)}
                        className="btn-primary !min-h-[44px] text-[10px] sm:!w-auto"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setSection('desk');
                          setActiveTab('history');
                        }}
                        className="btn-ghost !min-h-[44px] text-[10px] sm:!w-auto"
                      >
                        Open chart
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
        <div className="space-y-6">
          <div className="card-surface no-print space-y-5 p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-3">
                <span className="step-badge">Step 2 · Patient chart</span>
                <div>
                  <h2 className="font-display text-2xl text-ivory-50 sm:text-3xl">{selectedPatient.full_name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold-400">{selectedPatient.patient_code}</p>
                </div>
                {selectedPatient.allergies && selectedPatient.allergies.toUpperCase() !== 'NKDA' && (
                  <p className="inline-flex items-center gap-1 border border-red-400/30 px-2 py-1 text-xs text-red-300">
                    <AlertCircle className="h-3.5 w-3.5" /> {selectedPatient.allergies}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-ivory-300">
                  <span>
                    {selectedPatient.age ? `${selectedPatient.age} yrs` : 'Age —'} / {selectedPatient.sex || '—'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-ivory-50">
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
                    <span className="inline-flex items-center gap-1 text-gold-300">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDisplayDate(selectedPatient.next_follow_up)}
                    </span>
                  )}
                </div>
                {selectedPatient.comorbidities?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.comorbidities.map((c) => (
                      <span key={c} className="border border-gold-500/25 px-2 py-0.5 text-[11px] text-gold-300">
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
                className="btn-ghost shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            </div>

            <div>
              <p className="label-field mb-3">Step 3 · Choose action</p>
              <div className="scroll-tabs">
                {patientTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`tab-chip ${activeTab === tab.id ? 'tab-chip-active' : 'tab-chip-idle'}`}
                  >
                    {tab.icon}
                    <span className="sm:hidden">{tab.label}</span>
                    <span className="hidden sm:inline">{tab.long}</span>
                  </button>
                ))}
              </div>
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
