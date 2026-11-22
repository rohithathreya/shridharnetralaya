import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, Loader2, MessageCircle, FileImage, Calendar, FileText } from 'lucide-react';
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
      setError('Please take a photo or select a file first.');
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
    <div className="card-surface p-5 sm:p-6 space-y-5">
      <div>
        <p className="eyebrow">Document capture</p>
        <h3 className="mt-1 font-display text-2xl text-ivory-50">Upload prescription or report</h3>
        <p className="mt-1 text-xs text-ivory-400">
          Camera captures are automatically compressed in-browser (~200KB) to keep patient files fast and private.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Dropdown for Document Type */}
        <div>
          <label className="label-field">1. Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            className="input-field font-medium"
          >
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'Medicine Rx' ? '💊 Medicine Prescription (Rx)' :
                 t === 'Spectacle Rx' ? '👓 Spectacle & Refraction Rx' :
                 t === 'Surgery / OT Slip' ? '🏥 Surgery / OT Notes Slip' :
                 t === 'Lab / Scan Report' ? '🔬 Lab / Scan / Biometry Report' :
                 t === 'IOL Sticker' ? '🏷️ IOL Box Sticker' :
                 t === 'Old File' ? '📁 Previous Hospital File / Record' :
                 '📄 Other Document'}
              </option>
            ))}
          </select>
        </div>

        {/* Visit Date */}
        <div>
          <label className="label-field">2. Visit Date</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="input-field font-medium"
          />
        </div>
      </div>

      {/* Camera and File picker buttons */}
      <div>
        <label className="label-field">3. Capture or select file</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold-400/30 bg-ink-950 p-6 text-center transition hover:border-gold-400 hover:bg-ink-850">
            <Camera className="h-8 w-8 text-gold-400" />
            <span className="mt-2 text-sm font-semibold text-ivory-50">Take photo (camera)</span>
            <span className="mt-0.5 text-xs text-ivory-500">Opens phone / tablet camera</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFilePick}
              className="hidden"
            />
          </label>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ivory-50/15 bg-ink-950 p-6 text-center transition hover:border-ivory-50/30 hover:bg-ink-850">
            <Upload className="h-8 w-8 text-ivory-400" />
            <span className="mt-2 text-sm font-semibold text-ivory-50">Choose image or PDF</span>
            <span className="mt-0.5 text-xs text-ivory-500">From gallery or desktop</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFilePick}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="flex flex-col gap-3 rounded-2xl border border-ivory-50/10 bg-ink-950 p-3 sm:flex-row sm:items-center">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-24 w-24 rounded-xl border border-ivory-50/15 object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-ink-800 text-ivory-400">
              <FileImage className="h-8 w-8" />
            </div>
          )}
          <div className="flex-1 text-xs">
            <div className="font-semibold text-ivory-50">{selectedFile.name}</div>
            <div className="mt-0.5 text-ivory-500">
              Original: {Math.round(selectedFile.size / 1024)} KB · Auto-compressed to ~200 KB on upload
            </div>
          </div>
        </div>
      )}

      {/* Optional Note */}
      <div>
        <label className="label-field">4. Note (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Right eye post-op week 1 drops, or Bifocal Rx"
          className="input-field text-sm"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={uploading || !selectedFile}
        onClick={handleUpload}
        className="btn-primary w-full"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {uploading ? 'Compressing & saving…' : `Save ${docType} to ${patient.patient_code}`}
      </button>

      {/* Upload Success & WhatsApp Share */}
      {lastUploaded && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 text-xs">
          <div>
            <div className="font-bold text-emerald-900">
              ✓ Saved to patient chart ({lastUploaded.savedKb} KB)!
            </div>
            <div className="text-emerald-700 text-[11px] mt-0.5">
              Available permanently in history. 7-day secure link ready for WhatsApp.
            </div>
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
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white shadow-soft hover:bg-emerald-800 transition"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Send to patient on WhatsApp
            </button>
          )}
        </div>
      )}
    </div>
  );
}
