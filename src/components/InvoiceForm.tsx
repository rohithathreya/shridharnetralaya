import { useCallback, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  Mic,
  Minus,
  Plus,
  Printer,
  Search,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatINR } from '../lib/dates';
import { runAiExtract, useVoiceRecorder } from '../lib/aiExtract';
import { shareInvoiceOnWhatsApp } from '../lib/whatsapp';
import { PrintableInvoice } from './PrintableInvoice';
import { CustomSelect, CustomSelectOption } from './CustomSelect';
import type {
  ClinicSettings,
  Invoice,
  InvoiceLineItem,
  Patient,
  PaymentMode,
  ServiceCatalogItem,
  ServiceCategory,
} from '../types/database';

const CATEGORIES: ServiceCategory[] = ['Consultation', 'Diagnostic', 'Procedure', 'Surgery', 'Optical', 'Other'];

const STANDARD_SURGICAL_HEADS: Array<{ name: string; category: ServiceCategory }> = [
  { name: 'Bed charges', category: 'Surgery' },
  { name: 'Nursing charges', category: 'Surgery' },
  { name: 'Asst charges', category: 'Surgery' },
  { name: 'Professional charges', category: 'Surgery' },
  { name: 'Intra ocular lens', category: 'Surgery' },
  { name: 'Anesthetist', category: 'Surgery' },
  { name: 'Anesthesia', category: 'Surgery' },
  { name: 'OT charges', category: 'Surgery' },
  { name: 'OT drugs and implants', category: 'Surgery' },
  { name: 'Others', category: 'Other' },
];

const PAYMENT_MODE_OPTIONS: CustomSelectOption[] = [
  { value: 'Cash', label: 'Cash', sublabel: 'Direct cash at reception' },
  { value: 'UPI', label: 'UPI / QR Code', sublabel: 'GPay / PhonePe / Paytm' },
  { value: 'Card', label: 'Card (POS)', sublabel: 'Debit / Credit card' },
  { value: 'TPA / Scheme', label: 'TPA / Insurance Scheme', sublabel: 'Cashless / Reimbursement' },
];

interface InvoiceFormProps {
  patient: Patient;
  clinic: ClinicSettings;
  catalog: ServiceCatalogItem[];
  onCreated: (invoice: Invoice) => void;
}

