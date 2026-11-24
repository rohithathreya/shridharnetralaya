import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileImage,
  FileText,
  History,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Receipt,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { addDaysIso, formatDisplayDate, todayIsoDate } from '../lib/dates';
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

  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

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

  const [historyLoading, setHistoryLoading] = useState(false);
  const [summaries, setSummaries] = useState<DischargeSummary[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);

  const [followUps, setFollowUps] = useState<Patient[]>([]);
  const [followUpsLoading, setFollowUpsLoading] = useState(false);

  const loadConfig = useCallback(async () => {
    const [catRes, protoRes] = await Promise.all([
      supabase.from('service_catalog').select('*').order('sort_order', { ascending: true }),
      supabase.from('surgical_protocols').select('*').order('sort_order', { ascending: true }),
    ]);
    if (catRes.data) {
      setCatalog(catRes.data as ServiceCatalogItem[]);
      try {
        localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catRes.data));
      } catch {
        // ignore
      }
    }
    if (protoRes.data) {
      setProtocols(protoRes.data as SurgicalProtocol[]);
      try {
        localStorage.setItem(PROTOCOLS_CACHE_KEY, JSON.stringify(protoRes.data));
      } catch {
        // ignore
      }
    }
  }, []);

  const loadPatientHistory = useCallback(async (patientId: string) => {
    setHistoryLoading(true);
    const [dsRes, invRes, docRes] = await Promise.all([
      supabase
        .from('discharge_summaries')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false }),
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
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (role !== 'staff' && role !== 'admin') {
    return <PinGate requiredTier="staff" />;
  }

  const today = todayIsoDate();

  const patientTabs = [
    { id: 'invoice' as PatientTab, label: 'Bill', long: 'New Invoice', icon: <Receipt className="h-3.5 w-3.5" /> },
    { id: 'discharge' as PatientTab, label: 'Discharge', long: 'Discharge Summary', icon: <FileText className="h-3.5 w-3.5" /> },
    { id: 'upload' as PatientTab, label: 'Upload', long: 'Upload Rx / Scan', icon: <FileImage className="h-3.5 w-3.5" /> },
    {
      id: 'history' as PatientTab,
      label: `Files (${invoices.length + summaries.length + documents.length})`,
      long: `History (${invoices.length + summaries.length + documents.length})`,
      icon: <History className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="page-shell">
      {/* Compact Workspace Header */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Staff Clinical Desk</p>
          <h1 className="font-display text-2xl font-medium text-ivory-50 sm:text-3xl">
            {selectedPatient && section === 'desk' ? 'Patient Chart' : 'Today’s Desk'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full border border-ivory-50/12 bg-ink-900 p-1 shadow-soft">
            <button
              type="button"
              onClick={() => setSection('desk')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                section === 'desk' ? 'bg-ivory-50 text-ink-900' : 'text-ivory-400 hover:text-ivory-50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Desk
            </button>
            <button
              type="button"
              onClick={() => setSection('followups')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                section === 'followups' ? 'bg-ivory-50 text-ink-900' : 'text-ivory-400 hover:text-ivory-50'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Recalls
            </button>
          </div>

          {selectedPatient && section === 'desk' && (
            <button
              type="button"
              onClick={() => setSelectedPatient(null)}
              className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-ivory-50/15 bg-ink-900 px-3.5 text-xs font-semibold text-ivory-100 shadow-soft hover:border-gold-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">All Patients</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION A: FOLLOW-UPS DUE */}
      {section === 'followups' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="step-badge">Follow-Up Recalls · ±7 Days</span>
            <p className="text-xs text-ivory-400">
              Send 1-tap bilingual WhatsApp reminders directly into the patient&apos;s chat.
            </p>
          </div>

          {followUpsLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
            </div>
          ) : followUps.length === 0 ? (
            <div className="card-surface border-dashed p-10 text-center text-sm text-ivory-400">
              No scheduled follow-ups in this 14-day window.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {followUps.map((p) => {
                const isToday = p.next_follow_up === today;
                const isOverdue = Boolean(p.next_follow_up && p.next_follow_up < today);
                return (
                  <div key={p.id} className="card-surface flex flex-col justify-between gap-3.5 p-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-ivory-50">{p.full_name}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${
                            isToday
                              ? 'bg-ivory-50 text-gold-300'
                              : isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {isToday
                            ? 'TODAY'
                            : isOverdue
                              ? `Overdue · ${formatDisplayDate(p.next_follow_up)}`
                              : formatDisplayDate(p.next_follow_up)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-ivory-400">
                        <span className="rounded bg-ink-850 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-ivory-200">
                          {p.patient_code}
                        </span>
                        <span className="font-medium text-ivory-100">{p.phone}</span>
                        {p.village_address && <span>· {p.village_address}</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => sendFollowUpReminderWhatsApp(p, clinic)}
                        className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-full bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800 transition"
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
                        className="btn-ghost !min-h-[40px] !px-3 text-xs"
                      >
                        Open Chart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION B: PATIENT SEARCH */}
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

      {/* SECTION C: ACTIVE PATIENT CHART */}
      {section === 'desk' && selectedPatient && (
        <div className="min-w-0 max-w-full space-y-5">
          {/* Sleek Compact Patient Identity Banner */}
          <div className="card-surface no-print space-y-3.5 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-semibold text-ivory-50 sm:text-2xl">
                    {selectedPatient.full_name}
                  </h2>
                  <span className="rounded-full border border-gold-400/30 bg-clinic-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-gold-600">
                    MRD: {selectedPatient.patient_code}
                  </span>
                  {selectedPatient.allergies && selectedPatient.allergies.toUpperCase() !== 'NKDA' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-800">
                      <AlertCircle className="h-3 w-3" /> {selectedPatient.allergies}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-ivory-300">
                  <span>
                    {selectedPatient.age ? `${selectedPatient.age}y` : '—'} / {selectedPatient.sex || '—'}
                  </span>
                  <a
                    href={`tel:${selectedPatient.phone}`}
                    className="inline-flex items-center gap-1 font-semibold text-ivory-50 hover:text-gold-500"
                  >
                    <Phone className="h-3 w-3 text-gold-500" />
                    {selectedPatient.phone}
                  </a>
                  {selectedPatient.village_address && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-ivory-400" />
                      {selectedPatient.village_address}
                    </span>
                  )}
                  {selectedPatient.next_follow_up && (
                    <span className="inline-flex items-center gap-1 font-semibold text-gold-600">
                      <Calendar className="h-3 w-3" />
                      {formatDisplayDate(selectedPatient.next_follow_up)}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingPatient(selectedPatient);
                  setPatientModalOpen(true);
                }}
                className="inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full border border-ivory-50/15 bg-ink-950 px-3.5 text-xs font-semibold text-ivory-100 hover:border-gold-400"
              >
                <Pencil className="h-3.5 w-3.5 text-gold-500" />
                <span className="hidden sm:inline">Edit / MRD</span>
                <span className="sm:hidden">Edit</span>
              </button>
            </div>

            <div className="scroll-tabs border-t border-ivory-50/[0.08] pt-3">
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
              onPatientUpdated={(updated) => setSelectedPatient(updated)}
              onCreated={(ds) => {
                setSummaries((prev) => [ds, ...prev]);
                if (ds.follow_up_1) {
                  setSelectedPatient((prev) =>
                    prev ? { ...prev, next_follow_up: ds.follow_up_1 } : prev,
                  );
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
                <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
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
