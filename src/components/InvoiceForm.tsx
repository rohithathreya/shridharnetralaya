import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Receipt,
  Search,
  Filter,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatINR } from '../lib/dates';
import { shareInvoiceOnWhatsApp } from '../lib/whatsapp';
import { PrintableInvoice } from './PrintableInvoice';
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
const PAYMENT_MODES: PaymentMode[] = ['Cash', 'UPI', 'Card', 'TPA / Scheme'];

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
  const [notes, setNotes] = useState('');
  const [createdBy, setCreatedBy] = useState('Reception');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedInvoice, setSavedInvoice] = useState<Invoice | null>(null);
  const [step, setStep] = useState(0);

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

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (items.length === 0) {
      setError('Please add at least one item or procedure to the bill.');
      return;
    }
    setSaving(true);
    setError('');

    const { data, error: insErr } = await supabase
      .from('invoices')
      .insert({
        patient_id: patient.id,
        items,
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
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
            <div>
              <div className="text-sm font-bold text-emerald-950">
                Receipt {savedInvoice.invoice_no} Saved ({formatINR(savedInvoice.total)})
              </div>
              <div className="text-xs text-emerald-800">
                Linked to {patient.full_name} ({patient.patient_code})
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary !min-h-[42px] text-xs"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
            <button
              type="button"
              onClick={() => shareInvoiceOnWhatsApp(patient, savedInvoice, clinic)}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-soft hover:bg-emerald-800 transition"
            >
              <MessageCircle className="h-4 w-4" />
              Send on WhatsApp
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
              className="btn-ghost !min-h-[42px] text-xs"
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
    <div className="space-y-6">
      <div>
        <p className="eyebrow">{step === 0 ? 'Step 1 · Select items' : 'Step 2 · Payment & Receipt'}</p>
        <div className="wizard-progress mt-3 max-w-[8rem]">
          <div className="wizard-dot wizard-dot-active" />
          <div className={`wizard-dot ${step >= 1 ? 'wizard-dot-active' : ''}`} />
        </div>
      </div>

      {step === 0 && (
        <div className="card-surface p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-ivory-50">Select services</h3>
              <p className="mt-0.5 text-xs text-ivory-400">Click any service to add to bill. Click again to increase quantity.</p>
            </div>
            {items.length > 0 && (
              <span className="rounded-full bg-gold-400/20 px-3 py-1 text-xs font-bold text-gold-500">
                {items.length} item(s) in bill · {formatINR(total)}
              </span>
            )}
          </div>

          {/* Clean Dropdown for Category + Quick Search */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">Filter Category</label>
              <select
                value={activeCat}
                onChange={(e) => setActiveCat(e.target.value as ServiceCategory | 'All')}
                className="input-field font-medium"
              >
                <option value="All">All Categories ({catalog.length} items)</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Quick Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search item name..."
                  className="input-field pl-10 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Service items list */}
          <div className="grid gap-2 sm:grid-cols-2">
            {filteredCatalog.map((svc) => {
              const inBill = items.find((x) => x.name === svc.name);
              return (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => addCatalogItem(svc)}
                  className={`flex items-center justify-between gap-2 rounded-2xl border p-3.5 text-left transition ${
                    inBill
                      ? 'border-gold-400 bg-gold-400/10 shadow-soft'
                      : 'border-ivory-50/10 bg-ink-950 hover:border-gold-400/50 hover:bg-ink-850'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-ivory-50">{svc.name}</span>
                    <span className="text-[11px] text-ivory-400">{svc.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {inBill && (
                      <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-bold text-ink-900">
                        x{inBill.qty}
                      </span>
                    )}
                    <span className="shrink-0 rounded-xl bg-ink-900 px-2.5 py-1 text-xs font-bold text-ivory-50 border border-ivory-50/10">
                      {formatINR(svc.default_price)}
                    </span>
                  </div>
                </button>
              );
            })}
            {filteredCatalog.length === 0 && (
              <div className="col-span-2 rounded-2xl border border-dashed border-ivory-50/15 p-6 text-center text-xs text-ivory-400">
                No services found. Add a custom item below.
              </div>
            )}
          </div>

          {/* Custom line item */}
          <div className="border-t border-ivory-50/10 pt-4">
            <label className="label-field">Or Add Custom Item</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Custom service / medicine / eye drops kit..."
                className="input-field flex-1 text-xs"
              />
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Rate ₹"
                className="input-field sm:w-32 text-xs"
              />
              <button
                type="button"
                onClick={addCustomItem}
                className="btn-ghost !min-h-[50px] shrink-0 text-xs"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card-surface p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-ivory-50/10 pb-3">
            <div className="flex items-center gap-2 font-display text-2xl text-ivory-50">
              <Receipt className="h-5 w-5 text-gold-400" />
              Invoice summary
            </div>
            <span className="text-xs text-ivory-400">{items.length} item(s)</span>
          </div>

          {/* Items breakdown */}
          <div className="space-y-2">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-2xl border border-ivory-50/10 bg-ink-950 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-ivory-50">{it.name}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-ivory-400">
                    <label className="inline-flex items-center gap-1">
                      Qty:
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                        className="w-14 rounded-lg border border-ivory-50/15 bg-ink-900 px-2 py-0.5 text-center text-xs font-bold text-ivory-50"
                      />
                    </label>
                    <label className="inline-flex items-center gap-1">
                      Rate:
                      <input
                        type="number"
                        min={0}
                        value={it.unit_price}
                        onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                        className="w-20 rounded-lg border border-ivory-50/15 bg-ink-900 px-2 py-0.5 text-right text-xs font-bold text-ivory-50"
                      />
                    </label>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-ivory-50">{formatINR(it.amount)}</div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="mt-1 text-red-600 hover:text-red-700 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="rounded-2xl border border-ivory-50/10 bg-ink-950 p-4 space-y-2 text-xs">
            <div className="flex justify-between text-ivory-400">
              <span>Subtotal</span>
              <span className="font-semibold text-ivory-50">{formatINR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-ivory-400">
              <span>Discount / Concession (₹)</span>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 rounded-lg border border-ivory-50/15 bg-ink-900 px-2 py-1 text-right text-xs font-bold text-ivory-50"
              />
            </div>
            <div className="flex justify-between border-t border-ivory-50/10 pt-2 text-sm font-bold text-ivory-50">
              <span>Total Payable</span>
              <span className="text-gold-400 text-base">{formatINR(total)}</span>
            </div>
          </div>

          {/* Payment Mode & Details - Using clean Dropdown */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="input-field font-semibold"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode === 'Cash' ? '💵 Cash' :
                     mode === 'UPI' ? '📱 UPI / QR Code' :
                     mode === 'Card' ? '💳 Card (POS Machine)' :
                     '🛡️ TPA / Scheme Claim'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Reference / UTR / Claim No. (Optional)</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="UPI UTR, Card Auth, or Policy ID"
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">Billed By (Staff Signature)</label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="Staff name"
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="label-field">Remarks (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Balance paid after surgery"
                className="input-field text-xs"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Sticky footer actions */}
      <div className="sticky bottom-0 z-10 border-t border-ivory-50/10 bg-ink-950/95 py-3 backdrop-blur">
        {step === 0 ? (
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => setStep(1)}
            className="btn-primary w-full"
          >
            Review bill ({items.length === 0 ? '0 items' : formatINR(total)}) →
          </button>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(0)} className="btn-ghost flex-1">
              ← Back to items
            </button>
            <button
              type="button"
              disabled={saving || items.length === 0}
              onClick={handleSave}
              className="btn-primary flex-[2]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save receipt ({formatINR(total)})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
