import { useCallback, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Eye,
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

const HEAD_OPTIONS: CustomSelectOption[] = BILL_HEADS.map((h, i) => ({
  value: h,
  label: `${i + 1}. ${h}`,
}));

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
  const [customHead, setCustomHead] = useState<BillHead>('Others');
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
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

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

  const groupedByHead = useMemo(() => groupItemsByBillHead(items), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.amount, 0), [items]);
  const discountNum = Math.max(0, Math.min(subtotal, parseInt(discount || '0', 10) || 0));
  const total = Math.max(0, subtotal - discountNum);

  // Track count & total per service name for catalog card badges
  const serviceSummary = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const it of items) {
      const cur = map.get(it.name) || { count: 0, total: 0 };
      cur.total += it.amount;
      map.set(it.name, cur);
    }
    return map;
  }, [items]);

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
  }

  function removeServiceByName(name: string) {
    setItems((prev) => prev.filter((x) => x.name !== name));
  }

  function addCustomItem() {
    const price = Math.max(0, parseInt(customPrice, 10) || 0);
    if (!customName.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        name: customName.trim(),
        category: customHead,
        qty: 1,
        unit_price: price,
        amount: price,
      },
    ]);
    setCustomName('');
    setCustomPrice('');
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
      setError('Tap a service or enter an amount under any bill head to generate a receipt.');
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
      {/* LEFT PANE: PROCEDURE PICKER + 10-HEAD COST SPLIT LEDGER (7 cols) */}
      <div className="no-print min-w-0 space-y-5 xl:col-span-7">
        {/* Card 1: Tap Procedure / Service (Auto-Splits into 10 Heads) */}
        <div className="card-surface space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-ivory-50/[0.07] pb-3.5">
            <div>
              <span className="eyebrow">Step 1 · Procedures</span>
              <h3 className="font-display text-xl font-medium text-ivory-50">Tap to Split into Bill Heads</h3>
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

          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-400" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search procedures (Phaco, SICS, OPD, Pterygium, YAG)…"
              className="input-field !min-h-[44px] pl-10 text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['All', ...CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                  activeCat === cat
                    ? 'bg-ivory-50 text-ink-900 shadow-soft'
                    : 'border border-ivory-50/12 bg-ink-950 text-ivory-300 hover:border-gold-400/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredCatalog.map((svc) => {
              const info = serviceSummary.get(svc.name);
              const isAdded = Boolean(info);
              return (
                <div
                  key={svc.id}
                  className={`box-border flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-2xl border p-3 transition ${
                    isAdded
                      ? 'border-gold-400 bg-clinic-50/80 shadow-soft'
                      : 'border-ivory-50/10 bg-ink-950 hover:border-gold-400/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => addCatalogItem(svc)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block truncate text-xs font-semibold text-ivory-50">{svc.name}</span>
                    <span className="text-[10.5px] text-ivory-400">
                      {svc.category} ·{' '}
                      <strong className="text-ivory-100">
                        {isAdded ? `${formatINR(info!.total)} allocated` : formatINR(svc.default_price)}
                      </strong>
                    </span>
                  </button>

                  {isAdded ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => addCatalogItem(svc)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-ivory-50 text-ink-900 transition hover:bg-gold-500 hover:text-white"
                        title="Add another"
                        aria-label={`Add another ${svc.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeServiceByName(svc.name)}
                        className="grid h-7 w-7 place-items-center rounded-full border border-ivory-50/15 bg-ink-900 text-ivory-400 hover:border-red-300 hover:text-red-600"
                        title="Remove from all heads"
                        aria-label={`Remove ${svc.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addCatalogItem(svc)}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ivory-50/15 bg-ink-900 text-ivory-100 hover:bg-ivory-50 hover:text-ink-900 transition"
                      aria-label={`Add ${svc.name}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Custom Sub-Item Directly to Any of the 10 Heads */}
          <div className="border-t border-ivory-50/10 pt-3.5 space-y-2.5">
            <label className="label-field mb-0">Add Custom Item to a Bill Head</label>
            <div className="grid gap-2 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <CustomSelect
                  value={customHead}
                  onChange={(val) => setCustomHead(val as BillHead)}
                  options={HEAD_OPTIONS}
                />
              </div>
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Item / IOL / Medicine…"
                  className="input-field !min-h-[50px] text-xs"
                />
              </div>
              <div className="flex gap-2 sm:col-span-3">
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="₹"
                  className="input-field !min-h-[50px] min-w-0 flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={addCustomItem}
                  className="btn-ghost !min-h-[50px] shrink-0 px-4 text-xs"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: The 10-Head Cost Split Ledger (Always Structured, Inline Editable) */}
        <div id="invoice-checkout" className="card-surface space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-ivory-50/[0.07] pb-3">
            <div>
              <span className="eyebrow">Step 2 · 10-Head Breakdown</span>
              <h4 className="font-display text-xl font-medium text-ivory-50">Itemized Receipt Heads</h4>
            </div>
            <span className="font-display text-2xl font-semibold text-gold-600 tabular-nums">
              {formatINR(total)}
            </span>
          </div>

          <div className="divide-y divide-ivory-50/[0.08] overflow-hidden rounded-2xl border border-ivory-50/10 bg-ink-950">
            {BILL_HEADS.map((head, idx) => {
              const headItems = groupedByHead[head];
              const headTotal = headItems.reduce((s, it) => s + it.amount, 0);

              return (
                <div key={head} className={`p-3 transition ${headItems.length > 0 ? 'bg-ink-900' : 'opacity-70'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 shrink-0 text-xs font-bold text-ivory-400 tabular-nums">
                        {idx + 1}.
                      </span>
                      <span className={`truncate text-xs font-semibold ${headItems.length > 0 ? 'text-ivory-50' : 'text-ivory-400'}`}>
                        {head}
                      </span>
                    </div>
                    <span className={`shrink-0 text-xs font-bold tabular-nums ${headTotal > 0 ? 'text-gold-600' : 'text-ivory-400'}`}>
                      {headTotal > 0 ? formatINR(headTotal) : '—'}
                    </span>
                  </div>

                  {headItems.length > 0 && (
                    <div className="mt-2 space-y-1.5 pl-6">
                      {headItems.map((sub, subIdx) => (
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
            disabled={saving || items.length === 0}
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
