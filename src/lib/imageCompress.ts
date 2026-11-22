export interface CompressedResult {
  blob: Blob;
  mimeType: string;
  sizeKb: number;
  filename: string;
}

export async function compressClinicalImage(file: File, maxDim = 1600, quality = 0.78): Promise<CompressedResult> {
  // Pass PDFs through untouched
  if (file.type === 'application/pdf') {
    return {
      blob: file,
      mimeType: 'application/pdf',
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      filename: file.name,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }
          const cleanName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
          resolve({
            blob,
            mimeType: 'image/jpeg',
            sizeKb: Math.max(1, Math.round(blob.size / 1024)),
            filename: cleanName,
          });
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not decode image file'));
    };

    img.src = url;
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const str = String(reader.result || '');
      const idx = str.indexOf(',');
      resolve(idx >= 0 ? str.slice(idx + 1) : str);
    };
    reader.onerror = () => reject(new Error('Failed to read file as base64'));
    reader.readAsDataURL(blob);
  });
}
