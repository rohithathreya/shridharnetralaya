import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, Loader2, MessageCircle, FileImage } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressClinicalImage } from '../lib/imageCompress';
import { todayIsoDate } from '../lib/dates';
import { shareDocumentLinkOnWhatsApp } from '../lib/whatsapp';
import type { ClinicSettings, DocumentType, Patient, PatientDocument } from '../types/database';

const DOC_TYPES: DocumentType[] = [
  'Medicine Rx',
  'Spectacle Rx',
  'Surgery / OT Slip',
  'Lab / Scan Report',
  'IOL Sticker',
  'Old File',
  'Other',
];

interface DocumentUploadFormProps {
  patient: Patient;
  clinic: ClinicSettings;
  onUploaded: (doc: PatientDocument) => void;
}

export function DocumentUploadForm({ patient, clinic, onUploaded }: DocumentUploadFormProps) {
  const [docType, setDocType] = useState<DocumentType>('Medicine Rx');
  const [visitDate, setVisitDate] = useState(todayIsoDate());
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [lastUploaded, setLastUploaded] = useState<{ doc: PatientDocument; signedUrl: string; savedKb: number } | null>(
    null,
  );

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setError('');
    setLastUploaded(null);
    if (f.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError('Take a photo or choose a file first.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const compressed = await compressClinicalImage(selectedFile, 1600, 0.78);
      const ext = compressed.mimeType === 'application/pdf' ? 'pdf' : 'jpg';
      const storagePath = `${patient.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('patient-docs')
        .upload(storagePath, compressed.blob, {
          contentType: compressed.mimeType,
          upsert: false,
        });

      if (upErr) throw upErr;

      const { data: row, error: dbErr } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patient.id,
          doc_type: docType,
          title: `${docType} — ${visitDate}`,
          notes: notes.trim(),
          storage_path: storagePath,
          mime_type: compressed.mimeType,
          file_size_kb: compressed.sizeKb,
          visit_date: visitDate,
        })
        .select()
        .single();

      if (dbErr || !row) throw dbErr || new Error('Failed to save document metadata');

      const { data: signed } = await supabase.storage
        .from('patient-docs')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

      const doc = row as PatientDocument;
      setLastUploaded({
        doc,
        signedUrl: signed?.signedUrl || '',
        savedKb: compressed.sizeKb,
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setNotes('');
      onUploaded(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 space-y-4">
      <div>
        <h3 className="text-sm font-extrabold text-slate-900">
          Upload Handwritten Prescription / Document
        </h3>
        <p className="text-xs text-slate-500">
          Photos are compressed automatically on your phone/PC before saving to keep storage fast and tiny.
        </p>
      </div>

      {/* Step 1: Category Chips */}
      <div>
        <label className="mb-1.5 block text-xs font-bold text-slate-700">1. What are you uploading?</label>
        <div className="flex flex-wrap gap-1.5">
          {DOC_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setDocType(t)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                docType === t
                  ? 'bg-clinic-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Big Camera / File Buttons */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-clinic-300 bg-clinic-50/60 p-6 text-center transition hover:bg-clinic-50">
          <Camera className="h-8 w-8 text-clinic-600" />
          <span className="mt-2 text-sm font-extrabold text-clinic-900">Take Photo (Camera)</span>
          <span className="mt-0.5 text-[11px] text-clinic-700">Best on clinic phone / tablet</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFilePick}
            className="hidden"
          />
        </label>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:bg-slate-100">
          <Upload className="h-8 w-8 text-slate-600" />
          <span className="mt-2 text-sm font-extrabold text-slate-900">Choose Image / PDF</span>
          <span className="mt-0.5 text-[11px] text-slate-500">From gallery or desktop scanner</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFilePick}
            className="hidden"
          />
        </label>
      </div>

      {selectedFile && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-28 w-28 rounded-lg border border-slate-300 object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
              <FileImage className="h-8 w-8" />
            </div>
          )}
          <div className="flex-1 text-xs">
            <div className="font-bold text-slate-900">{selectedFile.name}</div>
            <div className="text-slate-500">
              Original size: {Math.round(selectedFile.size / 1024)} KB (will be auto-compressed on save)
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Visit Date & Optional Note */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">Visit Date</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-bold text-slate-700">Short Note (Optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Bifocal glasses Rx -1.50 / +2.25, or Post-op Week 1 Rx"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div>}

      <button
        type="button"
        disabled={uploading || !selectedFile}
        onClick={handleUpload}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-clinic-600 py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-clinic-700 disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {uploading ? 'Compressing & Saving...' : `Save ${docType} to ${patient.patient_code}`}
      </button>

      {lastUploaded && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs">
          <div className="font-bold text-emerald-900">
            ✓ Saved ({lastUploaded.savedKb} KB) to patient history!
          </div>
          {lastUploaded.signedUrl && (
            <button
              type="button"
              onClick={() =>
                shareDocumentLinkOnWhatsApp(
                  patient,
                  lastUploaded.doc.doc_type,
                  lastUploaded.doc.visit_date,
                  lastUploaded.signedUrl,
                  clinic,
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Send Photo on WhatsApp
            </button>
          )}
        </div>
      )}
    </div>
  );
}
