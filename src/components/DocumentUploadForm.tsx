import React, { useState } from 'react';
import { Camera, CheckCircle2, FileImage, Loader2, MessageCircle, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { compressClinicalImage } from '../lib/imageCompress';
import { todayIsoDate } from '../lib/dates';
import { shareDocumentLinkOnWhatsApp } from '../lib/whatsapp';
import { CustomSelect, CustomSelectOption } from './CustomSelect';
import type { ClinicSettings, DocumentType, Patient, PatientDocument } from '../types/database';

const DOC_TYPE_OPTIONS: CustomSelectOption[] = [
  { value: 'Medicine Rx', label: 'Medicine Prescription (Rx)', sublabel: 'Handwritten doctor prescription' },
  { value: 'Spectacle Rx', label: 'Spectacle & Refraction Rx', sublabel: 'Autorefraction & trial frame numbers' },
  { value: 'Surgery / OT Slip', label: 'Surgery / OT Notes Slip', sublabel: 'Intra-op surgical notes & consent' },
  { value: 'Lab / Scan Report', label: 'Lab / Scan / Biometry Report', sublabel: 'A-Scan biometry, blood sugar, labs' },
  { value: 'IOL Sticker', label: 'IOL Box Sticker', sublabel: 'Physical sticker of implanted lens' },
  { value: 'Old File', label: 'Previous Hospital Record', sublabel: 'Records from other centres' },
  { value: 'Other', label: 'Other Document', sublabel: 'General clinical papers' },
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
  const [lastUploaded, setLastUploaded] = useState<{
    doc: PatientDocument;
    signedUrl: string;
    savedKb: number;
  } | null>(null);

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
    <div className="card-surface mx-auto max-w-3xl space-y-5 p-5 sm:p-7">
      <div>
        <span className="eyebrow">Clinical Archive</span>
        <h3 className="mt-1 font-display text-2xl text-ivory-50">Upload Prescription or Scan</h3>
        <p className="mt-0.5 text-xs text-ivory-400">
          Photos auto-compress to ~200 KB in the browser and store in a private Supabase bucket.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CustomSelect
          label="1. Document Type"
          value={docType}
          onChange={(val) => setDocType(val as DocumentType)}
          options={DOC_TYPE_OPTIONS}
        />
        <div>
          <label className="label-field">2. Visit Date</label>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="input-field text-xs font-semibold"
          />
        </div>
      </div>

      <div>
        <label className="label-field">3. Capture or Select File</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gold-400/35 bg-clinic-50/40 p-6 text-center transition hover:border-gold-400 hover:bg-clinic-50">
            <Camera className="h-7 w-7 text-gold-500" />
            <span className="mt-2 text-sm font-semibold text-ivory-50">Take Photo (Camera)</span>
            <span className="mt-0.5 text-xs text-ivory-400">Instant phone / tablet capture</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleFilePick} className="hidden" />
          </label>

          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ivory-50/15 bg-ink-950 p-6 text-center transition hover:border-gold-400/40 hover:bg-ink-850">
            <Upload className="h-7 w-7 text-ivory-400" />
            <span className="mt-2 text-sm font-semibold text-ivory-50">Choose Image or PDF</span>
            <span className="mt-0.5 text-xs text-ivory-400">From gallery or desktop</span>
            <input type="file" accept="image/*,application/pdf" onChange={handleFilePick} className="hidden" />
          </label>
        </div>
      </div>

      {selectedFile && (
        <div className="flex items-center gap-3 rounded-2xl border border-ivory-50/12 bg-ink-950 p-3">
          {previewUrl ? (
            <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-xl border border-ivory-50/15 object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-ink-850 text-ivory-400">
              <FileImage className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 flex-1 text-xs">
            <div className="truncate font-semibold text-ivory-50">{selectedFile.name}</div>
            <div className="mt-0.5 text-ivory-400">
              {Math.round(selectedFile.size / 1024)} KB original · auto-compressed on save
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="label-field">4. Note (Optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Post-op Day 1 Rx or A-Scan report"
          className="input-field text-xs"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-800">
          {error}
        </div>
      )}

      <button type="button" disabled={uploading || !selectedFile} onClick={handleUpload} className="btn-primary w-full">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {uploading ? 'Compressing & Saving…' : `Save ${docType} to ${patient.patient_code}`}
      </button>

      {lastUploaded && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 text-xs">
          <div>
            <div className="font-bold text-emerald-950">
              Saved to history ({lastUploaded.savedKb} KB)
            </div>
            <div className="mt-0.5 text-[11px] text-emerald-800">
              7-day private link ready to share on WhatsApp.
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
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 transition"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Send on WhatsApp
            </button>
          )}
        </div>
      )}
    </div>
  );
}
