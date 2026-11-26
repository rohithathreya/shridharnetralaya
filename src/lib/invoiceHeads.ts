import type { InvoiceLineItem, ServiceCatalogItem } from '../types/database';

export const BILL_HEADS = [
  'Bed charges',
  'Nursing charges',
  'Asst charges',
  'Professional charges',
  'Intra ocular lens',
  'Anesthetist',
  'Anesthesia',
  'OT charges',
  'OT drugs and implants',
  'Others',
] as const;

export type BillHead = (typeof BILL_HEADS)[number];

const HEAD_SET = new Set<string>(BILL_HEADS);

function allocateByWeights(
  serviceName: string,
  totalAmount: number,
  weights: Array<{ head: BillHead; ratio: number }>,
): InvoiceLineItem[] {
  const cleanTotal = Math.max(0, Math.round(totalAmount));
  if (cleanTotal === 0) {
    return weights.map((w) => ({
      name: serviceName,
      category: w.head,
      qty: 1,
      unit_price: 0,
      amount: 0,
    }));
  }

  let remaining = cleanTotal;
  return weights.map((w, idx) => {
    const isLast = idx === weights.length - 1;
    const raw = isLast ? remaining : Math.round((cleanTotal * w.ratio) / 50) * 50;
    const amt = Math.max(0, Math.min(remaining, raw));
    remaining -= amt;
    return {
      name: serviceName,
      category: w.head,
      qty: 1,
      unit_price: amt,
      amount: amt,
    };
  });
}

/**
 * Splits any catalog procedure/service into its constituent 10-head cost allocations.
 * The sum of all returned line items always equals `svc.default_price`.
 */
export function splitServiceIntoHeads(svc: ServiceCatalogItem): InvoiceLineItem[] {
  const n = svc.name.toLowerCase();
  const price = svc.default_price;

  if (n.includes('phaco')) {
    return allocateByWeights(svc.name, price, [
      { head: 'Bed charges', ratio: 0.08 },
      { head: 'Nursing charges', ratio: 0.06 },
      { head: 'Asst charges', ratio: 0.06 },
      { head: 'Professional charges', ratio: 0.33 },
      { head: 'Intra ocular lens', ratio: 0.25 },
      { head: 'OT charges', ratio: 0.14 },
      { head: 'OT drugs and implants', ratio: 0.08 },
    ]);
  }

  if (n.includes('sics') || n.includes('cataract')) {
    return allocateByWeights(svc.name, price, [
      { head: 'Bed charges', ratio: 0.08 },
      { head: 'Nursing charges', ratio: 0.06 },
      { head: 'Asst charges', ratio: 0.06 },
      { head: 'Professional charges', ratio: 0.32 },
      { head: 'Intra ocular lens', ratio: 0.20 },
      { head: 'Anesthesia', ratio: 0.05 },
      { head: 'OT charges', ratio: 0.15 },
      { head: 'OT drugs and implants', ratio: 0.08 },
    ]);
  }

  if (n.includes('intravitreal') || n.includes('anti-vegf') || n.includes('avastin') || n.includes('accentrix') || n.includes('eylea')) {
    return allocateByWeights(svc.name, price, [
      { head: 'Professional charges', ratio: 0.35 },
      { head: 'OT charges', ratio: 0.15 },
      { head: 'OT drugs and implants', ratio: 0.50 },
    ]);
  }

  if (
    n.includes('pterygium') ||
    n.includes('chalazion') ||
    n.includes('entropion') ||
    n.includes('ectropion') ||
    n.includes('squint') ||
    n.includes('trab') ||
    svc.category === 'Surgery'
  ) {
    return allocateByWeights(svc.name, price, [
      { head: 'Bed charges', ratio: 0.08 },
      { head: 'Nursing charges', ratio: 0.07 },
      { head: 'Asst charges', ratio: 0.08 },
      { head: 'Professional charges', ratio: 0.42 },
      { head: 'Anesthesia', ratio: 0.08 },
      { head: 'OT charges', ratio: 0.17 },
      { head: 'OT drugs and implants', ratio: 0.10 },
    ]);
  }

  if (n.includes('yag') || n.includes('laser')) {
    return allocateByWeights(svc.name, price, [
      { head: 'Professional charges', ratio: 0.65 },
      { head: 'OT charges', ratio: 0.35 },
    ]);
  }

  if (svc.category === 'Consultation') {
    return allocateByWeights(svc.name, price, [{ head: 'Professional charges', ratio: 1 }]);
  }

  if (svc.category === 'Procedure') {
    return allocateByWeights(svc.name, price, [
      { head: 'Professional charges', ratio: 0.6 },
      { head: 'OT charges', ratio: 0.4 },
    ]);
  }

  return allocateByWeights(svc.name, price, [{ head: 'Others', ratio: 1 }]);
}

/** Maps any stored InvoiceLineItem (including legacy categories) into one of the 10 canonical heads. */
export function mapItemToBillHead(item: InvoiceLineItem): BillHead {
  if (HEAD_SET.has(item.category)) {
    return item.category as BillHead;
  }
  const cat = (item.category || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  if (cat === 'consultation' || name.includes('consultation')) return 'Professional charges';
  if (cat === 'surgery' || name.includes('phaco') || name.includes('sics')) return 'OT charges';
  if (name.includes('iol') || name.includes('lens')) return 'Intra ocular lens';
  if (cat === 'procedure') return 'Professional charges';
  return 'Others';
}

export function groupItemsByBillHead(items: InvoiceLineItem[]): Record<BillHead, InvoiceLineItem[]> {
  const grouped = BILL_HEADS.reduce(
    (acc, head) => {
      acc[head] = [];
      return acc;
    },
    {} as Record<BillHead, InvoiceLineItem[]>,
  );

  for (const item of items) {
    const head = mapItemToBillHead(item);
    grouped[head].push(item);
  }
  return grouped;
}
