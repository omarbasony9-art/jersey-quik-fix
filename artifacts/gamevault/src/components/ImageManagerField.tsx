/**
 * ImageManagerField — full-featured admin image picker
 *
 * Supports:
 *  • Drag-and-drop anywhere in the manager area
 *  • Choose file (desktop + mobile)
 *  • Clipboard paste via Cmd+V / Ctrl+V and a Paste button
 *  • Media Library (browse, search, select, delete previously uploaded images)
 *  • HEIC/HEIF → JPEG conversion (client-side via heic2any)
 *  • EXIF orientation fix + resize via browser-image-compression
 *  • Upload progress bar → success / error states
 *  • Replace Image / Remove Image / Cancel Upload controls
 *  • Persistent storage via the existing /api/admin/product-images/upload endpoint
 *  • Optional "Use URL" tab for manual URL entry
 */
import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import imageCompression from 'browser-image-compression';
import {
  Image as ImageIcon, Upload, X, Loader2, Trash2,
  Library, Clipboard, FolderOpen, Check,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MediaImage {
  filename: string;
  url: string;
  size: number;
  modified: string;
}

export interface ImageManagerFieldProps {
  value: string;               // current saved image URL (may be empty)
  onChange: (url: string) => void;
  adminToken: string;
  apiBase: string;
  label?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const VALID_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'image/heic', 'image/heif',
]);
const MAX_RAW_BYTES = 50 * 1024 * 1024; // 50 MB

function isHEIC(file: File) {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.hei[cf]$/i.test(file.name)
  );
}

