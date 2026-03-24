import { useState, useRef } from 'react';

interface PhotoCaptureProps {
  value: string | null;
  onChange: (base64: string | null) => void;
}

function compressImage(file: Blob, maxWidth = 1200, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Impossible de charger l\'image')); };
    img.src = url;
  });
}

export function PhotoCapture({ value, onChange }: PhotoCaptureProps) {
  const [loading, setLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    e.target.value = '';
  };

  if (value) {
    return (
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden">
          <img src={value} alt="Photo de ronde" className="w-full max-h-64 object-cover rounded-xl" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gold-400"></div>
          Compression...
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border-2 border-ink-700/50 text-ink-400 hover:border-gold-500/30 hover:text-gold-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Caméra
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border-2 border-ink-700/50 text-ink-400 hover:border-gold-500/30 hover:text-gold-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Galerie
        </button>
      </div>
      {/* Camera: capture="environment" opens native camera app directly */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Gallery: no capture attribute = opens file picker / gallery */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
