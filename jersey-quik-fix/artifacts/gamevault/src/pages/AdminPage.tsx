import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, Settings, Home, Megaphone, Calendar, 
  Flame, BarChart, LogOut, Download, Upload, 
  Plus, Edit2, Trash2, X, RefreshCcw, Save, LayoutDashboard, Wrench,
  ShoppingBag, Users, ClipboardList, Package, Receipt, UserCheck, RefreshCcw as RefreshCcw2, Briefcase, Image as ImageIcon,
  Check, Mail, BadgePercent, Search, AlertTriangle, ShieldCheck, Clock, Menu
} from 'lucide-react';
import { useSiteData, DEFAULT_CONTENT, mergeWithDefaults, type SiteContent } from '../context/SiteDataContext';
import jerseyLogo from '../assets/jersey-quik-fix-logo.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const SESSION_KEY = "gv_admin_token";

type EmailSubscriber = {
  id: string; email: string; name: string; source: string; createdAt: string;
};

type RepairTicket = {
  id: string; ticket: string; category: string; brand: string; model: string;
  issue: string; name: string; phone: string; email: string; date: string;
  status: string; createdAt: string;
};

type TradeInquiry = {
  id: number; name: string; email: string; phone: string;
  deviceType: string; deviceDescription: string; condition: string;
  notes: string | null; status: string; createdAt: string;
};

type MembershipCode = {
  id: string; email: string; userId: string | null; code: string;
  stripeSessionId: string | null; discountPercent: number;
  isActive: boolean; createdAt: string; expiresAt: string;
};

// Normalized product from /api/admin/products (prices stored as dollars in display state)
type NormProduct = {
  id: string; sku: string; name: string; category: string; subcategory: string | null;
  description: string | null; price: number; oldPrice?: number; priceNote?: string | null;
  condition: string | null; configuration: string | null; stock: string | null;
  images: string[]; badge: string | null; rating: number | null; active: boolean;
  featured: boolean; verified: boolean; verificationNote?: string | null;
  inventoryQuantity: number | null; reserved: number | null;
  createdAt?: string; updatedAt?: string;
};

const NORM_CATEGORIES = ['iPhone','MacBook','Apple','Nintendo','Xbox','PlayStation','Controllers','Arcade Machines','Video Games','Sega / Retro','Tablets','Accessories','Audio','Protection','Chargers','Cases','Cables'];

// Field helper component
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [fileError, setFileError] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function applyFile(file: File) {
    setFileError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Only PNG, JPEG, WebP, or GIF images are accepted.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setFileError('File must be under 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => { if (e.target?.result) onChange(e.target.result as string); };
    reader.readAsDataURL(file);
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) applyFile(file);
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
    e.target.value = '';
  }

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-3 mb-2 cursor-pointer transition-colors text-xs font-medium select-none
          ${dragging ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'}`}
      >
        <Upload size={14} />
        <span>Click or drag &amp; drop an image</span>
        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={onFileChange} />
      </div>

      {/* Validation error */}
      {fileError && (
        <p className="text-xs text-red-400 font-medium mb-2">{fileError}</p>
      )}

      {/* URL input */}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Or paste an image URL..."
        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-primary transition-colors font-medium mb-2"
      />

      {/* Preview */}
      {value && (
        <img
          src={value}
          alt={label}
          className="w-full h-28 object-cover rounded-xl border border-border"
          onError={e => (e.currentTarget.style.display = 'none')}
        />
      )}
    </div>
  );
}