async function convertHEIC(file: File): Promise<File> {
  // Lazy-load heic2any — it's large (~1.5 MB) and rarely needed
  const mod = await import('heic2any');
  const heic2any = (mod as any).default ?? mod;
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
  const blob: Blob = Array.isArray(result) ? result[0] : result;
  return new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ImageManagerField({
  value, onChange, adminToken, apiBase, label = 'Product Image',
}: ImageManagerFieldProps) {
  const [tab, setTab] = useState<'manager' | 'url'>('manager');
  const [urlInput, setUrlInput] = useState(value);
  const [isDragging, setIsDragging] = useState(false);

  // Pending upload state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Media library
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaImages, setMediaImages] = useState<MediaImage[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaLoading, setMediaLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    clearInterval(progressTimer.current);
  }, []);

  // Keep URL tab in sync with external value
  useEffect(() => { setUrlInput(value); }, [value]);

  // ── Core processing pipeline ─────────────────────────────────────────────────
  const processAndSetFile = useCallback(async (file: File) => {
    const typeOk = VALID_TYPES.has(file.type) || isHEIC(file);
    if (!typeOk) {
      setUploadError('Unsupported type. Use JPEG, PNG, WebP, or HEIC/HEIF.');
      return;
    }
    if (file.size > MAX_RAW_BYTES) {
      setUploadError('File is too large (max 50 MB before processing).');
      return;
    }

    setProcessing(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      // 1. Convert HEIC → JPEG
      let f: File = isHEIC(file) ? await convertHEIC(file) : file;

      // 2. Resize to max 2048px + fix EXIF orientation + compress
      f = await imageCompression(f, {
        maxSizeMB: 4,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.88,
        // exifOrientation: -1 auto-reads EXIF and rotates the canvas accordingly
        exifOrientation: -1 as any,
      });

      // 3. Create object URL for preview
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const previewUrl = URL.createObjectURL(f);
      previewUrlRef.current = previewUrl;
      setPendingFile(f);
      setPendingPreview(previewUrl);
    } catch (err: any) {
      setUploadError(`Processing failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  }, []);

  // ── Document-level paste listener (Cmd+V / Ctrl+V) ──────────────────────────
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      // Don't intercept paste inside text fields
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement
      ) return;
      if (tab !== 'manager') return;

      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find(i => i.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) processAndSetFile(file);
      }
    };
    document.addEventListener('paste', handler);
    return () => document.removeEventListener('paste', handler);
  }, [tab, processAndSetFile]);

  // ── Paste button (Clipboard API) ────────────────────────────────────────────
  const pasteFromClipboard = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const type = item.types.find(t => t.startsWith('image/'));
        if (type) {
          const blob = await item.getType(type);
          const file = new File([blob], `pasted-${Date.now()}.jpg`, { type: 'image/jpeg' });
          await processAndSetFile(file);
          return;
        }
      }
      setUploadError('No image in clipboard. Copy an image first, or use Cmd+V / Ctrl+V.');
    } catch {
      setUploadError('Could not read clipboard — use Cmd+V / Ctrl+V directly instead.');
    }
  };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!pendingFile || uploading) return;
    setUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setUploadProgress(p => (p < 85 ? p + 10 : p));
    }, 250);

    try {
      const base64 = await fileToBase64(pendingFile);
      setUploadProgress(88);

      const res = await fetch(`${apiBase}/admin/product-images/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          filename: pendingFile.name,
          mimeType: pendingFile.type,
          data: base64,
        }),
      });
      const data = await res.json();
      clearInterval(progressTimer.current);

      if (!res.ok) throw new Error(data.error ?? 'Upload failed.');

      setUploadProgress(100);
      setUploadSuccess(true);
      onChange(data.url);

      // Clear pending state after brief success display
      setTimeout(() => {
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        setPendingFile(null);
        setPendingPreview(null);
        setUploading(false);
        setUploadProgress(0);
        setUploadSuccess(false);
      }, 1200);
    } catch (err: any) {
      clearInterval(progressTimer.current);
      setUploadError(err.message ?? 'Upload failed — please try again.');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const cancelPending = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPendingFile(null);
    setPendingPreview(null);
    setUploadError(null);
    setUploadProgress(0);
    clearInterval(progressTimer.current);
  };

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processAndSetFile(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processAndSetFile(file);
    e.target.value = ''; // allow re-selecting same file
  };

  // ── Media Library ────────────────────────────────────────────────────────────
  const loadMediaLibrary = async () => {
    setMediaLoading(true);
    try {
      const res = await fetch(`${apiBase}/admin/product-images/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      setMediaImages(data.images ?? []);
    } catch {
      /* silent */
    } finally {
      setMediaLoading(false);
    }
  };

  const openMedia = () => {
    setMediaSearch('');
    setDeleteConfirm(null);
    setMediaOpen(true);
    loadMediaLibrary();
  };

  const deleteMediaImage = async (filename: string) => {
    try {
      await fetch(`${apiBase}/admin/product-images/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      setMediaImages(prev => prev.filter(i => i.filename !== filename));
      // If the deleted image is the current value, clear it
      if (value.includes(filename)) onChange('');
    } catch {
      /* silent */
    } finally {
      setDeleteConfirm(null);
    }
  };

  const filteredMedia = mediaImages.filter(
    img => !mediaSearch ||
      img.filename.toLowerCase().includes(mediaSearch.toLowerCase()),
  );

  // ── Shared style tokens ──────────────────────────────────────────────────────
  const btnSecondary =
    'px-3 py-1.5 bg-card border border-border text-foreground rounded-lg text-xs font-black uppercase tracking-wider hover:border-primary transition-all flex items-center gap-1.5';

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label className="block text-xs font-black uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 p-1 bg-background border border-border rounded-xl">
        {(['manager', 'url'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              tab === t
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'manager' ? '📁 Image Manager' : '🔗 Use URL'}
          </button>
        ))}
      </div>

      {/* ── URL tab ── */}
      {tab === 'url' && (
        <div>
          <input
            value={urlInput}
            onChange={e => { setUrlInput(e.target.value); onChange(e.target.value); }}
            placeholder="/api/product-images/example.jpg or https://..."
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors font-medium"
          />
          {urlInput && (
            <img
              src={urlInput}
              alt="Preview"
              className="mt-2 w-full h-32 object-contain rounded-xl border border-border bg-background"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      )}

      {/* ── Manager tab ── */}
      {tab === 'manager' && (
        <div
          className="relative space-y-3"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Drag overlay — shown on top of everything while dragging */}
          {isDragging && (
            <div className="absolute inset-0 z-10 rounded-2xl border-2 border-primary bg-primary/10 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Upload size={28} className="text-primary mx-auto mb-2" />
                <p className="text-primary font-black text-sm">Drop to upload</p>
              </div>
            </div>
          )}

          {/* ── Error banner ── */}
          {uploadError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-between gap-2">
              <span>{uploadError}</span>
              <button type="button" onClick={() => setUploadError(null)} className="flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Processing spinner ── */}
          {processing && (
            <div className="rounded-2xl border border-dashed border-primary/50 bg-background p-8 flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground">Processing image…</p>
            </div>
          )}

          {/* ── Pending preview (ready to upload) ── */}
          {pendingFile && pendingPreview && !processing && (
            <div className="rounded-2xl border border-primary/40 bg-background overflow-hidden">
              <img
                src={pendingPreview}
                alt="Preview"
                className="w-full h-44 object-contain bg-black/30"
                style={{ imageOrientation: 'from-image' } as React.CSSProperties}
              />
              <div className="px-4 py-3 border-t border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                  <span className="truncate">{pendingFile.name}</span>
                  <span className="flex-shrink-0 ml-2">{formatBytes(pendingFile.size)}</span>
                </div>

                {/* Progress bar */}
                {(uploading || uploadSuccess) && (
                  <div className="space-y-1">
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${uploadSuccess ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-center font-bold text-muted-foreground">
                      {uploadSuccess
                        ? <span className="text-green-500 flex items-center justify-center gap-1"><Check size={12} /> Uploaded!</span>
                        : `Uploading… ${uploadProgress}%`}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                {!uploading && !uploadSuccess && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUpload}
                      className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Upload size={13} /> Upload Image
                    </button>
                    <button
                      type="button"
                      onClick={cancelPending}
                      className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-black uppercase hover:bg-muted/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Current saved image ── */}
          {value && !pendingFile && !processing && (
            <div className="rounded-2xl border border-border bg-background overflow-hidden">
              <img
                src={value}
                alt="Current image"
                className="w-full h-44 object-contain bg-black/30"
                style={{ imageOrientation: 'from-image' } as React.CSSProperties}
                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.25'; }}
              />
              <div className="px-3 py-2.5 border-t border-border flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium truncate">
                  {value.split('/').pop()}
                </span>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-primary px-2.5 py-1 rounded-lg border border-primary/30 hover:bg-primary/10 transition-all"
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="text-xs font-bold text-destructive px-2.5 py-1 rounded-lg border border-destructive/30 hover:bg-destructive/10 transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Drop zone (no image selected yet) ── */}
          {!value && !pendingFile && !processing && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-4 cursor-pointer transition-all border-border hover:border-primary/50 hover:bg-muted/10 bg-background"
            >
              <ImageIcon size={36} className="text-muted-foreground/40" />
              <p className="text-sm text-center text-muted-foreground font-medium leading-relaxed max-w-xs">
                Drag and drop an image here, paste an image, choose a file, or select from Media Library.
              </p>
              <div
                className="flex flex-wrap gap-2 justify-center"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-black uppercase tracking-wider hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                >
                  <FolderOpen size={13} /> Choose Image
                </button>
                <button type="button" onClick={pasteFromClipboard} className={btnSecondary}>
                  <Clipboard size={13} /> Paste Image
                </button>
                <button type="button" onClick={openMedia} className={btnSecondary}>
                  <Library size={13} /> Media Library
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 font-medium tracking-wide">
                JPEG · PNG · WebP · HEIC/HEIF · Max 50 MB
              </p>
            </div>
          )}

          {/* Extra quick-access buttons when an image is already set */}
          {value && !pendingFile && !processing && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={pasteFromClipboard} className={btnSecondary}>
                <Clipboard size={13} /> Paste Image
              </button>
              <button type="button" onClick={openMedia} className={btnSecondary}>
                <Library size={13} /> Media Library
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="sr-only"
            onChange={onFileInputChange}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Media Library Modal
         ══════════════════════════════════════════════════════════════════════ */}
      {mediaOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0 gap-3">
              <h4 className="font-black text-base flex items-center gap-2 flex-shrink-0">
                <Library size={16} /> Media Library
              </h4>
              <input
                value={mediaSearch}
                onChange={e => setMediaSearch(e.target.value)}
                placeholder="Search by filename…"
                className="flex-1 bg-background border border-border rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary font-medium min-w-0"
              />
              <button
                type="button"
                onClick={() => setMediaOpen(false)}
                className="text-muted-foreground hover:text-foreground flex-shrink-0 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              {mediaLoading ? (
                <div className="flex items-center justify-center h-36">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              ) : filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-36 text-muted-foreground gap-3">
                  <ImageIcon size={36} className="opacity-20" />
                  <p className="text-sm font-medium">
                    {mediaSearch ? 'No images match that search.' : 'No images uploaded yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {filteredMedia.map(img => (
                    <div key={img.filename} className="relative group">
                      {deleteConfirm === img.filename ? (
                        /* Confirm delete overlay */
                        <div className="aspect-square rounded-xl border-2 border-destructive bg-destructive/10 flex flex-col items-center justify-center gap-2 p-2">
                          <p className="text-[10px] font-black text-destructive text-center leading-tight">
                            Delete permanently?
                          </p>
                          <button
                            type="button"
                            onClick={() => deleteMediaImage(img.filename)}
                            className="text-[10px] px-2.5 py-1 bg-destructive text-white rounded-lg font-black"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(null)}
                            className="text-[10px] px-2.5 py-1 bg-muted rounded-lg font-black text-muted-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Thumbnail button — click to select */}
                          <button
                            type="button"
                            onClick={() => { onChange(img.url); setMediaOpen(false); }}
                            title={img.filename}
                            className={`block w-full aspect-square rounded-xl overflow-hidden border-2 transition-all hover:border-primary ${
                              value === img.url
                                ? 'border-primary ring-2 ring-primary/30 shadow-lg'
                                : 'border-border'
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.filename}
                              className="w-full h-full object-cover"
                              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.25'; }}
                            />
                            {value === img.url && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <Check size={20} className="text-primary bg-card rounded-full p-0.5" />
                              </div>
                            )}
                          </button>

                          {/* Filename + size */}
                          <p className="text-[10px] text-muted-foreground truncate mt-1 font-medium leading-tight">
                            {img.filename}
                          </p>
                          <p className="text-[9px] text-muted-foreground/60 leading-tight">
                            {formatBytes(img.size)}
                          </p>

                          {/* Delete button (hover) */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(img.filename)}
                            className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                            title="Delete image"
                          >
                            <Trash2 size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-border px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground font-medium">
                {filteredMedia.length} image{filteredMedia.length !== 1 ? 's' : ''}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={loadMediaLibrary}
                  className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-black uppercase hover:bg-muted transition-colors"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => setMediaOpen(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
