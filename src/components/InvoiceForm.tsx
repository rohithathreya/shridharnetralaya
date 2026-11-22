import { useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  Printer,
  MessageCircle,
  CheckCircle2,
  Loader2,
  Receipt,
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
  const [activeCat, setActiveCat] = useState<ServiceCategory>('Consultation');
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

  const activeCatalog = useMemo(
    () => catalog.filter((c) => c.is_active && c.category === activeCat),
    [catalog, activeCat],
  );

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
        category: activeCat,
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
      setError('Tap at least one service or procedure to bill.');
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
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <div className="text-sm font-extrabold text-emerald-950">
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
            <button
              type="button"
              onClick={() => shareInvoiceOnWhatsApp(patient, savedInvoice, clinic)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
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
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
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
        <p className="eyebrow">{step === 0 ? 'Bill · What was done' : 'Bill · Payment'}</p>
        <div className="wizard-progress mt-3 max-w-[8rem]">
          <div className="wizard-dot wizard-dot-active" />
          <div className={`wizard-dot ${step >= 1 ? 'wizard-dot-active' : ''}`} />
        </div>
      </div>

      {step === 0 && (
      <div className="flow-panel">
        <div>
          <p className="font-display text-3xl text-ivory-50">Tap to add</p>
          <p className="mt-1 text-sm text-ivory-400">One tap adds it to the bill. Tap again to increase the quantity.</p>
        </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCat(cat)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  activeCat === cat
                    ? 'bg-clinic-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {activeCatalog.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => addCatalogItem(svc)}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-left transition hover:border-clinic-600 hover:bg-clinic-50 active:scale-[0.99]"
              >
                <span className="text-xs font-bold text-slate-800">{svc.name}</span>
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-extrabold text-clinic-700 ring-1 ring-slate-200">
                  {formatINR(svc.default_price)}
                </span>
              </button>
            ))}
            {activeCatalog.length === 0 && (
              <div className="col-span-2 rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
                No preset items in {activeCat}. Use custom item below or add in Admin.
              </div>
            )}
          </div>

          {/* Custom quick item */}
          <div className="mt-4 border-t border-slate-100 pt-3">
            <div className="mb-1.5 text-xs font-bold text-slate-600">Or Add Custom Line Item</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Custom service / medicine kit..."
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-clinic-600 focus:outline-none"
              />
              <input
                type="number"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Price ₹"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold sm:w-28 focus:border-clinic-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustomItem}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
      </div>
      )}

      {step === 1 && (
      <div className="flow-panel">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-display text-3xl text-ivory-50">
              <Receipt className="h-5 w-5 text-gold-400" />
              The bill
            </div>
            <span className="text-xs font-bold text-slate-500">{items.length} item(s)</span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              Tap services on the left to build the receipt.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-slate-900">{it.name}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <label className="text-[11px] text-slate-500">
                        Qty:
                        <input
                          type="number"
                          min={1}
                          value={it.qty}
                          onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                          className="ml-1 w-12 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-center text-xs font-bold"
                        />
                      </label>
                      <label className="text-[11px] text-slate-500">
                        Rate ₹:
                        <input
                          type="number"
                          min={0}
                          value={it.unit_price}
                          onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                          className="ml-1 w-20 rounded border border-slate-300 bg-white px-1.5 py-0.5 text-right text-xs font-bold"
                        />
                      </label>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-extrabold text-slate-900">{formatINR(it.amount)}</div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="mt-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Subtotal</span>
              <span className="font-bold text-slate-900">{formatINR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-600">Discount / Concession (₹)</span>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-right text-xs font-bold"
              />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-clinic-50 px-3 py-2.5 text-base font-extrabold text-clinic-900">
              <span>Net Payable</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`rounded-xl border py-2.5 text-xs font-extrabold transition ${
                    paymentMode === mode
                      ? 'border-clinic-600 bg-clinic-600 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">UPI / TPA Ref (Optional)</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="UTR / Claim ID"
                className="w-full rounded-xl border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600">Billed By</label>
              <input
                type="text"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder="Staff name"
                className="w-full rounded-xl border border-slate-300 px-2.5 py-2 text-xs"
              />
            </div>
          </div>

          <div className="mt-2.5">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarks (optional, e.g. Advance paid for Phaco)"
              className="w-full rounded-xl border border-slate-300 px-2.5 py-2 text-xs"
            />
          </div>

          {error && (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div>
          )}

        </div>
      </div>
      )}

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-ivory-50/10 bg-ink-950/90 px-1 py-3 backdrop-blur">
        {step === 0 ? (
          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => setStep(1)}
            className="btn-primary w-full"
          >
            Review {items.length === 0 ? 'the bill' : formatINR(total)}
          </button>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(0)} className="btn-ghost flex-1">
              Back
            </button>
            <button
              type="button"
              disabled={saving || items.length === 0}
              onClick={handleSave}
              className="btn-primary flex-[2]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save {formatINR(total)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