// ── Multi-image gallery field — drag & drop, upload, reorder ──────────────
function ImageGalleryField({
  images,
  onChange,
}: {
  images: string[];
  onChange: (images: string[]) => void;
}) {
  const [urlInput, setUrlInput] = React.useState('');
  const [zoneActive, setZoneActive] = React.useState(false);
  const [uploading, setUploading] = React.useState<string[]>([]);   // filenames in flight
  const [uploadErrors, setUploadErrors] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragIdxRef = React.useRef<number | null>(null);
  const [dropTarget, setDropTarget] = React.useState<number | null>(null);

  // ── server upload ─────────────────────────────────────────────────────────
  async function uploadFile(file: File): Promise<string | null> {
    const UPLOAD_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!UPLOAD_TYPES.includes(file.type)) {
      setUploadErrors(e => [...e, `${file.name}: unsupported type (use JPEG, PNG, WebP, or GIF)`]);
      return null;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadErrors(e => [...e, `${file.name}: must be under 15 MB`]);
      return null;
    }
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = async ev => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        const token = sessionStorage.getItem(SESSION_KEY);
        try {
          const res = await fetch(`${API_BASE}/admin/product-images/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ filename: file.name, data: base64, mimeType: file.type }),
          });
          if (res.ok) {
            const body = await res.json() as { url: string };
            resolve(body.url);
          } else {
            const body = await res.json().catch(() => ({})) as { error?: string };
            setUploadErrors(e => [...e, `${file.name}: ${body.error ?? 'upload failed'}`]);
            resolve(null);
          }
        } catch {
          setUploadErrors(e => [...e, `${file.name}: network error`]);
          resolve(null);
        }
      };
      reader.onerror = () => { setUploadErrors(e => [...e, `${file.name}: read error`]); resolve(null); };
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files: File[]) {
    if (files.length === 0) return;
    setUploadErrors([]);
    setUploading(files.map(f => f.name));
    const results = await Promise.all(files.map(uploadFile));
    const urls = results.filter((u): u is string => u !== null);
    if (urls.length > 0) onChange([...images, ...urls]);
    setUploading([]);
  }

  // ── drop zone (file drops only) ───────────────────────────────────────────
  function onZoneDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    setZoneActive(true);
  }
  function onZoneDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setZoneActive(false);
  }
  function onZoneDrop(e: React.DragEvent) {
    e.preventDefault();
    setZoneActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
  }

  // ── thumbnail drag-to-reorder ─────────────────────────────────────────────
  function onThumbDragStart(e: React.DragEvent, idx: number) {
    dragIdxRef.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));  // marks this as an element drag, not a file drag
  }
  function onThumbDragOver(e: React.DragEvent, idx: number) {
    if (e.dataTransfer.types.includes('Files')) return;  // ignore OS file drags on thumbnails
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== idx) setDropTarget(idx);
  }
  function onThumbDrop(e: React.DragEvent, idx: number) {
    if (e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    const from = dragIdxRef.current;
    dragIdxRef.current = null;
    setDropTarget(null);
    if (from === null || from === idx) return;
    const next = [...images];
    next.splice(idx, 0, next.splice(from, 1)[0]);
    onChange(next);
  }
  function onThumbDragEnd() { dragIdxRef.current = null; setDropTarget(null); }

  function remove(idx: number) { onChange(images.filter((_, i) => i !== idx)); }

  function addUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([...images, trimmed]);
    setUrlInput('');
  }

  const hasItems = images.length > 0 || uploading.length > 0;

  return (
    <div className="space-y-3">
      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Product Images{' '}
        <span className="normal-case font-normal text-muted-foreground/70">
          (first = main · drag thumbnails to reorder)
        </span>
      </label>

      {/* ── Thumbnail grid ── */}
      {hasItems && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((src, idx) => (
            <div
              key={src + idx}
              draggable
              onDragStart={e => onThumbDragStart(e, idx)}
              onDragOver={e => onThumbDragOver(e, idx)}
              onDrop={e => onThumbDrop(e, idx)}
              onDragEnd={onThumbDragEnd}
              className={`relative group rounded-xl overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all select-none
                ${dropTarget === idx
                  ? 'border-primary ring-2 ring-primary/40 scale-105 shadow-lg shadow-primary/20'
                  : idx === 0 ? 'border-primary/50' : 'border-border hover:border-border/80'}
                ${dragIdxRef.current === idx ? 'opacity-30 scale-95' : ''}`}
            >
              <img
                src={src}
                alt={`Product image ${idx + 1}`}
                className="w-full h-20 object-cover pointer-events-none"
                onError={e => { e.currentTarget.style.opacity = '0.15'; }}
              />
              {/* "Main" badge on first image */}
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider leading-none pointer-events-none">
                  Main
                </span>
              )}
              {/* Hover overlay: remove button only — reorder via drag */}
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white rounded-full w-5 h-5 items-center justify-center text-[11px] font-bold hidden group-hover:flex transition-colors"
                title="Remove image"
              >✕</button>
              {/* Drag handle hint */}
              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-white">
                  <circle cx="3" cy="3" r="1"/><circle cx="7" cy="3" r="1"/>
                  <circle cx="3" cy="7" r="1"/><circle cx="7" cy="7" r="1"/>
                </svg>
              </div>
            </div>
          ))}

          {/* Uploading placeholders */}
          {uploading.map((name, i) => (
            <div key={'upload-' + i}
              className="rounded-xl border-2 border-primary/40 border-dashed bg-primary/5 h-20 flex flex-col items-center justify-center gap-1 select-none">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-[9px] text-muted-foreground font-medium px-1 text-center truncate w-full leading-none">
                {name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Drop zone ── */}
      <div
        onDragOver={onZoneDragOver}
        onDragLeave={onZoneDragLeave}
        onDrop={onZoneDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-2xl px-6 py-6 cursor-pointer select-none transition-all duration-150
          ${zoneActive
            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-[1.01]'
            : 'border-border hover:border-primary/50 hover:bg-primary/5'}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
          ${zoneActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          <Upload size={20} />
        </div>
        <div className="text-center">
          <p className={`text-sm font-bold transition-colors ${zoneActive ? 'text-primary' : 'text-foreground'}`}>
            {zoneActive ? 'Release to upload' : 'Drag & drop photos here'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            or <span className="text-primary font-semibold">click to browse</span> · JPEG · PNG · WebP · up to 15 MB · multiple OK
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={e => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (files.length) handleFiles(files);
          }}
        />
      </div>

      {/* Upload errors */}
      {uploadErrors.length > 0 && (
        <div className="space-y-1">
          {uploadErrors.map((err, i) => (
            <p key={i} className="text-xs text-red-400 font-medium flex items-center gap-1">
              <span>⚠</span> {err}
            </p>
          ))}
        </div>
      )}

      {/* ── URL paste ── */}
      <div className="flex gap-2">
        <input
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          placeholder="Or paste an image URL…"
          className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-primary transition-colors font-medium"
        />
        <button
          type="button"
          onClick={addUrl}
          disabled={!urlInput.trim()}
          className="px-4 py-2.5 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-xl font-black text-xs uppercase tracking-wider transition-colors disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [activePanel, setActivePanel] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { content, loaded, saveContent } = useSiteData();
  const [draft, setDraft] = useState<SiteContent>(content);
  const draftInitRef = React.useRef(false);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [emails, setEmails] = useState<EmailSubscriber[]>([]);
  const [tradeInquiries, setTradeInquiries] = useState<TradeInquiry[]>([]);
  
  const [membershipCodes, setMembershipCodes] = useState<MembershipCode[]>([]);
  const [membershipCheckCode, setMembershipCheckCode] = useState('');
  const [membershipCheckResult, setMembershipCheckResult] = useState<{ valid: boolean; message: string; discountPercent?: number; expiresAt?: string; daysLeft?: number } | null>(null);
  const [membershipCheckLoading, setMembershipCheckLoading] = useState(false);

  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // ── Normalized products (from /api/admin/products) ──────────────────────
  const [normProds, setNormProds] = useState<NormProduct[]>([]);
  const [normProdsLoading, setNormProdsLoading] = useState(false);
  const [savingProdId, setSavingProdId] = useState<string | null>(null);
  const [normProdSearch, setNormProdSearch] = useState('');
  const [expandedProdId, setExpandedProdId] = useState<string | null>(null);
  // IDs of products just created via "New Product" but not yet manually saved —
  // the Delete button is hidden for these so accidental clicks on a blank stub
  // don't immediately destroy something the admin hasn't intentionally set up.
  const [freshNormProdIds, setFreshNormProdIds] = useState<Set<string>>(new Set());

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (token) {
      setAdminToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // Initialize draft exactly once from the authoritative content (localStorage or API).
  // Using a ref prevents the API fetch from resetting unsaved admin edits mid-session.
  useEffect(() => {
    if (loaded && !draftInitRef.current) {
      draftInitRef.current = true;
      setDraft(content);
    }
  }, [loaded, content]);

  // Load repairs, emails, trade inquiries, membership codes, and normalized products when token is available
  useEffect(() => {
    if (adminToken) { loadRepairs(); loadEmails(); loadTradeInquiries(); loadMembershipCodes(); loadNormProds(); }
  }, [adminToken]);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toastMsg]);

  const showToast = (msg: string) => setToastMsg(msg);

  const loadRepairs = () => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/repairs`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRepairs(Array.isArray(data) ? data : []))
      .catch(() => setRepairs([]));
  };

  const loadEmails = () => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/emails`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setEmails(Array.isArray(data) ? data : []))
      .catch(() => setEmails([]));
  };

  const loadTradeInquiries = () => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/trade-inquiries`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setTradeInquiries(Array.isArray(data) ? data : []))
      .catch(() => setTradeInquiries([]));
  };

  const loadMembershipCodes = () => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/admin/membership-codes`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setMembershipCodes(Array.isArray(data) ? data : []))
      .catch(() => setMembershipCodes([]));
  };

  // ── Normalized products: load / save / create / update ──────────────────
  const loadNormProds = async () => {
    if (!sessionStorage.getItem(SESSION_KEY)) return;
    setNormProdsLoading(true);
    try {
      const token = sessionStorage.getItem(SESSION_KEY);
      const res = await fetch(`${API_BASE}/admin/products?limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as { products: any[] };
        setNormProds((data.products ?? []).map((p: any) => ({
          ...p,
          price: Number(p.price) / 100,
          oldPrice: p.oldPrice ? Number(p.oldPrice) / 100 : undefined,
          rating: p.rating != null ? Number(p.rating) : null,
          images: p.images ?? [],
        })));
      }
    } finally {
      setNormProdsLoading(false);
    }
  };

  const updateNormProd = (id: string, field: string, value: any) =>
    setNormProds(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));

  const saveNormProd = async (p: NormProduct) => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) { showToast('⚠ Not logged in.'); return; }
    setSavingProdId(p.id);
    try {
      const body: Record<string, any> = {
        name: p.name, sku: p.sku, description: p.description,
        category: p.category, subcategory: p.subcategory || null,
        condition: p.condition || null, active: p.active, featured: p.featured,
        badge: p.badge || null, rating: p.rating,
        price: Math.round(p.price * 100),
        oldPrice: p.oldPrice ? Math.round(p.oldPrice * 100) : null,
        images: p.images ?? [],
        stock: p.stock || null,
        inventoryQuantity: p.inventoryQuantity ?? null,
      };
      const res = await fetch(`${API_BASE}/admin/products/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        // First manual save removes the "fresh" guard so Delete becomes available.
        setFreshNormProdIds(prev => { const s = new Set(prev); s.delete(p.id); return s; });
        showToast(`✓ "${p.name}" saved.`);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`⚠ Save failed: ${(err as any).error || res.status}`);
      }
    } catch {
      showToast('⚠ Network error — changes not saved.');
    } finally {
      setSavingProdId(null);
    }
  };

  const deleteNormProd = async (p: NormProduct) => {
    if (!window.confirm(`Permanently delete "${p.name}"?\n\nThis removes the product from the live catalog and cannot be undone.`)) return;
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) { showToast('⚠ Not logged in.'); return; }
    try {
      const res = await fetch(`${API_BASE}/admin/products/${p.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNormProds(prev => prev.filter(x => x.id !== p.id));
        setFreshNormProdIds(prev => { const s = new Set(prev); s.delete(p.id); return s; });
        if (expandedProdId === p.id) setExpandedProdId(null);
        showToast(`✓ "${p.name}" deleted.`);
      } else {
        const err = await res.json().catch(() => ({})) as any;
        showToast(`⚠ Delete failed: ${err.error || res.status}`);
      }
    } catch (err) {
      console.error('deleteNormProd error:', err);
      showToast('⚠ Network error — product was not deleted.');
    }
  };

  const createNormProd = async () => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) { showToast('⚠ Not logged in.'); return; }
    try {
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'New Product', sku: `PROD-${Date.now()}`, category: 'Accessories', price: 0, active: false }),
      });
      if (res.ok) {
        // Both Express api-server and CF Worker return the product directly,
        // not wrapped in { product: ... }, so read from the top-level object.
        const prod = await res.json() as any;
        const np: NormProduct = {
          ...prod,
          price: Number(prod.price) / 100,
          oldPrice: undefined,
          images: prod.images ?? [],
        };
        setNormProds(prev => [np, ...prev]);
        setExpandedProdId(np.id);
        setFreshNormProdIds(prev => new Set([...prev, np.id]));
        showToast('✓ New product created — edit and save to publish.');
      } else {
        const err = await res.json().catch(() => ({})) as any;
        showToast(`⚠ ${err.error || 'Failed to create product.'}`);
      }
    } catch (err) {
      console.error('createNormProd error:', err);
      showToast('⚠ Network error — please try again.');
    }
  };

  const handleCheckMembershipCode = async () => {
    const code = membershipCheckCode.trim().toUpperCase();
    if (!code) return;
    setMembershipCheckLoading(true);
    setMembershipCheckResult(null);
    try {
      const res = await fetch(`${API_BASE}/membership/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setMembershipCheckResult(data);
    } catch {
      setMembershipCheckResult({ valid: false, message: 'Network error — please try again.' });
    } finally {
      setMembershipCheckLoading(false);
    }
  };

  const handleToggleMembershipCode = async (id: string, currentActive: boolean) => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/membership-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setMembershipCodes(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentActive } : c));
        showToast(currentActive ? 'Code deactivated.' : 'Code reactivated.');
      }
    } catch {
      showToast('Failed to update code.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const { token } = await res.json() as { token: string };
        sessionStorage.setItem(SESSION_KEY, token);
        setAdminToken(token);
        setIsAuthenticated(true);
        setError(false);
      } else {
        setError(true);
        setPassword('');
      }
    } catch {
      setError(true);
      setPassword('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminToken(null);
    setIsAuthenticated(false);
  };

  const handleSaveChanges = async () => {
    if (!adminToken) {
      showToast('⚠ Not logged in — changes not saved.');
      return;
    }
    try {
      // 1. Persist to DB
      const r = await fetch(`${API_BASE}/site-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(draft),
      });
      if (!r.ok) {
        showToast('⚠ Save failed — please try again.');
        return;
      }
      // 2. Re-fetch confirmed data from DB → update context + localStorage so
      //    ALL live pages immediately show exactly what was persisted
      const freshResp = await fetch(`${API_BASE}/site-content`, { cache: 'no-store' });
      if (freshResp.ok) {
        const freshData = await freshResp.json();
        if (freshData && typeof freshData === 'object') {
          saveContent(mergeWithDefaults(freshData));
        }
      }
      showToast('✓ Changes saved to site!');
    } catch {
      showToast('⚠ Network error — changes not saved.');
    }
  };

  // Helper Setters
  const setRepairField = (field: string, value: any) =>
    setDraft(p => ({ ...p, repair: { ...p.repair, [field]: value } }));

  const setShopField = (field: string, value: any) =>
    setDraft(p => ({ ...p, shop: { ...p.shop, [field]: value } }));

  const setCommunityField = (field: string, value: any) =>
    setDraft(p => ({ ...p, community: { ...p.community, [field]: value } }));

  const setSettingsField = (field: string, value: any) =>
    setDraft(p => ({ ...p, settings: { ...p.settings, [field]: value } }));

  const updateArrayItem = (
    section: keyof SiteContent,
    id: string,
    field: string,
    value: any
  ) =>
    setDraft(p => {
      if (section === 'shop') {
        return {
          ...p,
          shop: {
            ...p.shop,
            products: (p.shop.products ?? []).map((item: any) =>
              item.id === id ? { ...item, [field]: value } : item
            ),
          },
        };
      }

      return {
        ...p,
        [section]: ((p[section] as any[]) ?? []).map((item: any) =>
          item.id === id ? { ...item, [field]: value } : item
        ),
      };
    });

  const deleteArrayItem = (section: keyof SiteContent, id: string) =>
    setDraft(p => ({
      ...p,
      [section]: (p[section] as any[]).filter((item: any) => item.id !== id)
    }));

  const updateRepairArray = (field: string, id: string, key: string, value: any) =>
    setDraft(p => ({
      ...p,
      repair: {
        ...p.repair,
        [field]: (p.repair as any)[field].map((item: any) =>
          item.id === id ? { ...item, [key]: value } : item
        )
      }
    }));

  const deleteRepairArrayItem = (field: string, id: string) =>
    setDraft(p => ({
      ...p,
      repair: {
        ...p.repair,
        [field]: (p.repair as any)[field].filter((item: any) => item.id !== id)
      }
    }));

  const addRepairArrayItem = (field: string, item: any) =>
    setDraft(p => ({
      ...p,
      repair: { ...p.repair, [field]: [...(p.repair as any)[field], item] }
    }));

  const updateCommunityArray = (field: string, id: string, key: string, value: any) =>
    setDraft(p => ({
      ...p,
      community: {
        ...p.community,
        [field]: (p.community as any)[field].map((item: any) =>
          item.id === id ? { ...item, [key]: value } : item
        )
      }
    }));

  const deleteCommunityArrayItem = (field: string, id: string) =>
    setDraft(p => ({
      ...p,
      community: {
        ...p.community,
        [field]: (p.community as any)[field].filter((item: any) => item.id !== id)
      }
    }));

  const addCommunityArrayItem = (field: string, item: any) =>
    setDraft(p => ({
      ...p,
      community: { ...p.community, [field]: [...(p.community as any)[field], item] }
    }));

  // Styles
  const inputCls = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-primary transition-colors font-medium";
  const textareaCls = inputCls + " resize-none min-h-[80px]";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5";
  const sectionHeadCls = "text-xs font-black uppercase tracking-widest text-primary mb-4 border-b border-border pb-3";
  const cardCls = "bg-card border border-border rounded-2xl p-5 mb-4";
  const addBtnCls = "flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-xl font-black text-xs uppercase tracking-wider transition-colors w-max";
  const deleteBtnCls = "text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors flex-shrink-0";

  const panels = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Repair Page', icon: <Wrench size={18} /> },
    { name: 'Shop Page', icon: <ShoppingBag size={18} /> },
    { name: 'Community', icon: <Users size={18} /> },
    { name: 'Repair Tickets', icon: <ClipboardList size={18} /> },
    { name: 'Inventory', icon: <Package size={18} /> },
    { name: 'Orders', icon: <Receipt size={18} /> },
    { name: 'Customers', icon: <UserCheck size={18} /> },
    { name: 'Trade-Ins', icon: <RefreshCcw2 size={18} /> },
    { name: 'Employees', icon: <Briefcase size={18} /> },
    { name: 'Email List', icon: <Mail size={18} /> },
    { name: 'Memberships', icon: <BadgePercent size={18} /> },
    { name: 'Settings', icon: <Settings size={18} /> }
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-primary-foreground">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-card border border-border p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-3 mb-4 flex items-center justify-center">
              <img src={jerseyLogo} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground">Admin Portal</h1>
            <p className="text-primary font-bold text-sm tracking-widest uppercase mt-1">Jersey Quik Fix</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-background border-2 border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none transition-all font-bold text-center"
                autoFocus
              />
              {error && (
                <p className="text-destructive font-bold text-sm text-center mt-2">Incorrect password.</p>
              )}
            </div>
            <button 
              type="submit"
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Enter Control Center
            </button>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest text-center">
              Authorized staff only
            </p>
          </form>

          <Link href="/" className="mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
            <Home size={13} /> Back to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  const membershipNow = new Date();
  const membershipActive = membershipCodes.filter(c => c.isActive && new Date(c.expiresAt) > membershipNow);
  const membershipExpired = membershipCodes.filter(c => new Date(c.expiresAt) <= membershipNow);
  const membershipDeactivated = membershipCodes.filter(c => !c.isActive && new Date(c.expiresAt) > membershipNow);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex font-sans selection:bg-primary selection:text-primary-foreground">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed column on desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-secondary flex-shrink-0 border-r border-border flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:z-auto
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <img src={jerseyLogo} alt="JQF" className="h-8 w-8 object-contain bg-primary text-primary-foreground p-1 rounded-lg" />
            <span className="text-xl font-black tracking-tight uppercase italic text-secondary-foreground">
              JQF Admin
            </span>
          </div>
          <button
            className="md:hidden text-secondary-foreground/70 hover:text-secondary-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {panels.map(panel => (
            <button
              key={panel.name}
              onClick={() => { setActivePanel(panel.name); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activePanel === panel.name 
                  ? 'bg-primary/20 text-primary border-l-2 border-primary' 
                  : 'text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-card/50 border-l-2 border-transparent'
              }`}
            >
              {panel.icon} {panel.name}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border space-y-2 shrink-0">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <Home size={14} /> Back to Site
          </Link>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors mt-2"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden flex items-center justify-center text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary leading-none mb-1">
                ADMIN CONTROL PANEL
              </div>
              <h2 className="text-xl font-black uppercase italic tracking-tight leading-none">
                {activePanel}
              </h2>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSaveChanges}
              className="flex items-center gap-2 px-4 md:px-6 py-2 bg-primary text-primary-foreground rounded-xl font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <Save size={16} /> <span className="hidden sm:inline">Save Changes</span><span className="sm:hidden">Save</span>
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            {toastMsg && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold uppercase tracking-wider shadow-2xl z-50 flex items-center gap-3">
                <Check size={18} /> {toastMsg}
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* Dashboard */}
                {activePanel === 'Dashboard' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-card border border-primary/40 rounded-2xl p-6 col-span-2 md:col-span-1 cursor-pointer hover:border-primary transition-colors" onClick={() => setActivePanel('Repair Tickets')}>
                        <div className="text-3xl font-black text-primary mb-1">{repairs.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Repair Tickets</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{(draft.shop.products ?? []).length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Products</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{draft.inventory.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Inventory</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{draft.customers.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customers</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{draft.employees.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Employees</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => setActivePanel('Email List')}>
                        <div className="text-3xl font-black text-primary mb-1">{emails.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subscribers</div>
                      </div>
                    </div>
                    <div className="bg-secondary border border-border rounded-3xl p-6 text-center text-secondary-foreground flex flex-col items-center gap-4">
                      <p className="font-bold text-sm tracking-wide">
                        Every change saved here updates the live website instantly.
                      </p>
                      <button 
                        onClick={handleSaveChanges}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      >
                        <Save size={16} /> Save All Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Repair Page */}
                {activePanel === 'Repair Page' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className={sectionHeadCls}>Hero Content</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Eyebrow Text</label>
                          <input value={draft.repair.heroEyebrow} onChange={e => setRepairField('heroEyebrow', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Headline</label>
                          <input value={draft.repair.heroHeadline} onChange={e => setRepairField('heroHeadline', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Accent Word</label>
                          <input value={draft.repair.heroAccent} onChange={e => setRepairField('heroAccent', e.target.value)} className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Subtitle</label>
                          <textarea value={draft.repair.heroSubtitle} onChange={e => setRepairField('heroSubtitle', e.target.value)} className={textareaCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Primary Button</label>
                          <input value={draft.repair.primaryBtn} onChange={e => setRepairField('primaryBtn', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Secondary Button</label>
                          <input value={draft.repair.secondaryBtn} onChange={e => setRepairField('secondaryBtn', e.target.value)} className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Promo Banner</label>
                          <input value={draft.repair.promoBanner} onChange={e => setRepairField('promoBanner', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Hero Card Title</label>
                          <input value={draft.repair.heroCardTitle} onChange={e => setRepairField('heroCardTitle', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Hero Card Description</label>
                          <input value={draft.repair.heroCardDesc} onChange={e => setRepairField('heroCardDesc', e.target.value)} className={inputCls} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Booking Form</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Form Headline</label>
                          <input value={draft.repair.formHeadline} onChange={e => setRepairField('formHeadline', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Form Subtitle</label>
                          <input value={draft.repair.formSubtitle} onChange={e => setRepairField('formSubtitle', e.target.value)} className={inputCls} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Hero Images</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ImageField label="Hero Background Photo" value={draft.repair.heroBgImage} onChange={v => setRepairField('heroBgImage', v)} />
                        <ImageField label="Hero Side Photo (Leave empty for fallback)" value={draft.repair.heroSideImage} onChange={v => setRepairField('heroSideImage', v)} />
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Checklist Items</h3>
                      {draft.repair.checklistItems.map((item, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input value={item} onChange={e => {
                            const newArr = [...draft.repair.checklistItems];
                            newArr[i] = e.target.value;
                            setRepairField('checklistItems', newArr);
                          }} className={inputCls} />
                          <button onClick={() => {
                            setRepairField('checklistItems', draft.repair.checklistItems.filter((_, idx) => idx !== i));
                          }} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => setRepairField('checklistItems', [...draft.repair.checklistItems, 'New Item'])} className={addBtnCls}><Plus size={14} /> Add Item</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Why Us Section</h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div><label className={labelCls}>Headline</label><input value={draft.repair.whyUsHeadline} onChange={e => setRepairField('whyUsHeadline', e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Accent Word</label><input value={draft.repair.whyUsAccent} onChange={e => setRepairField('whyUsAccent', e.target.value)} className={inputCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>Subtitle</label><textarea value={draft.repair.whyUsSubtitle} onChange={e => setRepairField('whyUsSubtitle', e.target.value)} className={textareaCls} /></div>
                        <div className="md:col-span-2"><ImageField label="Why Us Background Photo" value={draft.repair.whyUsBgImage} onChange={v => setRepairField('whyUsBgImage', v)} /></div>
                      </div>
                      
                      <h4 className="text-sm font-bold uppercase mb-2">Why Us Points</h4>
                      {draft.repair.whyUsPoints.map(point => (
                        <div key={point.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <input value={point.title} onChange={e => updateRepairArray('whyUsPoints', point.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                            <textarea value={point.desc} onChange={e => updateRepairArray('whyUsPoints', point.id, 'desc', e.target.value)} className={textareaCls} placeholder="Description" />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('whyUsPoints', point.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('whyUsPoints', { id: crypto.randomUUID(), title: 'New Point', desc: '' })} className={addBtnCls}><Plus size={14} /> Add Point</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Device Categories</h3>
                      {draft.repair.devices.map(dev => (
                        <div key={dev.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid md:grid-cols-2 gap-2">
                              <input value={dev.title} onChange={e => updateRepairArray('devices', dev.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                              <input value={dev.desc} onChange={e => updateRepairArray('devices', dev.id, 'desc', e.target.value)} className={inputCls} placeholder="Description" />
                            </div>
                            <ImageField label="Image" value={dev.image} onChange={v => updateRepairArray('devices', dev.id, 'image', v)} />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('devices', dev.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('devices', { id: crypto.randomUUID(), title: 'New Device', desc: '', image: '' })} className={addBtnCls}><Plus size={14} /> Add Device</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Customer Reviews</h3>
                      {draft.repair.reviews.map(rev => (
                        <div key={rev.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid md:grid-cols-2 gap-2">
                              <input value={rev.name} onChange={e => updateRepairArray('reviews', rev.id, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                              <input value={rev.device} onChange={e => updateRepairArray('reviews', rev.id, 'device', e.target.value)} className={inputCls} placeholder="Repair Type" />
                            </div>
                            <textarea value={rev.text} onChange={e => updateRepairArray('reviews', rev.id, 'text', e.target.value)} className={textareaCls} placeholder="Review Text" />
                            <ImageField label="Avatar" value={rev.avatar} onChange={v => updateRepairArray('reviews', rev.id, 'avatar', v)} />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('reviews', rev.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('reviews', { id: crypto.randomUUID(), name: 'New User', device: '', text: '', avatar: '' })} className={addBtnCls}><Plus size={14} /> Add Review</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>FAQs</h3>
                      {draft.repair.faqs.map(faq => (
                        <div key={faq.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <input value={faq.q} onChange={e => updateRepairArray('faqs', faq.id, 'q', e.target.value)} className={inputCls} placeholder="Question" />
                            <textarea value={faq.a} onChange={e => updateRepairArray('faqs', faq.id, 'a', e.target.value)} className={textareaCls} placeholder="Answer" />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('faqs', faq.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('faqs', { id: crypto.randomUUID(), q: 'New FAQ', a: '' })} className={addBtnCls}><Plus size={14} /> Add FAQ</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Services Grid</h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div><label className={labelCls}>Section Headline</label><input value={(draft.repair as any).servicesHeadline ?? 'We fix what'} onChange={e => setRepairField('servicesHeadline' as any, e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Accent (colored) Word</label><input value={(draft.repair as any).servicesAccent ?? 'matters most.'} onChange={e => setRepairField('servicesAccent' as any, e.target.value)} className={inputCls} /></div>
                      </div>
                      {((draft.repair as any).services ?? []).map((svc: any) => (
                        <div key={svc.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 grid md:grid-cols-2 gap-2">
                            <input value={svc.title} onChange={e => updateRepairArray('services' as any, svc.id, 'title', e.target.value)} className={inputCls} placeholder="Service Name" />
                            <input value={svc.desc} onChange={e => updateRepairArray('services' as any, svc.id, 'desc', e.target.value)} className={inputCls} placeholder="Short Description" />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('services' as any, svc.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('services' as any, { id: crypto.randomUUID(), title: 'New Service', desc: '' })} className={addBtnCls}><Plus size={14} /> Add Service</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Locations</h3>
                      <div className="mb-4">
                        <ImageField label="Locations Background" value={draft.repair.locationsBgImage} onChange={v => setRepairField('locationsBgImage', v)} />
                      </div>
                      {draft.repair.locations.map(loc => (
                        <div key={loc.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 grid md:grid-cols-2 gap-2">
                            <input value={loc.city} onChange={e => updateRepairArray('locations', loc.id, 'city', e.target.value)} className={inputCls} placeholder="City" />
                            <input value={loc.address} onChange={e => updateRepairArray('locations', loc.id, 'address', e.target.value)} className={inputCls} placeholder="Address" />
                            <input value={loc.distance} onChange={e => updateRepairArray('locations', loc.id, 'distance', e.target.value)} className={inputCls} placeholder="Distance" />
                            <input value={loc.open} onChange={e => updateRepairArray('locations', loc.id, 'open', e.target.value)} className={inputCls} placeholder="Hours" />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('locations', loc.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('locations', { id: crypto.randomUUID(), city: 'New City', address: '', distance: '', open: '' })} className={addBtnCls}><Plus size={14} /> Add Location</button>
                    </div>
                  </div>
                )}

                {/* Shop Page */}
                {activePanel === 'Shop Page' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className={sectionHeadCls}>Hero Section</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><label className={labelCls}>Headline</label><input value={draft.shop.heroHeadline} onChange={e => setShopField('heroHeadline', e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Accent</label><input value={draft.shop.heroAccent} onChange={e => setShopField('heroAccent', e.target.value)} className={inputCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>Subtitle</label><textarea value={draft.shop.heroSubtitle} onChange={e => setShopField('heroSubtitle', e.target.value)} className={textareaCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>Promo Banner</label><input value={draft.shop.promoBanner} onChange={e => setShopField('promoBanner', e.target.value)} className={inputCls} /></div>
                        <div className="md:col-span-2"><ImageField label="Hero Background" value={draft.shop.heroImage} onChange={v => setShopField('heroImage', v)} /></div>
                      </div>
                    </div>

                    {/* ── Products (165-product normalized catalog) ── */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={sectionHeadCls}>
                          Products
                          {normProds.length > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground normal-case">({normProds.length} total)</span>}
                        </h3>
                        <button onClick={createNormProd} className={addBtnCls}><Plus size={14} /> New Product</button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3 font-medium">
                        Each product saves individually to the live catalog. Use the search to find specific products. Changes are saved instantly when you click Save.
                      </p>

                      {normProdsLoading ? (
                        <div className="text-center py-10 text-muted-foreground text-sm flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          Loading {normProds.length > 0 ? `${normProds.length} products` : 'products'}…
                        </div>
                      ) : (
                        <>
                          <input
                            type="search"
                            value={normProdSearch}
                            onChange={e => setNormProdSearch(e.target.value)}
                            placeholder="Search by name, SKU, or category…"
                            className={inputCls + " mb-3"}
                          />
                          <div className="space-y-2">
                            {normProds
                              .filter(p => !normProdSearch.trim() || [p.name, p.sku, p.category, p.subcategory ?? ''].join(' ').toLowerCase().includes(normProdSearch.toLowerCase().trim()))
                              .map(p => (
                                <div key={p.id} className={cardCls + " !p-3"}>
                                  {/* ── Collapsed header ── */}
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-bold text-sm truncate">{p.name || 'Unnamed Product'}</div>
                                      <div className="text-xs text-muted-foreground font-mono truncate">{p.sku} · {p.category}{p.subcategory ? ` / ${p.subcategory}` : ''}</div>
                                    </div>
                                    {/* Status */}
                                    <button
                                      type="button"
                                      onClick={() => updateNormProd(p.id, 'active', !p.active)}
                                      className={`shrink-0 px-2 py-1 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${p.active ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-muted text-muted-foreground border-border'}`}
                                    >{p.active ? '● Live' : '○ Hidden'}</button>
                                    {/* Expand/collapse */}
                                    <button
                                      onClick={() => setExpandedProdId(expandedProdId === p.id ? null : p.id)}
                                      className="shrink-0 px-2 py-1 rounded-lg border border-border text-xs font-bold hover:border-primary/50 transition-colors"
                                    >{expandedProdId === p.id ? '↑ Close' : '↓ Edit'}</button>
                                    {/* Save */}
                                    {savingProdId === p.id ? (
                                      <span className="shrink-0 text-xs text-muted-foreground">Saving…</span>
                                    ) : (
                                      <button
                                        onClick={() => saveNormProd(p)}
                                        className="shrink-0 px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-black hover:bg-primary/20 transition-colors flex items-center gap-1"
                                      ><Save size={12} /> Save</button>
                                    )}
                                  </div>

                                  {/* ── Expanded editor ── */}
                                  {expandedProdId === p.id && (
                                    <div className="pt-4 mt-3 border-t border-border space-y-4">
                                      {/* Row 1: Name + SKU */}
                                      <div className="grid grid-cols-2 gap-2">
                                        <div><label className={labelCls}>Product Name</label>
                                          <input value={p.name} onChange={e => updateNormProd(p.id, 'name', e.target.value)} className={inputCls} /></div>
                                        <div><label className={labelCls}>SKU</label>
                                          <input value={p.sku} onChange={e => updateNormProd(p.id, 'sku', e.target.value)} className={inputCls} /></div>
                                      </div>
                                      {/* Row 2: Description */}
                                      <div><label className={labelCls}>Description</label>
                                        <textarea value={p.description ?? ''} onChange={e => updateNormProd(p.id, 'description', e.target.value)} className={textareaCls} rows={3} /></div>
                                      {/* Row 3: Category + Subcategory + Condition + Stock */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div><label className={labelCls}>Category</label>
                                          <select value={p.category} onChange={e => updateNormProd(p.id, 'category', e.target.value)} className={inputCls}>
                                            {NORM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                          </select></div>
                                        <div><label className={labelCls}>Subcategory</label>
                                          <input value={p.subcategory ?? ''} onChange={e => updateNormProd(p.id, 'subcategory', e.target.value || null)} className={inputCls} /></div>
                                        <div><label className={labelCls}>Condition</label>
                                          <select value={p.condition ?? ''} onChange={e => updateNormProd(p.id, 'condition', e.target.value || null)} className={inputCls}>
                                            {['','New','Like New','Excellent','Good','Fair','Refurbished'].map(c => <option key={c} value={c}>{c || 'Not specified'}</option>)}
                                          </select></div>
                                        <div><label className={labelCls}>Qty in Stock</label>
                                          <input type="number" min="0" value={p.inventoryQuantity ?? 0} onChange={e => updateNormProd(p.id, 'inventoryQuantity', Number(e.target.value))} className={inputCls} /></div>
                                      </div>
                                      {/* Row 4: Prices + Badge + Rating */}
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        <div><label className={labelCls}>Price ($)</label>
                                          <input type="number" step="0.01" min="0" value={p.price} onChange={e => updateNormProd(p.id, 'price', Number(e.target.value))} className={inputCls} /></div>
                                        <div><label className={labelCls}>Original Price ($)</label>
                                          <input type="number" step="0.01" min="0" value={p.oldPrice ?? ''} onChange={e => updateNormProd(p.id, 'oldPrice', e.target.value ? Number(e.target.value) : undefined)} className={inputCls} placeholder="Struck-through" /></div>
                                        <div><label className={labelCls}>Badge</label>
                                          <input value={p.badge ?? ''} onChange={e => updateNormProd(p.id, 'badge', e.target.value || null)} className={inputCls} placeholder="e.g. New, Sale" /></div>
                                        <div><label className={labelCls}>Rating (0–5)</label>
                                          <input type="number" step="0.1" min="0" max="5" value={p.rating ?? 4.5} onChange={e => updateNormProd(p.id, 'rating', Number(e.target.value))} className={inputCls} /></div>
                                      </div>
                                      {/* Images */}
                                      <ImageGalleryField
                                        images={p.images ?? []}
                                        onChange={imgs => updateNormProd(p.id, 'images', imgs)}
                                      />
                                      {/* Bottom action row: Delete (left) · Save (right) */}
                                      <div className="flex items-center justify-between pt-1">
                                        {/* Delete — hidden for brand-new unsaved stubs */}
                                        {!freshNormProdIds.has(p.id) ? (
                                          <button
                                            onClick={() => deleteNormProd(p)}
                                            className="px-3 py-2 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm font-black hover:bg-destructive/20 transition-colors flex items-center gap-2"
                                          ><Trash2 size={14} /> Delete</button>
                                        ) : (
                                          <span className="text-xs text-muted-foreground italic">Save first to unlock delete</span>
                                        )}
                                        <button
                                          onClick={() => saveNormProd(p)}
                                          disabled={savingProdId === p.id}
                                          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-black text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                        ><Save size={14} /> {savingProdId === p.id ? 'Saving…' : 'Save Product'}</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            {normProds.filter(p => !normProdSearch.trim() || [p.name, p.sku, p.category, p.subcategory ?? ''].join(' ').toLowerCase().includes(normProdSearch.toLowerCase().trim())).length === 0 && (
                              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                                No products match "<strong>{normProdSearch}</strong>"
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Promo Cards</h3>
                      {(draft.shop.promoCards ?? []).map((card: any) => (
                        <div key={card.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div><label className={labelCls}>Eyebrow</label><input value={card.eyebrow} onChange={e => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.map((c: any) => c.id === card.id ? {...c, eyebrow: e.target.value} : c)}}))} className={inputCls} /></div>
                              <div><label className={labelCls}>Button Text</label><input value={card.buttonText} onChange={e => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.map((c: any) => c.id === card.id ? {...c, buttonText: e.target.value} : c)}}))} className={inputCls} /></div>
                            </div>
                            <div><label className={labelCls}>Headline</label><input value={card.headline} onChange={e => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.map((c: any) => c.id === card.id ? {...c, headline: e.target.value} : c)}}))} className={inputCls} /></div>
                            <ImageField label="Background Image" value={card.image} onChange={(v: string) => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.map((c: any) => c.id === card.id ? {...c, image: v} : c)}}))} />
                          </div>
                          <button onClick={() => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.filter((c: any) => c.id !== card.id)}}))} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => setDraft(d => ({...d, shop: {...d.shop, promoCards: [...(d.shop.promoCards ?? []), { id: crypto.randomUUID(), eyebrow: 'New Section', headline: 'Promo Title', buttonText: 'Shop Now', image: '' }]}}))} className={addBtnCls}><Plus size={14} /> Add Promo Card</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>JQF+ Membership</h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelCls}>Badge Name (e.g. JQF+)</label>
                          <input value={(draft.shop as any).membership?.headline ?? 'JQF+'} onChange={e => setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, headline: e.target.value}}}))} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Price ($/year)</label>
                          <input type="number" step="0.01" value={(draft.shop as any).membership?.price ?? 14.99} onChange={e => setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, price: Number(e.target.value)}}}))} className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Subtitle / Tagline</label>
                          <input value={(draft.shop as any).membership?.subtitle ?? ''} onChange={e => setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, subtitle: e.target.value}}}))} className={inputCls} />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold uppercase mb-2">Member Perks</h4>
                      {((draft.shop as any).membership?.perks ?? []).map((perk: string, i: number) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input value={perk} onChange={e => {
                            const perks = [...((draft.shop as any).membership?.perks ?? [])];
                            perks[i] = e.target.value;
                            setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, perks}}}));
                          }} className={inputCls} placeholder="Perk description" />
                          <button onClick={() => {
                            const perks = ((draft.shop as any).membership?.perks ?? []).filter((_: any, idx: number) => idx !== i);
                            setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, perks}}}));
                          }} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const perks = [...((draft.shop as any).membership?.perks ?? []), 'New perk'];
                        setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, perks}}}));
                      }} className={addBtnCls}><Plus size={14} /> Add Perk</button>
                    </div>
                  </div>
                )}

                {/* Community Page */}
                {activePanel === 'Community' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className={sectionHeadCls}>Hero Section</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label className={labelCls}>Headline</label><textarea value={draft.community.heroHeadline} onChange={e => setCommunityField('heroHeadline', e.target.value)} className={textareaCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>Subtitle</label><textarea value={draft.community.heroSubtitle} onChange={e => setCommunityField('heroSubtitle', e.target.value)} className={textareaCls} /></div>
                        <div><label className={labelCls}>Promo Banner</label><input value={draft.community.promoBanner} onChange={e => setCommunityField('promoBanner', e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Countdown Target</label><input type="datetime-local" value={draft.community.countdownTarget} onChange={e => setCommunityField('countdownTarget', e.target.value)} className={inputCls} /></div>
                        <div className="md:col-span-2"><ImageField label="Hero Background" value={draft.community.heroBgImage} onChange={v => setCommunityField('heroBgImage', v)} /></div>
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Announcements</h3>
                      {draft.community.announcements.map(ann => (
                        <div key={ann.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input value={ann.title} onChange={e => updateCommunityArray('announcements', ann.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                              <input value={ann.badge} onChange={e => updateCommunityArray('announcements', ann.id, 'badge', e.target.value)} className={inputCls} placeholder="Badge" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input value={ann.date} onChange={e => updateCommunityArray('announcements', ann.id, 'date', e.target.value)} className={inputCls} placeholder="Date" />
                              <select value={ann.featured ? 'Yes' : 'No'} onChange={e => updateCommunityArray('announcements', ann.id, 'featured', e.target.value === 'Yes')} className={inputCls}>
                                <option>Yes</option><option>No</option>
                              </select>
                            </div>
                            <textarea value={ann.desc} onChange={e => updateCommunityArray('announcements', ann.id, 'desc', e.target.value)} className={textareaCls} placeholder="Description" />
                            <ImageField label="Image" value={ann.image} onChange={v => updateCommunityArray('announcements', ann.id, 'image', v)} />
                          </div>
                          <button onClick={() => deleteCommunityArrayItem('announcements', ann.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addCommunityArrayItem('announcements', { id: crypto.randomUUID(), badge: 'New', date: new Date().toLocaleDateString('en-US',{month:'long',day:'numeric'}), title: 'New Announcement', desc: '', featured: false, image: '' })} className={addBtnCls}><Plus size={14} /> Add Announcement</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Events</h3>
                      {draft.community.events.map(ev => (
                        <div key={ev.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input value={ev.title} onChange={e => updateCommunityArray('events', ev.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                              <input value={ev.badge} onChange={e => updateCommunityArray('events', ev.id, 'badge', e.target.value)} className={inputCls} placeholder="Badge" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="date" value={ev.date} onChange={e => updateCommunityArray('events', ev.id, 'date', e.target.value)} className={inputCls} />
                              <input type="time" value={ev.time} onChange={e => updateCommunityArray('events', ev.id, 'time', e.target.value)} className={inputCls} />
                              <input value={ev.location} onChange={e => updateCommunityArray('events', ev.id, 'location', e.target.value)} className={inputCls} placeholder="Location" />
                            </div>
                            <textarea value={ev.desc} onChange={e => updateCommunityArray('events', ev.id, 'desc', e.target.value)} className={textareaCls} placeholder="Description" />
                          </div>
                          <button onClick={() => deleteCommunityArrayItem('events', ev.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addCommunityArrayItem('events', { id: crypto.randomUUID(), date: '', badge: 'Event', time: '', endTime: '', title: 'New Event', location: '', desc: '' })} className={addBtnCls}><Plus size={14} /> Add Event</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Actions Section</h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div><label className={labelCls}>Section Eyebrow</label><input value={(draft.community as any).actionsEyebrow ?? 'GROUP EFFORTS'} onChange={e => setCommunityField('actionsEyebrow', e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Section Headline</label><input value={(draft.community as any).actionsHeadline ?? 'Big Actions Happening'} onChange={e => setCommunityField('actionsHeadline', e.target.value)} className={inputCls} /></div>
                      </div>
                      {draft.community.actions.map(act => (
                        <div key={act.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <input value={act.icon} onChange={e => updateCommunityArray('actions', act.id, 'icon', e.target.value)} className={inputCls} placeholder="Icon (emoji)" />
                              <input value={act.title} onChange={e => updateCommunityArray('actions', act.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                              <input value={act.badge} onChange={e => updateCommunityArray('actions', act.id, 'badge', e.target.value)} className={inputCls} placeholder="Badge" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="number" value={act.progress} onChange={e => updateCommunityArray('actions', act.id, 'progress', Number(e.target.value))} className={inputCls} placeholder="Progress %" />
                              <input type="number" value={act.volunteers} onChange={e => updateCommunityArray('actions', act.id, 'volunteers', Number(e.target.value))} className={inputCls} placeholder="Volunteers" />
                            </div>
                            <textarea value={act.desc} onChange={e => updateCommunityArray('actions', act.id, 'desc', e.target.value)} className={textareaCls} placeholder="Description" />
                            <ImageField label="Image" value={act.image} onChange={v => updateCommunityArray('actions', act.id, 'image', v)} />
                          </div>
                          <button onClick={() => deleteCommunityArrayItem('actions', act.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addCommunityArrayItem('actions', { id: crypto.randomUUID(), icon: '⭐', badge: 'Planning', title: 'New Action', desc: '', progress: 0, volunteers: 0, image: '' })} className={addBtnCls}><Plus size={14} /> Add Action</button>
                    </div>
                  </div>
                )}

                {/* Repair Tickets Panel */}
                {activePanel === 'Repair Tickets' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={sectionHeadCls}>Repair Requests</h3>
                      <button onClick={() => { loadRepairs(); showToast('Refreshed.'); }} className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors">
                        <RefreshCcw size={14} /> Refresh
                      </button>
                    </div>

                    {repairs.length === 0 ? (
                      <div className="bg-card border border-border rounded-3xl p-16 text-center">
                        <p className="text-muted-foreground font-medium">No requests yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...repairs].reverse().map(r => (
                          <div key={r.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="bg-primary/10 text-primary font-black text-xs tracking-wider px-3 py-1.5 rounded-lg">{r.ticket}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black mb-1">{r.name} · {r.phone}</div>
                              <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <span>{r.category}</span>
                                <span>{r.brand} {r.model}</span>
                                <span>{r.issue}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {(() => {
                                const statusColors: Record<string, string> = {
                                  'Checked In':       'text-blue-400',
                                  'Diagnosing':       'text-yellow-400',
                                  'Parts Ordered':    'text-orange-400',
                                  'In Repair':        'text-primary',
                                  'Quality Check':    'text-purple-400',
                                  'Ready for Pickup': 'text-green-400',
                                  'Completed':        'text-green-400',
                                  'On Hold':          'text-yellow-400',
                                  'Cancelled':        'text-red-400',
                                };
                                return (
                                  <select
                                    value={r.status}
                                    onChange={e => {
                                      const newStatus = e.target.value;
                                      if (!adminToken) return;
                                      fetch(`${API_BASE}/repairs/${r.id}/status`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                                        body: JSON.stringify({ status: newStatus }),
                                      }).then(res => {
                                        if (res.ok) {
                                          setRepairs(prev => prev.map(x => x.id === r.id ? { ...x, status: newStatus } : x));
                                          showToast('Status updated.');
                                        } else showToast('Failed to update.');
                                      }).catch(() => showToast('Failed.'));
                                    }}
                                    className={`bg-background border border-border rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-primary transition-colors cursor-pointer ${statusColors[r.status] || 'text-foreground'}`}
                                  >
                                    <option>Checked In</option>
                                    <option>Diagnosing</option>
                                    <option>Parts Ordered</option>
                                    <option>In Repair</option>
                                    <option>Quality Check</option>
                                    <option>Ready for Pickup</option>
                                    <option>Completed</option>
                                    <option>On Hold</option>
                                    <option>Cancelled</option>
                                  </select>
                                );
                              })()}
                              <button onClick={() => {
                                if (!adminToken) return;
                                if (window.confirm(`Delete ticket ${r.ticket}?`)) {
                                  fetch(`${API_BASE}/repairs/${r.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${adminToken}` },
                                  }).then(res => {
                                    if (res.ok) setRepairs(prev => prev.filter(x => x.id !== r.id));
                                    else showToast('Failed to delete ticket.');
                                  }).catch(() => showToast('Failed to delete ticket.'));
                                }
                              }} className={deleteBtnCls}><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Inventory Panel */}
                {activePanel === 'Inventory' && (
                  <div className="space-y-4">
                    <h3 className={sectionHeadCls}>Inventory</h3>
                    {draft.inventory.map(inv => (
                      <div key={inv.id} className={cardCls + ` flex gap-4 ${inv.quantity <= inv.threshold ? 'border-l-4 border-l-primary' : ''}`}>
                        <div className="flex-1 grid md:grid-cols-5 gap-2">
                          <input value={inv.item} onChange={e => updateArrayItem('inventory', inv.id, 'item', e.target.value)} className={inputCls} placeholder="Item Name" />
                          <input type="number" value={inv.quantity} onChange={e => updateArrayItem('inventory', inv.id, 'quantity', Number(e.target.value))} className={inputCls} placeholder="Qty" />
                          <input type="number" value={inv.reserved} onChange={e => updateArrayItem('inventory', inv.id, 'reserved', Number(e.target.value))} className={inputCls} placeholder="Reserved" />
                          <input type="number" value={inv.threshold} onChange={e => updateArrayItem('inventory', inv.id, 'threshold', Number(e.target.value))} className={inputCls} placeholder="Threshold" />
                          <input value={inv.reason} onChange={e => updateArrayItem('inventory', inv.id, 'reason', e.target.value)} className={inputCls} placeholder="Reason" />
                        </div>
                        <button onClick={() => deleteArrayItem('inventory', inv.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => setDraft(d => ({...d, inventory: [...d.inventory, { id: crypto.randomUUID(), item: '', quantity: 0, reserved: 0, threshold: 5, reason: 'Manual add' }]}))} className={addBtnCls}><Plus size={14} /> Add Item</button>
                  </div>
                )}

                {/* Orders Panel */}
                {activePanel === 'Orders' && (
                  <div className="space-y-4">
                    <h3 className={sectionHeadCls}>Orders</h3>
                    {draft.orders.map(ord => (
                      <div key={ord.id} className={cardCls + " flex gap-4"}>
                        <div className="flex-1 grid md:grid-cols-4 gap-2">
                          <input value={ord.order} onChange={e => updateArrayItem('orders', ord.id, 'order', e.target.value)} className={inputCls} placeholder="Order #" />
                          <input value={ord.customer} onChange={e => updateArrayItem('orders', ord.id, 'customer', e.target.value)} className={inputCls} placeholder="Customer" />
                          <input value={ord.total} onChange={e => updateArrayItem('orders', ord.id, 'total', e.target.value)} className={inputCls} placeholder="Total" />
                          <select value={ord.status} onChange={e => updateArrayItem('orders', ord.id, 'status', e.target.value)} className={inputCls}>
                            <option>Pending</option><option>Processing</option><option>Shipped</option><option>Completed</option><option>Cancelled</option>
                          </select>
                        </div>
                        <button onClick={() => deleteArrayItem('orders', ord.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => setDraft(d => ({...d, orders: [...d.orders, { id: crypto.randomUUID(), order: 'ORD-'+Math.floor(Math.random()*99999), customer: '', total: '0', status: 'Pending' }]}))} className={addBtnCls}><Plus size={14} /> Add Order</button>
                  </div>
                )}

                {/* Customers Panel */}
                {activePanel === 'Customers' && (
                  <div className="space-y-4">
                    <h3 className={sectionHeadCls}>Customers</h3>
                    {draft.customers.map(cust => (
                      <div key={cust.id} className={cardCls + " flex gap-4"}>
                        <div className="flex-1 grid md:grid-cols-4 gap-2">
                          <input value={cust.name} onChange={e => updateArrayItem('customers', cust.id, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                          <input value={cust.phone} onChange={e => updateArrayItem('customers', cust.id, 'phone', e.target.value)} className={inputCls} placeholder="Phone" />
                          <input value={cust.email} onChange={e => updateArrayItem('customers', cust.id, 'email', e.target.value)} className={inputCls} placeholder="Email" />
                          <input value={cust.lifetimeSpend} onChange={e => updateArrayItem('customers', cust.id, 'lifetimeSpend', e.target.value)} className={inputCls} placeholder="Lifetime Spend" />
                        </div>
                        <button onClick={() => deleteArrayItem('customers', cust.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => setDraft(d => ({...d, customers: [...d.customers, { id: crypto.randomUUID(), name: '', phone: '', email: '', lifetimeSpend: '0' }]}))} className={addBtnCls}><Plus size={14} /> Add Customer</button>
                  </div>
                )}

                {/* Trade Inquiries Panel */}
                {activePanel === 'Trade-Ins' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={sectionHeadCls}>Trade Inquiries ({tradeInquiries.length})</h3>
                      <button
                        onClick={() => { loadTradeInquiries(); showToast('Refreshed.'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors"
                      >
                        <RefreshCcw2 size={14} /> Refresh
                      </button>
                    </div>

                    {tradeInquiries.length === 0 ? (
                      <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center">
                        <RefreshCcw2 size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground font-medium">No trade inquiries yet.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">When customers submit a trade inquiry on the shop page, it will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tradeInquiries.map(inq => {
                          const statusColors: Record<string, string> = {
                            'New': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                            'Reviewing': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                            'Offer Sent': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                            'Completed': 'bg-green-500/15 text-green-400 border-green-500/30',
                            'Declined': 'bg-red-500/15 text-red-400 border-red-500/30',
                          };
                          return (
                            <div key={inq.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row gap-4">
                              {/* Customer info */}
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="font-black text-foreground">{inq.name}</span>
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[inq.status] || 'bg-card border-border text-muted-foreground'}`}>
                                    {inq.status}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(inq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
                                  <a href={`mailto:${inq.email}`} className="hover:text-primary transition-colors">{inq.email}</a>
                                  <a href={`tel:${inq.phone}`} className="hover:text-primary transition-colors">{inq.phone}</a>
                                </div>
                                <div className="bg-background rounded-xl px-4 py-2.5 text-sm">
                                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground mr-2">{inq.deviceType} · {inq.condition}</span>
                                  <span className="text-foreground">{inq.deviceDescription}</span>
                                </div>
                                {inq.notes && (
                                  <div className="text-xs text-muted-foreground italic px-1">Notes: {inq.notes}</div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex md:flex-col gap-2 items-start md:items-end justify-end flex-shrink-0">
                                <select
                                  value={inq.status}
                                  onChange={e => {
                                    const newStatus = e.target.value;
                                    fetch(`${API_BASE}/trade-inquiries/${inq.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                                      body: JSON.stringify({ status: newStatus }),
                                    }).then(r => r.ok ? (setTradeInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: newStatus } : i)), showToast('Status updated.')) : showToast('Failed.'))
                                    .catch(() => showToast('Failed.'));
                                  }}
                                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
                                >
                                  <option>New</option>
                                  <option>Reviewing</option>
                                  <option>Offer Sent</option>
                                  <option>Completed</option>
                                  <option>Declined</option>
                                </select>
                                <button
                                  onClick={() => {
                                    if (!window.confirm(`Delete inquiry from ${inq.name}?`)) return;
                                    fetch(`${API_BASE}/trade-inquiries/${inq.id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${adminToken}` },
                                    }).then(r => r.ok ? (setTradeInquiries(prev => prev.filter(i => i.id !== inq.id)), showToast('Deleted.')) : showToast('Failed.'))
                                    .catch(() => showToast('Failed.'));
                                  }}
                                  className={deleteBtnCls}
                                ><Trash2 size={16} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Employees Panel */}
                {activePanel === 'Employees' && (
                  <div className="space-y-4">
                    <h3 className={sectionHeadCls}>Employees</h3>
                    {draft.employees.map(emp => (
                      <div key={emp.id} className={cardCls + " flex gap-4"}>
                        <div className="flex-1 grid md:grid-cols-4 gap-2">
                          <input value={emp.name} onChange={e => updateArrayItem('employees', emp.id, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                          <input value={emp.email} onChange={e => updateArrayItem('employees', emp.id, 'email', e.target.value)} className={inputCls} placeholder="Email" />
                          <select value={emp.role} onChange={e => updateArrayItem('employees', emp.id, 'role', e.target.value)} className={inputCls}>
                            <option>Owner</option><option>Manager</option><option>Technician</option><option>Sales</option><option>Front Desk</option>
                          </select>
                          <select value={emp.status} onChange={e => updateArrayItem('employees', emp.id, 'status', e.target.value)} className={inputCls}>
                            <option>Active</option><option>Inactive</option>
                          </select>
                        </div>
                        <button onClick={() => deleteArrayItem('employees', emp.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => setDraft(d => ({...d, employees: [...d.employees, { id: crypto.randomUUID(), name: '', email: '', role: 'Technician', status: 'Active' }]}))} className={addBtnCls}><Plus size={14} /> Add Employee</button>
                  </div>
                )}

                {/* Settings Panel */}
                {/* Email List */}
                {activePanel === 'Email List' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={sectionHeadCls}>Email Subscribers ({emails.length})</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const csv = ['Email,Name,Source,Date', ...emails.map(e =>
                              `${e.email},${e.name},${e.source},${new Date(e.createdAt).toLocaleDateString()}`
                            )].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = 'subscribers.csv'; a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors"
                        >
                          <Download size={14} /> Export CSV
                        </button>
                        <button onClick={() => { loadEmails(); showToast('Refreshed.'); }} className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors">
                          <RefreshCcw size={14} /> Refresh
                        </button>
                      </div>
                    </div>

                    {emails.length === 0 ? (
                      <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center">
                        <Mail size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground font-medium">No subscribers yet.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Emails collected from the website signup form will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[...emails].reverse().map(e => (
                          <div key={e.id} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Mail size={16} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black truncate">{e.email}</div>
                              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                                {e.name && <span className="mr-3">{e.name}</span>}
                                <span className="uppercase tracking-wider opacity-60">{e.source}</span>
                                <span className="mx-2 opacity-30">·</span>
                                <span>{new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (!adminToken) return;
                                if (!window.confirm(`Remove ${e.email}?`)) return;
                                fetch(`${API_BASE}/emails/${e.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${adminToken}` },
                                }).then(res => {
                                  if (res.ok) { setEmails(prev => prev.filter(x => x.id !== e.id)); showToast('Removed.'); }
                                  else showToast('Failed to remove.');
                                }).catch(() => showToast('Failed to remove.'));
                              }}
                              className={deleteBtnCls}
                            ><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Memberships Panel ── */}
                {activePanel === 'Memberships' && (
                    <div className="space-y-6">
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Active Codes', value: membershipActive.length, color: 'text-green-400', icon: <ShieldCheck size={18} /> },
                          { label: 'Expired', value: membershipExpired.length, color: 'text-yellow-400', icon: <Clock size={18} /> },
                          { label: 'Deactivated', value: membershipDeactivated.length, color: 'text-red-400', icon: <AlertTriangle size={18} /> },
                        ].map(s => (
                          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                            <div className={s.color}>{s.icon}</div>
                            <div>
                              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                              <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Discount Code Checker */}
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className={sectionHeadCls}>Discount Code Checker</h3>
                        <p className="text-xs text-muted-foreground mb-4">Enter any JQF+ code to instantly verify its status, discount %, and expiry date.</p>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              value={membershipCheckCode}
                              onChange={e => { setMembershipCheckCode(e.target.value.toUpperCase()); setMembershipCheckResult(null); }}
                              onKeyDown={e => e.key === 'Enter' && handleCheckMembershipCode()}
                              placeholder="JQF-XXXX-XXXX"
                              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 font-mono text-sm outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <button
                            onClick={handleCheckMembershipCode}
                            disabled={!membershipCheckCode.trim() || membershipCheckLoading}
                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                          >
                            {membershipCheckLoading ? 'Checking…' : 'Check'}
                          </button>
                        </div>

                        {/* Result card */}
                        {membershipCheckResult && (
                          <div className={`mt-4 rounded-xl border p-4 ${membershipCheckResult.valid ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${membershipCheckResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                                {membershipCheckResult.valid ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                              </div>
                              <div className="flex-1">
                                <div className={`font-black text-sm ${membershipCheckResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                                  {membershipCheckResult.valid ? '✓ VALID CODE' : '✗ INVALID CODE'}
                                </div>
                                <div className="text-sm text-foreground mt-1">{membershipCheckResult.message}</div>
                                {membershipCheckResult.valid && membershipCheckResult.expiresAt && (
                                  <div className="grid grid-cols-3 gap-3 mt-3">
                                    <div className="bg-background/60 rounded-lg p-2 text-center">
                                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Discount</div>
                                      <div className="font-black text-primary">{membershipCheckResult.discountPercent}% OFF</div>
                                    </div>
                                    <div className="bg-background/60 rounded-lg p-2 text-center">
                                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Expires</div>
                                      <div className="font-black text-sm">{new Date(membershipCheckResult.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                    </div>
                                    <div className="bg-background/60 rounded-lg p-2 text-center">
                                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Days Left</div>
                                      <div className={`font-black text-sm ${(membershipCheckResult.daysLeft ?? 0) < 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {membershipCheckResult.daysLeft}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* All Codes Table */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={sectionHeadCls}>All Membership Codes ({membershipCodes.length})</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const csv = ['Code,Email,Discount,Issued,Expires,Status',
                                  ...membershipCodes.map(c => {
                                    const exp = new Date(c.expiresAt);
                                    const _now = new Date();
                                    const status = !c.isActive ? 'Deactivated' : exp <= _now ? 'Expired' : 'Active';
                                    return `${c.code},${c.email},${c.discountPercent}%,${new Date(c.createdAt).toLocaleDateString()},${exp.toLocaleDateString()},${status}`;
                                  })
                                ].join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = 'jqf-membership-codes.csv'; a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors"
                            >
                              <Download size={13} /> Export CSV
                            </button>
                            <button onClick={() => { loadMembershipCodes(); showToast('Refreshed.'); }} className="flex items-center gap-2 px-3 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors">
                              <RefreshCcw size={13} /> Refresh
                            </button>
                          </div>
                        </div>

                        {membershipCodes.length === 0 ? (
                          <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center">
                            <BadgePercent size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground font-medium">No membership codes issued yet.</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Codes are generated automatically when customers purchase JQF+.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {membershipCodes.map(c => {
                              const exp = new Date(c.expiresAt);
                              const _now = new Date();
                              const isExpired = exp <= _now;
                              const daysLeft = isExpired ? 0 : Math.ceil((exp.getTime() - _now.getTime()) / (1000 * 60 * 60 * 24));
                              const statusLabel = !c.isActive ? 'Deactivated' : isExpired ? 'Expired' : 'Active';
                              const statusColor = !c.isActive ? 'text-red-400' : isExpired ? 'text-yellow-400' : 'text-green-400';
                              return (
                                <div key={c.id} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
                                  {/* Status dot */}
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!c.isActive ? 'bg-red-400' : isExpired ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                  {/* Code */}
                                  <div className="font-mono font-black text-sm tracking-widest min-w-[130px]">{c.code}</div>
                                  {/* Email */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{c.email}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      Issued {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                  </div>
                                  {/* Discount */}
                                  <div className="text-center min-w-[56px]">
                                    <div className="text-primary font-black">{c.discountPercent}%</div>
                                    <div className="text-xs text-muted-foreground">off</div>
                                  </div>
                                  {/* Expiry */}
                                  <div className="text-center min-w-[90px]">
                                    <div className={`text-xs font-bold ${!c.isActive ? 'text-muted-foreground' : isExpired ? 'text-yellow-400' : daysLeft < 30 ? 'text-yellow-400' : 'text-foreground'}`}>
                                      {exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className={`text-xs ${statusColor} font-bold`}>{statusLabel}{c.isActive && !isExpired ? ` · ${daysLeft}d` : ''}</div>
                                  </div>
                                  {/* Toggle */}
                                  <button
                                    onClick={() => handleToggleMembershipCode(c.id, c.isActive)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${c.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                  >
                                    {c.isActive ? 'Deactivate' : 'Reactivate'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                )}

                {activePanel === 'Settings' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className={sectionHeadCls}>Global Settings</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Site Name</label>
                          <input value={draft.site.name} onChange={e => setDraft(p => ({ ...p, site: { ...p.site, name: e.target.value } }))} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Site Tagline</label>
                          <input value={draft.site.tagline} onChange={e => setDraft(p => ({ ...p, site: { ...p.site, tagline: e.target.value } }))} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Store Name</label>
                          <input value={draft.settings.storeName} onChange={e => setSettingsField('storeName', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Contact Email</label>
                          <input value={draft.settings.contactEmail} onChange={e => setSettingsField('contactEmail', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Phone</label>
                          <input value={draft.settings.phone} onChange={e => setSettingsField('phone', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Visibility</label>
                          <select value={draft.settings.visibility} onChange={e => setSettingsField('visibility', e.target.value)} className={inputCls}>
                            <option>Public</option><option>Private</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Footer Text</label>
                          <textarea value={draft.settings.footer} onChange={e => setSettingsField('footer', e.target.value)} className={textareaCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Footer Tagline (under logo)</label>
                          <textarea value={(draft.settings as any).footerTagline ?? ''} onChange={e => setSettingsField('footerTagline' as any, e.target.value)} className={textareaCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Store Hours</label>
                          <textarea value={(draft.settings as any).hours ?? ''} onChange={e => setSettingsField('hours' as any, e.target.value)} className={textareaCls} placeholder="Mon – Sat: 9am – 7pm&#10;Sun: 11am – 5pm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Store Address (optional)</label>
                          <input value={(draft.settings as any).address ?? ''} onChange={e => setSettingsField('address' as any, e.target.value)} className={inputCls} placeholder="123 Main Street, City, State" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Warranty Policy</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className={labelCls}>Warranty Title</label>
                          <input value={(draft.settings as any).warrantyTitle ?? ''} onChange={e => setSettingsField('warrantyTitle' as any, e.target.value)} className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Warranty Body Text</label>
                          <textarea value={(draft.settings as any).warrantyBody ?? ''} onChange={e => setSettingsField('warrantyBody' as any, e.target.value)} className={textareaCls} rows={4} />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold uppercase mt-4 mb-2">Warranty Bullets</h4>
                      {((draft.settings as any).warrantyBullets ?? []).map((bullet: string, i: number) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input value={bullet} onChange={e => {
                            const bullets = [...((draft.settings as any).warrantyBullets ?? [])];
                            bullets[i] = e.target.value;
                            setSettingsField('warrantyBullets' as any, bullets);
                          }} className={inputCls} />
                          <button onClick={() => {
                            const bullets = ((draft.settings as any).warrantyBullets ?? []).filter((_: any, idx: number) => idx !== i);
                            setSettingsField('warrantyBullets' as any, bullets);
                          }} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const bullets = [...((draft.settings as any).warrantyBullets ?? []), 'New bullet point'];
                        setSettingsField('warrantyBullets' as any, bullets);
                      }} className={addBtnCls}><Plus size={14} /> Add Bullet</button>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <button onClick={() => {
                        if (window.confirm("Reset all settings to default demo data?")) {
                          saveContent(DEFAULT_CONTENT);
                          showToast('Reset to defaults.');
                        }
                      }} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 rounded-xl font-black text-xs uppercase tracking-wider transition-colors">
                        <RefreshCcw size={14} /> Reset to Defaults
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