export function InvoiceForm({ patient, clinic, catalog, onCreated }: InvoiceFormProps) {
  const [activeCat, setActiveCat] = useState<ServiceCategory | 'All'>('All');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [ipdNo, setIpdNo] = useState('');
  const [tpaName, setTpaName] = useState('');
  const [policyNo, setPolicyNo] = useState('');
  const [notes, setNotes] = useState('');
  const [createdBy, setCreatedBy] = useState('Reception');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  const handleVoiceComplete = useCallback(
    async (base64: string, mimeType: string) => {
      setAiLoading(true);
      setAiMessage('Extracting bill items from voice…');
      setError('');
      try {
        const activeCatalog = catalog
          .filter((c) => c.is_active)
          .map((c) => ({ name: c.name, category: c.category, default_price: c.default_price }));

        const { extracted, warnings } = await runAiExtract({
          target: 'invoice',
          mode: 'audio',
          mimeType,
          base64,
          catalog: activeCatalog,
        });

        if (Array.isArray(extracted.items) && extracted.items.length > 0) {
          const parsed: InvoiceLineItem[] = extracted.items.map((raw: any) => {
            const qty = Math.max(1, Number(raw.qty) || 1);
            const unit_price = Math.max(0, Number(raw.unit_price) || 0);
            return {
              name: String(raw.name || 'Service'),
              category: String(raw.category || 'Procedure'),
              qty,
              unit_price,
              amount: qty * unit_price,
            };
          });
          setItems((prev) => [...prev, ...parsed]);
        }

        if (typeof extracted.discount === 'number' && extracted.discount > 0) {
          setDiscount(String(extracted.discount));
        }
        const pm = String(extracted.payment_mode || '');
        if (['Cash', 'UPI', 'Card', 'TPA / Scheme'].includes(pm)) {
          setPaymentMode(pm as PaymentMode);
        }
        if (typeof extracted.payment_ref === 'string' && extracted.payment_ref.trim()) {
          setPaymentRef(extracted.payment_ref.trim());
        }
        if (typeof extracted.notes === 'string' && extracted.notes.trim()) {
          setNotes(extracted.notes.trim());
        }

        setAiMessage(
          warnings.length > 0
            ? `Voice items added (${warnings.join(' · ')})`
            : 'Voice items added. Review quantities and total before saving.',
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Voice billing extraction failed');
        setAiMessage('');
      } finally {
        setAiLoading(false);
      }
    },
    [catalog],
  );

  const voice = useVoiceRecorder(handleVoiceComplete);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((c) => {
      if (!c.is_active) return false;
      if (activeCat !== 'All' && c.category !== activeCat) return false;
      if (catalogSearch.trim() && !c.name.toLowerCase().includes(catalogSearch.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [catalog, activeCat, catalogSearch]);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.amount, 0), [items]);
  const discountNum = Math.max(0, Math.min(subtotal, parseInt(discount || '0', 10) || 0));
  const total = Math.max(0, subtotal - discountNum);

  const previewInvoice: Invoice = useMemo(
    () => ({
      id: 'preview',
      invoice_no: 'INV-PREVIEW',
      ipd_no: ipdNo.trim(),
      tpa_name: tpaName.trim(),
      policy_no: policyNo.trim(),
      patient_id: patient.id,
      items,
      subtotal,
      discount: discountNum,
      total,
      payment_mode: paymentMode,
      payment_ref: paymentRef.trim(),
      notes: notes.trim(),
      status: 'active',
      void_reason: null,
      voided_at: null,
      share_token: '',
      created_by: createdBy.trim() || 'Reception',
      created_at: new Date().toISOString(),
    }),
    [ipdNo, tpaName, policyNo, patient.id, items, subtotal, discountNum, total, paymentMode, paymentRef, notes, createdBy],
  );

  function addCatalogItem(svc: ServiceCatalogItem) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.name === svc.name);
      if (idx >= 0) {
        const next = [...prev];
        const qty = next[idx].qty + 1;
        next[idx] = { ...next[idx], qty, amount: qty * next[idx].unit_price };
        return next;
      }
      return [
        ...prev,
        {
          name: svc.name,
          category: svc.category,
          qty: 1,
          unit_price: svc.default_price,
          amount: svc.default_price,
        },
      ];
    });
  }

  function decrementByName(name: string) {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.name === name);
      if (idx < 0) return prev;
      if (prev[idx].qty <= 1) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      const qty = next[idx].qty - 1;
      next[idx] = { ...next[idx], qty, amount: qty * next[idx].unit_price };
      return next;
    });
  }

  function addCustomItem() {
    const price = parseInt(customPrice, 10) || 0;
    if (!customName.trim() || price < 0) return;
    setItems((prev) => [
      ...prev,
      {
        name: customName.trim(),
        category: activeCat === 'All' ? 'Procedure' : activeCat,
        qty: 1,
        unit_price: price,
        amount: price,
      },
    ]);
    setCustomName('');
    setCustomPrice('');
  }

  function updateItem(idx: number, field: 'qty' | 'unit_price', raw: string) {
    const val = Math.max(field === 'qty' ? 1 : 0, parseInt(raw, 10) || 0);
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const qty = field === 'qty' ? val : it.qty;
        const unit_price = field === 'unit_price' ? val : it.unit_price;
        return { ...it, qty, unit_price, amount: qty * unit_price };
      }),
    );
  }

  function updateItemPriceByName(name: string, raw: string) {
    const unit_price = Math.max(0, parseInt(raw, 10) || 0);
    setItems((prev) =>
      prev.map((it) => (it.name === name ? { ...it, unit_price, amount: it.qty * unit_price } : it)),
    );
  }

  function loadSurgicalHeads() {
    setItems((prev) => {
      const existingNames = new Set(prev.map((x) => x.name.toLowerCase()));
      const additions: InvoiceLineItem[] = STANDARD_SURGICAL_HEADS.filter(
        (h) => !existingNames.has(h.name.toLowerCase()),
      ).map((h) => ({
        name: h.name,
        category: h.category,
        qty: 1,
        unit_price: 0,
        amount: 0,
      }));
      return [...prev, ...additions];
    });
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    const activeItems = items.filter((it) => it.amount > 0);
    if (activeItems.length === 0) {
      setError('Enter an amount for at least one item to generate a receipt.');
      return;
    }
    setSaving(true);
    setError('');

    const { data, error: insErr } = await supabase
      .from('invoices')
      .insert({
        patient_id: patient.id,
        ipd_no: ipdNo.trim(),
        tpa_name: tpaName.trim(),
        policy_no: policyNo.trim(),
        items: activeItems,
        subtotal,
        discount: discountNum,
        total,
        payment_mode: paymentMode,
        payment_ref: paymentRef.trim(),
        notes: notes.trim(),
        created_by: createdBy.trim() || 'Reception',
      })
      .select()
      .single();

    setSaving(false);
    if (insErr || !data) {
      setError(insErr?.message || 'Failed to save invoice');
      return;
    }

    const inv = data as Invoice;
    setSavedInvoice(inv);
    onCreated(inv);
  }

  if (savedInvoice) {
    return (
      <div className="space-y-4">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-300 bg-emerald-50/90 p-5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            <div>
              <div className="text-sm font-bold text-emerald-950">
                Receipt {savedInvoice.invoice_no} Saved ({formatINR(savedInvoice.total)})
              </div>
              <div className="text-xs text-emerald-800">
                {patient.full_name} · MRD: {patient.patient_code}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="btn-primary !min-h-[40px] text-xs">
              <Printer className="h-4 w-4" /> Print Receipt
            </button>
            <button
              type="button"
              onClick={() => shareInvoiceOnWhatsApp(patient, savedInvoice, clinic)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() => {
                setSavedInvoice(null);
                setItems([]);
                setDiscount('0');
                setPaymentRef('');
                setNotes('');
              }}
              className="btn-ghost !min-h-[40px] text-xs"
            >
              New Bill
            </button>
          </div>
        </div>

        <PrintableInvoice clinic={clinic} patient={patient} invoice={savedInvoice} />
      </div>
    );
  }

  return (
    <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-12">
      {/* LEFT PANE: POS SERVICE PICKER & PAYMENT (7 cols) */}
      <div className="no-print min-w-0 space-y-4 xl:col-span-7">
        {/* Obsidian Voice Billing Bar */}
        <div className="card-obsidian flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-300">
              Itemized Cash & TPA Billing
            </p>
            <h3 className="mt-0.5 font-display text-xl text-white">Quick POS & Voice Bill</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadSurgicalHeads}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Plus className="h-3.5 w-3.5 text-gold-300" />
              10-Head Surgical Sheet
            </button>

            <button
              type="button"
              disabled={aiLoading}
              onClick={voice.toggle}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                voice.recording
                  ? 'animate-pulse bg-red-600 text-white'
                  : 'bg-gold-400 text-white hover:bg-gold-300'
              }`}
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : voice.recording ? (
                <Square className="h-3.5 w-3.5" />
              ) : (
                <Mic className="h-3.5 w-3.5" />
              )}
              <span>{voice.recording ? `Stop (${voice.elapsedSec}s)` : 'Voice Fill Bill'}</span>
            </button>
          </div>

          {(aiMessage || voice.micError) && (
            <div className="flex w-full items-start gap-2 rounded-2xl border border-gold-300/30 bg-white/[0.07] p-3 text-xs text-white/90">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" />
              <span>{voice.micError || aiMessage}</span>
            </div>
          )}
        </div>

        {/* Service Catalog Picker */}
        <div className="card-surface space-y-3.5 p-4 sm:p-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-400" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Filter services (Phaco, OPD, A-Scan, YAG)…"
              className="input-field !min-h-[44px] pl-10 text-xs"
            />
          </div>

          {/* Horizontal Category Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(['All', ...CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeCat === cat
                    ? 'bg-ivory-50 text-ink-900 shadow-soft'
                    : 'border border-ivory-50/12 bg-ink-950 text-ivory-300 hover:border-gold-400/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid max-h-80 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-2">
            {filteredCatalog.map((svc) => {
              const inBill = items.find((x) => x.name === svc.name);
              return (
                <div
                  key={svc.id}
                  className={`flex flex-col gap-2 rounded-2xl border p-3 transition ${
                    inBill
                      ? 'border-gold-400 bg-clinic-50/80 shadow-soft'
                      : 'border-ivory-50/10 bg-ink-950 hover:border-gold-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => addCatalogItem(svc)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-xs font-semibold text-ivory-50">{svc.name}</span>
                      <span className="text-[10.5px] text-ivory-400">
                        {svc.category} · <strong className="text-ivory-100">{formatINR(svc.default_price)}</strong>
                      </span>
                    </button>

                    {inBill ? (
                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-ivory-50 p-0.5 text-ink-900">
                        <button
                          type="button"
                          onClick={() => decrementByName(svc.name)}
                          className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/15"
                          aria-label="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[1.25rem] text-center text-xs font-bold">{inBill.qty}</span>
                        <button
                          type="button"
                          onClick={() => addCatalogItem(svc)}
                          className="grid h-6 w-6 place-items-center rounded-full hover:bg-white/15"
                          aria-label="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addCatalogItem(svc)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ivory-50/15 bg-ink-900 text-ivory-100 hover:bg-ivory-50 hover:text-ink-900 transition"
                        aria-label="Add"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {inBill && (
                    <div className="flex items-center justify-between gap-2 border-t border-gold-400/20 pt-2">
                      <span className="text-[10.5px] font-semibold text-ivory-400">Custom Rate (₹)</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          value={inBill.unit_price}
                          onChange={(e) => updateItemPriceByName(svc.name, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Price for ${svc.name}`}
                          className="w-24 rounded-xl border border-gold-400/40 bg-ink-900 px-2.5 py-1 text-right text-xs font-bold text-ivory-50 focus:border-gold-500 focus:outline-none"
                        />
                        <span className="text-[11px] font-bold text-gold-600 tabular-nums">
                          = {formatINR(inBill.amount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-ivory-50/10 pt-3">
            <label className="label-field">Custom Item / IOL Implant / Consumable</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Imported Hydrophobic IOL (SN 99421)"
                className="input-field !min-h-[42px] min-w-0 w-full text-xs"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Rate ₹"
                  className="input-field !min-h-[42px] flex-1 text-xs sm:w-28"
                />
                <button type="button" onClick={addCustomItem} className="btn-ghost !min-h-[42px] shrink-0 text-xs">
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Line Items & Checkout */}
        <div id="invoice-checkout" className="card-surface space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-lg font-medium text-ivory-50">
              Line Items ({items.length})
            </h4>
            <span className="font-display text-xl font-semibold text-gold-600">{formatINR(total)}</span>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-ivory-50/10 bg-ink-950 p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-ivory-50">{it.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-ivory-400">
                      <label className="inline-flex items-center gap-1">
                        Qty:
                        <input
                          type="number"
                          min={1}
                          value={it.qty}
                          onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                          className="w-12 rounded-lg border border-ivory-50/15 bg-ink-900 px-1.5 py-0.5 text-center font-bold text-ivory-50"
                        />
                      </label>
                      <label className="inline-flex items-center gap-1">
                        Rate:
                        <input
                          type="number"
                          min={0}
                          value={it.unit_price}
                          onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                          className="w-20 rounded-lg border border-ivory-50/15 bg-ink-900 px-1.5 py-0.5 text-right font-bold text-ivory-50"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ivory-50">{formatINR(it.amount)}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-600 hover:text-red-700">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <CustomSelect
              label="Payment Mode"
              value={paymentMode}
              onChange={(val) => setPaymentMode(val as PaymentMode)}
              options={PAYMENT_MODE_OPTIONS}
            />
            <div>
              <label className="label-field">Discount (₹)</label>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="input-field !min-h-[46px] text-xs font-bold"
              />
            </div>
            <div>
              <label className="label-field">UTR / Ref / Claim ID</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Optional"
                className="input-field !min-h-[46px] text-xs"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="label-field">IPD No. (Optional)</label>
              <input value={ipdNo} onChange={(e) => setIpdNo(e.target.value.toUpperCase())} placeholder="IPD-26-XXXX" className="input-field !min-h-[42px] font-mono text-xs uppercase" />
            </div>
            <div>
              <label className="label-field">Billed By</label>
              <input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} className="input-field !min-h-[42px] text-xs" />
            </div>
            <div>
              <label className="label-field">Remarks</label>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="input-field !min-h-[42px] text-xs" />
            </div>
          </div>

          {paymentMode === 'TPA / Scheme' && (
            <div className="grid gap-3 rounded-2xl border border-gold-400/30 bg-clinic-50/70 p-3.5 sm:grid-cols-2">
              <div>
                <label className="label-field">TPA / Scheme Name</label>
                <input value={tpaName} onChange={(e) => setTpaName(e.target.value)} placeholder="Star Health / AB-ArK" className="input-field !min-h-[40px] text-xs" />
              </div>
              <div>
                <label className="label-field">Policy / Beneficiary No.</label>
                <input value={policyNo} onChange={(e) => setPolicyNo(e.target.value)} placeholder="Policy / Card ID" className="input-field !min-h-[40px] text-xs" />
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={saving || items.length === 0}
            onClick={handleSave}
            className="btn-primary w-full"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save & Print Receipt ({formatINR(total)})
          </button>
        </div>
      </div>

      {/* RIGHT PANE: LIVE RECEIPT PREVIEW */}
      <div className="hidden xl:col-span-5 xl:block">
        <div className="sticky top-20 space-y-2.5">
          <div className="no-print rounded-2xl border border-ivory-50/10 bg-ink-900 px-4 py-2.5 text-xs font-semibold text-ivory-200 shadow-soft">
            Live Itemized Receipt Preview
          </div>
          <PrintableInvoice clinic={clinic} patient={patient} invoice={previewInvoice} />
        </div>
      </div>

      {/* MOBILE FLOATING TOTAL BAR */}
      {items.length > 0 && (
        <div className="mobile-float-dock">
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gold-300">
                {items.length} item(s) · {paymentMode}
              </div>
              <div className="font-display text-lg font-semibold text-white">{formatINR(total)}</div>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-[#FBF9F6] px-5 text-xs font-bold text-[#141210] active:scale-[0.97] transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
