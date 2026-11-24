import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  Download,
  IndianRupee,
  KeyRound,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDisplayDateTime, formatINR, todayIsoDate } from '../lib/dates';
import { PinGate } from '../components/PinGate';
import type {
  ClinicSettings,
  Invoice,
  ServiceCatalogItem,
  ServiceCategory,
} from '../types/database';

type AdminTab = 'collections' | 'catalog' | 'settings';
type DateRange = 'today' | 'week' | 'month' | 'all';

const CATEGORIES: ServiceCategory[] = ['Consultation', 'Diagnostic', 'Procedure', 'Surgery', 'Optical', 'Other'];

export function AdminDashboard() {
  const { role, loading, clinic, refreshClinic } = useAuth();
  const [tab, setTab] = useState<AdminTab>('collections');

  const [range, setRange] = useState<DateRange>('today');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invLoading, setInvLoading] = useState(false);
  const [voidModalInv, setVoidModalInv] = useState<Invoice | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcCat, setNewSvcCat] = useState<ServiceCategory>('Procedure');
  const [newSvcPrice, setNewSvcPrice] = useState('');

  const [settingsForm, setSettingsForm] = useState<ClinicSettings>(clinic);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const [newStaffPin, setNewStaffPin] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  useEffect(() => {
    setSettingsForm(clinic);
  }, [clinic]);

  const loadInvoices = useCallback(async () => {
    setInvLoading(true);
    let q = supabase
      .from('invoices')
      .select('*, patients(patient_code, full_name, phone, village_address)')
      .order('created_at', { ascending: false })
      .limit(500);

    const now = new Date();
    if (range === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      q = q.gte('created_at', start);
    } else if (range === 'week') {
      const start = new Date(now.getTime() - 7 * 86400 * 1000).toISOString();
      q = q.gte('created_at', start);
    } else if (range === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      q = q.gte('created_at', start);
    }

    const { data } = await q;
    setInvoices((data as Invoice[]) || []);
    setInvLoading(false);
  }, [range]);

  const loadCatalog = useCallback(async () => {
    const { data } = await supabase
      .from('service_catalog')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setCatalog(data as ServiceCatalogItem[]);
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      loadInvoices();
      loadCatalog();
    }
  }, [role, loadInvoices, loadCatalog]);

  const stats = useMemo(() => {
    const active = invoices.filter((i) => i.status === 'active');
    const voided = invoices.filter((i) => i.status === 'voided');
    const byMode = { Cash: 0, UPI: 0, Card: 0, 'TPA / Scheme': 0 };
    let total = 0;
    for (const inv of active) {
      total += inv.total;
      if (inv.payment_mode in byMode) {
        byMode[inv.payment_mode as keyof typeof byMode] += inv.total;
      }
    }
    return { total, activeCount: active.length, voidedCount: voided.length, byMode };
  }, [invoices]);

  function exportCsv() {
    const headers = [
      'Invoice No',
      'Date',
      'MRD No',
      'Patient Name',
      'Phone',
      'Items',
      'Subtotal',
      'Discount',
      'Total',
      'Payment Mode',
      'Ref',
      'Status',
      'Void Reason',
    ];
    const rows = invoices.map((inv) => [
      inv.invoice_no,
      formatDisplayDateTime(inv.created_at),
      inv.patients?.patient_code || '',
      inv.patients?.full_name || '',
      inv.patients?.phone || '',
      inv.items.map((x) => `${x.name} x${x.qty}`).join('; '),
      inv.subtotal,
      inv.discount,
      inv.total,
      inv.payment_mode,
      inv.payment_ref,
      inv.status,
      inv.void_reason || '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shridhar-netralaya-collections-${range}-${todayIsoDate()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function confirmVoid() {
    if (!voidModalInv || voidReason.trim().length < 3) return;
    setVoiding(true);
    const { error } = await supabase.rpc('void_invoice', {
      p_invoice_id: voidModalInv.id,
      p_reason: voidReason.trim(),
    });
    setVoiding(false);
    if (!error) {
      setVoidModalInv(null);
      setVoidReason('');
      loadInvoices();
    }
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!newSvcName.trim()) return;
    await supabase.from('service_catalog').insert({
      name: newSvcName.trim(),
      category: newSvcCat,
      default_price: parseInt(newSvcPrice || '0', 10) || 0,
      sort_order: catalog.length * 10 + 10,
    });
    setNewSvcName('');
    setNewSvcPrice('');
    loadCatalog();
  }

  async function updateServicePrice(id: string, price: number) {
    await supabase.from('service_catalog').update({ default_price: Math.max(0, price) }).eq('id', id);
    loadCatalog();
  }

  async function toggleServiceActive(id: string, isActive: boolean) {
    await supabase.from('service_catalog').update({ is_active: !isActive }).eq('id', id);
    loadCatalog();
  }

  async function saveClinicSettings(e: React.FormEvent) {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg('');
    const { error } = await supabase
      .from('clinic_settings')
      .update({
        clinic_name: settingsForm.clinic_name,
        tagline: settingsForm.tagline,
        doctor_name: settingsForm.doctor_name,
        doctor_qualification: settingsForm.doctor_qualification,
        doctor_kmc_no: settingsForm.doctor_kmc_no,
        kpme_reg_no: settingsForm.kpme_reg_no,
        rohini_id: settingsForm.rohini_id || '',
        address: settingsForm.address,
        phone: settingsForm.phone,
        emergency_phone: settingsForm.emergency_phone,
        timings: settingsForm.timings,
        default_head_bath_days: settingsForm.default_head_bath_days,
        google_maps_url: settingsForm.google_maps_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);

    setSavingSettings(false);
    if (error) {
      setSettingsMsg(`Error: ${error.message}`);
    } else {
      await refreshClinic();
      setSettingsMsg('Clinic settings updated across website, invoices & discharge summaries.');
    }
  }

  async function rotatePin(targetRole: 'staff' | 'admin', pinVal: string) {
    if (pinVal.trim().length < 4) {
      setPinMsg('PIN must be at least 4 characters.');
      return;
    }
    setPinMsg('');
    const { error } = await supabase.rpc('update_clinic_pin', {
      p_target_role: targetRole,
      p_new_pin: pinVal.trim(),
    });
    if (error) {
      setPinMsg(`Error: ${error.message}`);
    } else {
      setPinMsg(`${targetRole.toUpperCase()} access code rotated successfully.`);
      if (targetRole === 'staff') setNewStaffPin('');
      else setNewAdminPin('');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (role !== 'admin') {
    return <PinGate requiredTier="admin" />;
  }

  return (
    <div className="page-shell space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Hospital Administration</p>
          <h1 className="mt-1 font-display text-3xl font-medium text-ivory-50 sm:text-4xl">
            Collections & Settings
          </h1>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: 'collections', label: 'Collections', icon: <IndianRupee className="h-3.5 w-3.5" /> },
              { id: 'catalog', label: 'Prices', icon: <ListChecks className="h-3.5 w-3.5" /> },
              { id: 'settings', label: 'Clinic & PINs', icon: <Settings className="h-3.5 w-3.5" /> },
            ] as { id: AdminTab; label: string; icon: React.ReactNode }[]
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition ${
                tab === t.id
                  ? 'bg-ivory-50 text-ink-900 shadow-lift'
                  : 'border border-ivory-50/15 bg-ink-900 text-ivory-400 hover:text-ivory-50'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* TAB 1: COLLECTIONS */}
      {tab === 'collections' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'week', label: 'Last 7 Days' },
                  { id: 'month', label: 'This Month' },
                  { id: 'all', label: 'All Time' },
                ] as { id: DateRange; label: string }[]
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRange(r.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    range === r.id
                      ? 'bg-gold-400 text-white shadow-soft'
                      : 'border border-ivory-50/12 bg-ink-900 text-ivory-300'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button type="button" onClick={exportCsv} className="btn-ghost !min-h-[38px] !px-4 text-xs">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="card-obsidian p-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold-300">
                Total Collected
              </div>
              <div className="mt-2 font-display text-3xl font-semibold text-white">{formatINR(stats.total)}</div>
              <div className="mt-1 text-xs text-white/65">
                {stats.activeCount} active · {stats.voidedCount} voided
              </div>
            </div>
            {(['Cash', 'UPI', 'Card', 'TPA / Scheme'] as const).map((m) => (
              <div key={m} className="card-surface p-5">
                <div className="text-xs font-medium text-ivory-400">{m}</div>
                <div className="mt-2 font-display text-2xl font-semibold text-ivory-50">
                  {formatINR(stats.byMode[m])}
                </div>
              </div>
            ))}
          </div>

          <div className="card-surface overflow-x-auto">
            {invLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-8 text-center text-sm text-ivory-400">No invoices in this period.</div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-ivory-50/10 bg-ink-850/70 text-[11px] font-semibold uppercase tracking-wider text-ivory-400">
                  <tr>
                    <th className="px-4 py-3">Receipt</th>
                    <th className="px-4 py-3">Patient / MRD</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3">Mode</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-50/10">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className={inv.status === 'voided' ? 'bg-red-50/50 text-ivory-400' : ''}>
                      <td className="px-4 py-3">
                        <div className="font-bold text-ivory-50">{inv.invoice_no}</div>
                        <div className="text-[11px] text-ivory-400">{formatDisplayDateTime(inv.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ivory-100">{inv.patients?.full_name}</div>
                        <div className="font-mono text-[11px] text-ivory-400">
                          {inv.patients?.patient_code} · {inv.patients?.phone}
                        </div>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-ivory-300">
                        {inv.items.map((x) => x.name).join(', ')}
                      </td>
                      <td className="px-4 py-3 font-medium text-ivory-200">{inv.payment_mode}</td>
                      <td className="px-4 py-3 text-right font-bold text-ivory-50">
                        {inv.status === 'voided' ? (
                          <span className="text-red-700 line-through">{formatINR(inv.total)}</span>
                        ) : (
                          formatINR(inv.total)
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => setVoidModalInv(inv)}
                            className="inline-flex items-center gap-1 rounded-full border border-red-300 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
                          >
                            <Ban className="h-3 w-3" /> Void
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-red-700" title={inv.void_reason || ''}>
                            VOIDED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SERVICE CATALOG */}
      {tab === 'catalog' && (
        <div className="space-y-4">
          <form onSubmit={addService} className="card-surface flex flex-wrap items-end gap-3 p-5">
            <div className="min-w-[200px] flex-1">
              <label className="label-field">New Service / Surgery Name</label>
              <input
                type="text"
                required
                value={newSvcName}
                onChange={(e) => setNewSvcName(e.target.value)}
                placeholder="e.g. OCT Macula Scan"
                className="input-field !min-h-[42px] text-xs"
              />
            </div>
            <div>
              <label className="label-field">Category</label>
              <select
                value={newSvcCat}
                onChange={(e) => setNewSvcCat(e.target.value as ServiceCategory)}
                className="input-field !min-h-[42px] text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className="label-field">Price (₹)</label>
              <input
                type="number"
                required
                min={0}
                value={newSvcPrice}
                onChange={(e) => setNewSvcPrice(e.target.value)}
                placeholder="1500"
                className="input-field !min-h-[42px] text-xs font-bold"
              />
            </div>
            <button type="submit" className="btn-primary !min-h-[42px] text-xs">
              <Plus className="h-4 w-4" /> Add Service
            </button>
          </form>

          <div className="card-surface overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-ivory-50/10 bg-ink-850/70 text-[11px] font-semibold uppercase tracking-wider text-ivory-400">
                <tr>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Default Price (₹)</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-50/10">
                {catalog.map((svc) => (
                  <tr key={svc.id} className={!svc.is_active ? 'opacity-50' : ''}>
                    <td className="px-4 py-2.5 font-semibold text-ivory-50">{svc.name}</td>
                    <td className="px-4 py-2.5 text-ivory-400">{svc.category}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        defaultValue={svc.default_price}
                        onBlur={(e) => {
                          const v = parseInt(e.target.value, 10);
                          if (!Number.isNaN(v) && v !== svc.default_price) {
                            updateServicePrice(svc.id, v);
                          }
                        }}
                        className="w-24 rounded-xl border border-ivory-50/15 bg-ink-950 px-2.5 py-1 font-bold text-ivory-50"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => toggleServiceActive(svc.id, svc.is_active)}
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                          svc.is_active
                            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                            : 'bg-ink-850 text-ivory-400'
                        }`}
                      >
                        {svc.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CLINIC DETAILS & PINS */}
      {tab === 'settings' && (
        <div className="grid gap-5 lg:grid-cols-12">
          <form onSubmit={saveClinicSettings} className="card-surface space-y-4 p-6 lg:col-span-7">
            <div>
              <h3 className="font-display text-xl text-ivory-50">Clinic & Registration Credentials</h3>
              <p className="mt-0.5 text-xs text-ivory-400">
                Stamped automatically on the public website, A4 discharge summaries, and TPA receipts.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-field">Clinic Name</label>
                <input
                  value={settingsForm.clinic_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, clinic_name: e.target.value })}
                  className="input-field !min-h-[42px] text-xs"
                />
              </div>
              <div>
                <label className="label-field">KPME Registration No.</label>
                <input
                  value={settingsForm.kpme_reg_no}
                  onChange={(e) => setSettingsForm({ ...settingsForm, kpme_reg_no: e.target.value })}
                  placeholder="e.g. RMG00123ALOP"
                  className="input-field !min-h-[42px] text-xs"
                />
              </div>
              <div>
                <label className="label-field">ROHINI ID (Insurance TPAs)</label>
                <input
                  value={settingsForm.rohini_id || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, rohini_id: e.target.value })}
                  placeholder="13-digit IIB ROHINI ID"
                  className="input-field !min-h-[42px] font-mono text-xs"
                />
              </div>
              <div>
                <label className="label-field">Doctor KMC Reg. No.</label>
                <input
                  value={settingsForm.doctor_kmc_no}
                  onChange={(e) => setSettingsForm({ ...settingsForm, doctor_kmc_no: e.target.value })}
                  placeholder="e.g. KMC-45678"
                  className="input-field !min-h-[42px] text-xs"
                />
              </div>
              <div>
                <label className="label-field">Doctor Name</label>
                <input
                  value={settingsForm.doctor_name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, doctor_name: e.target.value })}
                  className="input-field !min-h-[42px] text-xs"
                />
              </div>
              <div>
                <label className="label-field">Doctor Qualification</label>
                <input
                  value={settingsForm.doctor_qualification}
                  onChange={(e) => setSettingsForm({ ...settingsForm, doctor_qualification: e.target.value })}
                  className="input-field !min-h-[42px] text-xs"
                />
              </div>
              <div>
                <label className="label-field">Reception / WhatsApp Phone</label>
                <input
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="input-field !min-h-[42px] text-xs"
                />
              </div>
              <div>
                <label className="label-field">24/7 Emergency Helpline</label>
                <input
                  value={settingsForm.emergency_phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, emergency_phone: e.target.value })}
                  className="input-field !min-h-[42px] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="label-field">Full Address</label>
              <input
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="input-field !min-h-[42px] text-xs"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="label-field">Clinic Timings</label>
                <input
                  value={settingsForm.timings}
                  onChange={(e) => setSettingsForm({ ...settingsForm, timings: e.target.value })}
                  className="input-field !min-h-[42px] text-xs"
                />
              </div>
              <div>
                <label className="label-field">Head-Bath Days</label>
                <input
                  type="number"
                  value={settingsForm.default_head_bath_days}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      default_head_bath_days: parseInt(e.target.value, 10) || 14,
                    })
                  }
                  className="input-field !min-h-[42px] text-xs font-bold"
                />
              </div>
            </div>

            {settingsMsg && (
              <div className="flex items-center gap-1.5 rounded-2xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-900">
                <CheckCircle2 className="h-4 w-4" /> {settingsMsg}
              </div>
            )}

            <button type="submit" disabled={savingSettings} className="btn-primary !min-h-[44px] text-xs">
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Clinic Details
            </button>
          </form>

          <div className="card-surface space-y-4 p-6 lg:col-span-5">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-gold-500" />
              <h3 className="font-display text-xl text-ivory-50">Rotate Access PINs</h3>
            </div>
            <p className="text-xs leading-relaxed text-ivory-400">
              PINs are bcrypt-hashed in Postgres and verified server-side. Rotate immediately after setup or whenever staff changes.
            </p>

            <div className="space-y-2 rounded-2xl border border-ivory-50/10 bg-ink-950 p-4">
              <label className="label-field">New Staff Desk PIN (4–12 chars)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value)}
                  placeholder="Enter new staff PIN"
                  className="input-field !min-h-[40px] flex-1 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => rotatePin('staff', newStaffPin)}
                  className="rounded-full bg-ivory-50 px-4 py-2 text-xs font-semibold text-ink-900 hover:bg-gold-500 hover:text-white transition"
                >
                  Update
                </button>
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-ivory-50/10 bg-ink-950 p-4">
              <label className="label-field">New Admin PIN (4–12 chars)</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={newAdminPin}
                  onChange={(e) => setNewAdminPin(e.target.value)}
                  placeholder="Enter new admin PIN"
                  className="input-field !min-h-[40px] flex-1 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => rotatePin('admin', newAdminPin)}
                  className="rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 transition"
                >
                  Update
                </button>
              </div>
            </div>

            {pinMsg && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-950">
                {pinMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {voidModalInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ivory-50/50 p-4 backdrop-blur-md">
          <div className="card-surface w-full max-w-md space-y-4 p-6 shadow-lift">
            <h3 className="font-display text-xl font-semibold text-ivory-50">
              Void Receipt {voidModalInv.invoice_no}?
            </h3>
            <p className="text-xs leading-relaxed text-ivory-300">
              Receipts are never deleted for audit integrity. Voiding removes {formatINR(voidModalInv.total)} from active collections and stamps a VOID watermark.
            </p>
            <input
              type="text"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Mandatory reason (e.g. Wrong amount / Duplicate)"
              className="input-field text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setVoidModalInv(null);
                  setVoidReason('');
                }}
                className="btn-ghost !min-h-[40px] text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={voiding || voidReason.trim().length < 3}
                onClick={confirmVoid}
                className="rounded-full bg-red-700 px-5 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {voiding ? 'Voiding…' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
