import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Loader2,
  MessageCircle,
  Mic,
  Plus,
  Printer,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatINR } from '../lib/dates';
import { runAiExtract, useVoiceRecorder } from '../lib/aiExtract';
import {
  BILL_HEADS,
  BillHead,
  groupItemsByBillHead,
  mapItemToBillHead,
  splitServiceIntoHeads,
} from '../lib/invoiceHeads';
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
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
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

  // Layered Procedure Dropdown state (Layer 1: Category -> Layer 2: Procedures)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<ServiceCategory | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Close layered dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [pickerOpen]);

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
          const parsed: InvoiceLineItem[] = [];
          for (const raw of extracted.items as any[]) {
            const name = String(raw.name || 'Service');
            const qty = Math.max(1, Number(raw.qty) || 1);
            const unit_price = Math.max(0, Number(raw.unit_price) || 0);
            const matchedSvc = catalog.find(
              (c) => c.name.toLowerCase() === name.toLowerCase(),
            );
            if (matchedSvc && unit_price === matchedSvc.default_price) {
              for (let q = 0; q < qty; q++) {
                parsed.push(...splitServiceIntoHeads(matchedSvc));
              }
            } else {
              const rawItem: InvoiceLineItem = {
                name,
                category: String(raw.category || 'Others'),
                qty,
                unit_price,
                amount: qty * unit_price,
              };
              parsed.push({
                ...rawItem,
                category: mapItemToBillHead(rawItem),
              });
            }
          }
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
            : 'Voice items split across bill heads. Review amounts before saving.',
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

  const catalogByCategory = useMemo(() => {
    const map = new Map<ServiceCategory, ServiceCatalogItem[]>();
    for (const cat of CATEGORIES) {
      const list = catalog.filter((c) => c.is_active && c.category === cat);
      if (list.length > 0) map.set(cat, list);
    }
    return map;
  }, [catalog]);

  const groupedByHead = useMemo(() => groupItemsByBillHead(items), [items]);
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
    const splits = splitServiceIntoHeads(svc);
    setItems((prev) => {
      const next = [...prev];
      for (const sp of splits) {
        const idx = next.findIndex((x) => x.name === sp.name && x.category === sp.category);
        if (idx >= 0) {
          const qty = next[idx].qty + 1;
          next[idx] = { ...next[idx], qty, amount: qty * next[idx].unit_price };
        } else {
          next.push(sp);
        }
      }
      return next;
    });
    // Collapse dropdown immediately on selection
    setPickerOpen(false);
    setExpandedCat(null);
  }

  function setDirectHeadAmount(head: BillHead, raw: string) {
    const val = Math.max(0, parseInt(raw, 10) || 0);
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.category === head && it.name === head);
      if (val === 0) {
        return idx >= 0 ? prev.filter((_, i) => i !== idx) : prev;
      }
      if (idx >= 0) {
        return prev.map((it, i) =>
          i === idx ? { ...it, unit_price: val, amount: val } : it,
        );
      }
      return [
        ...prev,
        { name: head, category: head, qty: 1, unit_price: val, amount: val },
      ];
    });
  }

  function updateLineItemPrice(targetItem: InvoiceLineItem, raw: string) {
    const unit_price = Math.max(0, parseInt(raw, 10) || 0);
    setItems((prev) =>
      prev.map((it) =>
        it === targetItem ? { ...it, unit_price, amount: it.qty * unit_price } : it,
      ),
    );
  }

  function removeLineItem(targetItem: InvoiceLineItem) {
    setItems((prev) => prev.filter((it) => it !== targetItem));
  }

  async function handleSave() {
    const activeItems = items.filter((it) => it.amount > 0);
    if (activeItems.length === 0) {
      setError('Enter an amount under any bill head or select a procedure to generate a receipt.');
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
      {/* LEFT PANE: 10-HEAD ITEMIZED RECEIPT (7 cols) */}
      <div className="no-print min-w-0 space-y-5 xl:col-span-7">
        <div className="card-surface space-y-4 p-4 sm:p-5">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-ivory-50/[0.07] pb-3.5">
            <div>
              <span className="eyebrow">Cash Receipt</span>
              <h3 className="font-display text-xl font-medium text-ivory-50">Itemized Receipt Heads</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={aiLoading}
                onClick={voice.toggle}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  voice.recording
                    ? 'animate-pulse bg-red-600 text-white'
                    : 'bg-ivory-50 text-ink-900 hover:bg-gold-500 hover:text-white'
                }`}
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : voice.recording ? (
                  <Square className="h-3.5 w-3.5" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
                <span>{voice.recording ? `Stop (${voice.elapsedSec}s)` : 'Voice Fill'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMobilePreviewOpen(true)}
                className="inline-flex items-center gap-1 rounded-full border border-ivory-50/15 bg-ink-950 px-3 py-1.5 text-xs font-semibold text-ivory-100 xl:hidden"
              >
                <Eye className="h-3.5 w-3.5 text-gold-500" />
                Preview
              </button>
            </div>
          </div>

          {(aiMessage || voice.micError) && (
            <div className="flex items-start gap-2 rounded-2xl border border-gold-400/30 bg-clinic-50 p-3 text-xs text-ivory-100">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <span>{voice.micError || aiMessage}</span>
            </div>
          )}

          {/* ── LAYERED PROCEDURE DROPDOWN (Layer 1: Category -> Layer 2: Procedure) ── */}
          <div className="relative" ref={pickerRef}>
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-left transition ${
                pickerOpen
                  ? 'border-gold-400 bg-ink-900 ring-4 ring-gold-400/10'
                  : 'border-ivory-50/15 bg-ink-950 hover:border-gold-400/50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Plus className="h-4 w-4 shrink-0 text-gold-500" />
                <span className="truncate text-xs font-semibold text-ivory-50">
                  Add Procedure / Service (auto-splits into heads)
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-ivory-400 transition-transform ${
                  pickerOpen ? 'rotate-180 text-gold-500' : ''
                }`}
              />
            </button>

            {pickerOpen && (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-ivory-50/15 bg-ink-900 p-1.5 shadow-lift">
                {Array.from(catalogByCategory.entries()).map(([cat, list]) => {
                  const isExpanded = expandedCat === cat;
                  return (
                    <div key={cat} className="border-b border-ivory-50/[0.06] last:border-b-0">
                      {/* Layer 1: Category */}
                      <button
                        type="button"
                        onClick={() => setExpandedCat(isExpanded ? null : cat)}
                        className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left transition ${
                          isExpanded ? 'bg-clinic-50 text-ivory-50' : 'text-ivory-100 hover:bg-ink-950'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight
                            className={`h-3.5 w-3.5 text-gold-500 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                          <span className="text-xs font-semibold">{cat}</span>
                        </div>
                        <span className="rounded-full bg-ink-950 px-2 py-0.5 text-[10px] font-semibold text-ivory-400">
                          {list.length}
                        </span>
                      </button>

                      {/* Layer 2: Procedures under this Category */}
                      {isExpanded && (
                        <div className="space-y-1 bg-ink-950/60 px-2 py-1.5">
                          {list.map((svc) => (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => addCatalogItem(svc)}
                              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-clinic-50"
                            >
                              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ivory-50">
                                {svc.name}
                              </span>
                              <span className="shrink-0 text-xs font-bold text-gold-600 tabular-nums">
                                {formatINR(svc.default_price)}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── ALWAYS-VISIBLE 10-HEAD LEDGER (Direct Edit OR Indented Procedure Sub-Items) ── */}
          <div className="divide-y divide-ivory-50/[0.08] overflow-hidden rounded-2xl border border-ivory-50/10 bg-ink-950">
            {BILL_HEADS.map((head, idx) => {
              const headItems = groupedByHead[head];
              const subItems = headItems.filter((sub) => sub.name !== head);
              const directItem = headItems.find((sub) => sub.name === head);
              const headTotal = headItems.reduce((s, it) => s + it.amount, 0);

              return (
                <div
                  key={head}
                  className={`p-3 transition ${headTotal > 0 || subItems.length > 0 ? 'bg-ink-900' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="w-5 shrink-0 text-xs font-bold text-ivory-400 tabular-nums">
                        {idx + 1}.
                      </span>
                      <span
                        className={`truncate text-xs font-semibold ${
                          headTotal > 0 || subItems.length > 0 ? 'text-ivory-50' : 'text-ivory-300'
                        }`}
                      >
                        {head}
                      </span>
                    </div>

                    {/* Direct editable input when no procedure sub-items exist; summed total when sub-items exist */}
                    {subItems.length === 0 ? (
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="text-[11px] font-medium text-ivory-400">₹</span>
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={directItem ? directItem.unit_price : ''}
                          onChange={(e) => setDirectHeadAmount(head, e.target.value)}
                          aria-label={head}
                          className="w-24 min-w-0 rounded-xl border border-ivory-50/15 bg-ink-950 px-2.5 py-1.5 text-right text-xs font-bold text-ivory-50 placeholder:text-ivory-500/60 focus:border-gold-500 focus:bg-ink-900 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <span className="shrink-0 text-xs font-bold text-gold-600 tabular-nums">
                        {formatINR(headTotal)}
                      </span>
                    )}
                  </div>

                  {/* Indented Sub-Items from Selected Procedures */}
                  {subItems.length > 0 && (
                    <div className="mt-2 space-y-1.5 pl-6">
                      {subItems.map((sub, subIdx) => (
                        <div
                          key={`${sub.name}-${subIdx}`}
                          className="flex w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-ivory-50/[0.08] bg-ink-950 px-2.5 py-1.5"
                        >
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ivory-200">
                            ↳ {sub.name}
                            {sub.qty > 1 ? ` (×${sub.qty})` : ''}
                          </span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              value={sub.unit_price}
                              onChange={(e) => updateLineItemPrice(sub, e.target.value)}
                              aria-label={`${sub.name} under ${head}`}
                              className="w-20 min-w-0 rounded-lg border border-ivory-50/15 bg-ink-900 px-2 py-1 text-right text-xs font-bold text-ivory-50 focus:border-gold-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeLineItem(sub)}
                              className="p-1 text-ivory-400 hover:text-red-600"
                              title="Remove sub-item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Total Strip */}
          <div className="flex items-center justify-between rounded-2xl border border-gold-400/25 bg-clinic-50/70 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-ivory-300">Total Payable</span>
            <span className="font-display text-2xl font-semibold text-gold-600 tabular-nums">
              {formatINR(total)}
            </span>
          </div>

          {/* Payment & Concession */}
          <div className="grid gap-3 sm:grid-cols-2">
            <CustomSelect
              label="Payment Mode"
              value={paymentMode}
              onChange={(val) => setPaymentMode(val as PaymentMode)}
              options={PAYMENT_MODE_OPTIONS}
            />
            <div>
              <label className="label-field">Discount / Concession (₹)</label>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="input-field !min-h-[50px] text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowMoreOptions((prev) => !prev)}
              className="text-xs font-semibold text-gold-600 hover:underline"
            >
              {showMoreOptions ? '− Hide optional details' : '+ Add IPD No., UTR / Ref or Remarks'}
            </button>

            {showMoreOptions && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label-field">UTR / Ref / Claim ID</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Optional"
                    className="input-field !min-h-[42px] text-xs"
                  />
                </div>
                <div>
                  <label className="label-field">IPD No. (Optional)</label>
                  <input
                    value={ipdNo}
                    onChange={(e) => setIpdNo(e.target.value.toUpperCase())}
                    placeholder="IPD-26-XXXX"
                    className="input-field !min-h-[42px] font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="label-field">Billed By</label>
                  <input
                    value={createdBy}
                    onChange={(e) => setCreatedBy(e.target.value)}
                    className="input-field !min-h-[42px] text-xs"
                  />
                </div>
                <div>
                  <label className="label-field">Remarks</label>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional"
                    className="input-field !min-h-[42px] text-xs"
                  />
                </div>
              </div>
            )}
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
            disabled={saving || total <= 0}
            onClick={handleSave}
            className="btn-primary w-full"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save & Print Receipt ({formatINR(total)})
          </button>
        </div>
      </div>

      {/* RIGHT PANE: LIVE 10-HEAD RECEIPT PREVIEW */}
      <div className="hidden xl:col-span-5 xl:block">
        <div className="sticky top-20 space-y-2.5">
          <div className="no-print rounded-2xl border border-ivory-50/10 bg-ink-900 px-4 py-2.5 text-xs font-semibold text-ivory-200 shadow-soft">
            Live 10-Head Receipt Preview
          </div>
          <PrintableInvoice clinic={clinic} patient={patient} invoice={previewInvoice} />
        </div>
      </div>

      {/* MOBILE PREVIEW MODAL */}
      {mobilePreviewOpen && (
        <div className="sheet-modal z-50" onClick={() => setMobilePreviewOpen(false)}>
          <div
            className="sheet-panel max-h-[90dvh] w-full max-w-2xl overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between border-b border-ivory-50/10 pb-2.5">
              <span className="font-display text-lg font-medium text-ivory-50">Receipt Preview</span>
              <button
                type="button"
                onClick={() => setMobilePreviewOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full border border-ivory-50/15 bg-ink-950 text-ivory-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <PrintableInvoice clinic={clinic} patient={patient} invoice={previewInvoice} />
          </div>
        </div>
      )}
    </div>
  );
}
