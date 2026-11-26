import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';
import { blobToBase64 } from './imageCompress';
import type { BillHead } from './invoiceHeads';
import type { SurgicalProtocol } from '../types/database';

export interface AiExtractResult<T = Record<string, unknown>> {
  extracted: T;
  warnings: string[];
}

export interface InvoiceVoiceExtraction {
  procedures?: Array<{ name: string; qty: number; price_override?: number | null; total_price?: number }>;
  head_charges?: Array<{ head: BillHead | string; amount: number }>;
  items?: Array<{ name: string; category: string; qty: number; unit_price: number }>;
  discount?: number;
  payment_mode?: string;
  payment_ref?: string;
  notes?: string;
  warnings?: string[];
}

export interface DischargeAiExtraction {
  protocol_id?: string;
  operated_eye?: string;
  case_type?: string;
  discharge_status?: string;
  billing_category?: string;
  chief_complaints?: string;
  diagnosis?: string;
  icd10_code?: string;
  procedure_name?: string;
  anesthesia?: string;
  dressing_status?: string;
  discharge_condition?: string;
  pre_op_va_re?: string;
  pre_op_va_le?: string;
  pre_op_iop_re?: string;
  pre_op_iop_le?: string;
  pre_op_bp?: string;
  pre_op_rbs?: string;
  comorbidities?: string[];
  allergies?: string;
  iol_model?: string;
  iol_power?: string;
  iol_batch?: string;
  intra_op_notes?: string;
  in_clinic_meds?: string;
  eye_drops?: Array<{ name: string; eye: string; schedule: string; duration: string }>;
  oral_meds?: Array<{ name: string; dosage: string; timing: string; duration: string }>;
  head_bath_days?: number | null;
  warnings?: string[];
}

export async function runAiExtract<T = Record<string, unknown>>(params: {
  target: 'discharge' | 'invoice';
  mode: 'image' | 'audio';
  mimeType: string;
  base64: string;
  catalogNames?: string[];
  protocols?: Array<Pick<SurgicalProtocol, 'id' | 'short_label' | 'procedure_name'>>;
}): Promise<AiExtractResult<T>> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Staff session expired. Please sign in with your PIN again.');
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(params),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || `AI service returned status ${res.status}`);
  }

  return {
    extracted: (payload.extracted as T) || ({} as T),
    warnings: Array.isArray(payload.warnings) ? payload.warnings.map(String) : [],
  };
}

/** Dedicated Invoice Voice Pipeline: sends catalog names only (no prices); app derives prices & 10-head splits. */
export function extractInvoiceFromVoice(params: {
  mimeType: string;
  base64: string;
  catalogNames: string[];
}) {
  return runAiExtract<InvoiceVoiceExtraction>({
    target: 'invoice',
    mode: 'audio',
    mimeType: params.mimeType,
    base64: params.base64,
    catalogNames: params.catalogNames,
  });
}

/** Dedicated Discharge Summary Voice & Image Pipeline: sends active protocol IDs so form cascades defaults first. */
export function extractDischargeFromMedia(params: {
  mode: 'image' | 'audio';
  mimeType: string;
  base64: string;
  protocols: Array<Pick<SurgicalProtocol, 'id' | 'short_label' | 'procedure_name'>>;
}) {
  return runAiExtract<DischargeAiExtraction>({
    target: 'discharge',
    mode: params.mode,
    mimeType: params.mimeType,
    base64: params.base64,
    protocols: params.protocols,
  });
}

function pickSupportedAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

export function useVoiceRecorder(onRecorded: (base64: string, mimeType: string) => Promise<void>) {
  const [recording, setRecording] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [micError, setMicError] = useState('');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const stopTracks = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stopTracks(), [stopTracks]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setRecording(false);
  }, []);

  const toggle = useCallback(async () => {
    setMicError('');
    if (recording) {
      stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('Microphone access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const preferredMime = pickSupportedAudioMime();
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stopTracks();
        const finalMime = recorder.mimeType || preferredMime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });
        if (blob.size < 400) {
          setMicError('Recording was too short. Speak clearly and tap Stop.');
          return;
        }
        const b64 = await blobToBase64(blob);
        await onRecorded(b64, finalMime);
      };

      recorderRef.current = recorder;
      recorder.start();
      setElapsedSec(0);
      setRecording(true);

      timerRef.current = window.setInterval(() => {
        setElapsedSec((prev) => {
          if (prev >= 59) {
            stop();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      stopTracks();
      setMicError('Microphone permission denied. Allow mic access in browser settings.');
    }
  }, [onRecorded, recording, stop, stopTracks]);

  return { recording, elapsedSec, micError, toggle, stop };
}
