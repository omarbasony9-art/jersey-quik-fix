import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, User, MapPin, ChevronRight, 
  Star, Menu, X, Gamepad2, RefreshCcw, BadgeDollarSign,
  Plus, Minus, Trash2, Check, Copy, Printer, Tag
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useUser } from '@clerk/react';
import { useSiteData, type Product } from '../context/SiteDataContext';
import Footer from '../components/Footer';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Fixed shop category tabs — "Accessories" is a catchall for anything not in NAMED_CATEGORIES
const NAMED_CATEGORIES = ['Phones', 'Computers', 'Gaming', 'Apple'];
const SHOP_TABS = ['All', 'Phones', 'Computers', 'Gaming', 'Apple', 'Accessories'];

// Apple logo SVG (Material Design, Apache-licensed shape)
const AppleSVG = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

// Maps fixed shop tabs → real DB category names
const GAMING_CATS = new Set(['Nintendo', 'Xbox', 'PlayStation', 'Controllers', 'Arcade Machines', 'Video Games', 'Sega / Retro']);
const APPLE_CATS  = new Set(['Apple', 'MacBook', 'iPhone', 'Tablets']);

function matchesCategory(p: Product, tab: string): boolean {
  if (tab === 'All') return true;
  const cat = p.category || '';
  if (tab === 'Phones')     return cat === 'iPhone';
  if (tab === 'Computers')  return cat === 'MacBook';
  if (tab === 'Gaming')     return GAMING_CATS.has(cat);
  if (tab === 'Apple')      return APPLE_CATS.has(cat);
  // Accessories = everything else (Audio, Protection, Chargers, Cases, Cables, Accessories…)
  return !GAMING_CATS.has(cat) && !APPLE_CATS.has(cat);
}

const DEVICE_TYPES = ['Phone', 'Tablet', 'Laptop', 'Game Console', 'Controller', 'Other Electronics'];
const CONDITIONS = [
  { label: 'Excellent', sub: 'Like new, fully functional, minimal wear' },
  { label: 'Good', sub: 'Normal wear, works perfectly' },
  { label: 'Fair', sub: 'Visible wear or minor issues, still functional' },
  { label: 'Poor', sub: 'Heavy damage, not fully working' },
];

type CartItem = Product & { quantity: number };

export default function ShopPage() {
  const { content } = useSiteData();
  const { shop } = content;

  // ── Fetch all 165 products from the normalized API ──────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    fetch(`${API_BASE}/products?limit=200`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(data => {
        if (cancelled) return;
        if (!data?.products) { setProductsLoading(false); return; }
        const prods: Product[] = (data.products as any[])
          .filter(p => p.active)
          .map(p => ({
            id: String(p.id),
            name: p.name,
            category: p.category || '',
            subcategory: p.subcategory ?? undefined,
            description: p.description ?? '',
            price: typeof p.price === 'string' ? parseFloat(p.price) : Number(p.price),
            oldPrice: p.old_price ? (typeof p.old_price === 'string' ? parseFloat(p.old_price) : Number(p.old_price)) : undefined,
            rating: p.rating ? Number(p.rating) : 4.5,
            badge: p.badge ?? undefined,
            image: (p.images && p.images.length > 0) ? p.images[0] : '',
            images: p.images ?? [],
            stock: Number(p.inventory_quantity ?? p.stock ?? 0),
            sku: p.sku || '',
            active: Boolean(p.active),
            sortOrder: undefined,
            condition: p.condition ?? undefined,
            tags: undefined,
          }));
        setProducts(prods);
        setProductsLoading(false);
      })
      .catch(() => setProductsLoading(false));
    return () => { cancelled = true; };
  }, []);
  const [, navigate] = useLocation();
  const { user, isLoaded: clerkLoaded } = useUser();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutBanner, setCheckoutBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') return { type: 'success', text: '🎉 Order placed! Check your email for confirmation.' };
    if (params.get('checkout') === 'cancelled') return { type: 'error', text: 'Checkout cancelled — your cart is saved.' };
    return null;
  });

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState('');

  // Membership code modal state (shown after JQF+ purchase)
  const [membershipModal, setMembershipModal] = useState<{ code: string; email: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // After checkout success — try to activate membership code if session_id present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;
    const sessionId = params.get('session_id');
    if (!sessionId) return;
    fetch(`${API_BASE}/membership/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.code) {
          setMembershipModal({ code: data.code, email: data.email || '' });
        }
      })
      .catch(() => {});
  }, []);

  const handleValidatePromo = async () => {
    const trimmed = promoCode.trim().toUpperCase();
    if (!trimmed) return;
    setPromoStatus('checking');
    try {
      const res = await fetch(`${API_BASE}/membership/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoStatus('valid');
        setPromoDiscount(data.discountPercent);
        setPromoMessage(data.message);
      } else {
        setPromoStatus('invalid');
        setPromoDiscount(0);
        setPromoMessage(data.message || 'Invalid code.');
      }
    } catch {
      setPromoStatus('invalid');
      setPromoMessage('Could not verify code. Try again.');
    }
  };

  // Trade inquiry form state
  const [tradeForm, setTradeForm] = useState({ name: '', email: '', phone: '', deviceType: '', deviceDescription: '', condition: '', notes: '' });
  const [tradeSubmitting, setTradeSubmitting] = useState(false);
  const [tradeStatus, setTradeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [tradeError, setTradeError] = useState('');

  // Close product detail on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedProduct(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Open a product in the detail panel
  const openProduct = (p: Product) => {
    setSelectedProduct(p);
    setSelectedImageIdx(0);
    setAddedToCart(false);
  };

  // Filtering products — search across all text fields, category uses fixed tabs
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const catMatch = matchesCategory(p, activeCategory);
      if (!query.trim()) return catMatch;
      const q = query.toLowerCase().trim();
      const searchMatch =
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.subcategory?.toLowerCase().includes(q) ?? false) ||
        (p.brand?.toLowerCase().includes(q) ?? false) ||
        (p.model?.toLowerCase().includes(q) ?? false) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (p.badge?.toLowerCase().includes(q) ?? false) ||
        (p.tags?.toLowerCase().includes(q) ?? false) ||
        (p.condition?.toLowerCase().includes(q) ?? false) ||
        p.sku.toLowerCase().includes(q);
      return catMatch && searchMatch;
    });
  }, [query, activeCategory, products]);

  // Cart operations
  const addToCart = (product: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountedTotal = promoStatus === 'valid'
    ? cartTotal * (1 - promoDiscount / 100)
    : cartTotal;

  // ── Cart persistence ────────────────────────────────────────────────────
  const cartSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartLoaded = useRef(false);

  // Load saved cart from API when user signs in
  useEffect(() => {
    if (!clerkLoaded) return;
    if (!user) { cartLoaded.current = false; return; }
    if (cartLoaded.current) return;
    cartLoaded.current = true;

    fetch(`${API_BASE}/cart`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.items?.length) return;
        setCart(prev => {
          const merged = [...prev];
          for (const saved of data.items) {
            if (!merged.find(i => i.id === saved.productId)) {
              merged.push({
                id: saved.productId, name: saved.productName,
                category: saved.productCategory || '', price: Number(saved.price),
                quantity: saved.quantity, image: saved.image || '',
                sku: saved.sku || '', badge: saved.badge || undefined,
                rating: 0, stock: 999, active: true, oldPrice: undefined,
              });
            }
          }
          return merged;
        });
      })
      .catch(() => {});
  }, [user, clerkLoaded]);

  // Debounced sync cart to API whenever it changes (only if signed in)
  useEffect(() => {
    if (!user) return;
    if (cartSyncTimer.current) clearTimeout(cartSyncTimer.current);
    cartSyncTimer.current = setTimeout(() => {
      fetch(`${API_BASE}/cart/sync`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.id, productName: item.name,
            productCategory: item.category, price: item.price,
            quantity: item.quantity, image: item.image,
            sku: item.sku, badge: item.badge,
          })),
        }),
      }).catch(() => {});
    }, 800);
    return () => { if (cartSyncTimer.current) clearTimeout(cartSyncTimer.current); };
  }, [cart, user]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    try {
      const customerEmail = user?.emailAddresses?.[0]?.emailAddress || undefined;
      const res = await fetch(`${API_BASE}/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image || undefined,
            category: item.category || undefined,
          })),
          customerEmail,
          promoCode: promoStatus === 'valid' ? promoCode.trim().toUpperCase() : undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutBanner({ type: 'error', text: data.error || 'Checkout failed — please try again.' });
      }
    } catch {
      setCheckoutBanner({ type: 'error', text: 'Network error — please try again.' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Trade inquiry submit
  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTradeSubmitting(true);
    setTradeError('');
    try {
      const res = await fetch(`${API_BASE}/trade-inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeForm),
      });
      const data = await res.json();
      if (res.ok) {
        setTradeStatus('success');
        setTradeForm({ name: '', email: '', phone: '', deviceType: '', deviceDescription: '', condition: '', notes: '' });
      } else {
        setTradeError(data.error || 'Something went wrong. Please try again.');
        setTradeStatus('error');
      }
    } catch {
      setTradeError('Network error — please try again.');
      setTradeStatus('error');
    } finally {
      setTradeSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!membershipModal) return;
    navigator.clipboard.writeText(membershipModal.code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2500);
    });
  };

  const handlePrintCard = () => {
    if (!membershipModal) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html><html><head><title>JQF+ Member Card</title>
      <style>
        body { margin: 0; background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Arial Black', Arial, sans-serif; }
        .card { width: 3.5in; height: 2in; background: linear-gradient(135deg, #0a1628 0%, #0d1f3e 50%, #000 100%); border-radius: 12px; padding: 24px; box-sizing: border-box; color: white; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(255,255,255,0.2); position: relative; overflow: hidden; }
        .glow { position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(0,120,255,0.3); border-radius: 50%; filter: blur(20px); }
        .top { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 20px; font-style: italic; font-weight: 900; letter-spacing: -1px; }
        .logo span { color: #007BFF; }
        .badge { font-size: 9px; letter-spacing: 3px; opacity: 0.5; text-transform: uppercase; }
        .code-area { text-align: center; }
        .code-label { font-size: 8px; letter-spacing: 3px; opacity: 0.5; text-transform: uppercase; margin-bottom: 6px; }
        .code { font-size: 28px; font-weight: 900; letter-spacing: 6px; font-family: 'Courier New', monospace; }
        .bottom { display: flex; justify-content: space-between; font-size: 8px; letter-spacing: 2px; opacity: 0.5; text-transform: uppercase; }
        @media print { body { background: white; } }
      </style></head><body>
      <div class="card">
        <div class="glow"></div>
        <div class="top"><div class="logo">JQF<span>+</span></div><div class="badge">Member Card</div></div>
        <div class="code-area"><div class="code-label">Your Discount Code</div><div class="code">${membershipModal.code}</div></div>
        <div class="bottom"><span>10% Off All Purchases</span><span>Valid · Unlimited Uses</span></div>
      </div>
      <script>window.onload=()=>{window.print();}<\/script></body></html>
    `);
    w.document.close();
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground">

      {/* JQF+ Membership Code Modal */}
      <AnimatePresence>
        {membershipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={e => { if (e.target === e.currentTarget) setMembershipModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-full max-w-md"
            >
              {/* Header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-full px-4 py-1.5 text-primary text-sm font-bold mb-3">
                  ✦ JQF+ MEMBERSHIP ACTIVATED
                </div>
                <h2 className="text-3xl font-black text-white">Your Member Code</h2>
                <p className="text-white/60 text-sm mt-1">Use this code at checkout for <span className="text-primary font-bold">10% off</span> every purchase</p>
              </div>

              {/* Physical Card */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-4" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3e 55%, #000 100%)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-30" style={{ background: 'radial-gradient(circle, #007BFF 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #0040FF 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
                {/* Chip graphic */}
                <div className="absolute top-6 left-6 w-10 h-7 rounded-md border border-yellow-400/40 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 grid grid-cols-2 gap-[2px] p-[3px]">
                  {[...Array(4)].map((_, i) => <div key={i} className="rounded-[1px] bg-yellow-400/30" />)}
                </div>

                <div className="relative p-7 pt-14">
                  {/* Card header */}
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-2xl font-black italic text-white tracking-tight">JQF<span className="text-primary">+</span></span>
                    <span className="text-[10px] tracking-[4px] text-white/40 uppercase">Member Card</span>
                  </div>

                  {/* Code */}
                  <div className="text-center mb-8">
                    <p className="text-[9px] tracking-[4px] text-white/40 uppercase mb-2">Your Discount Code</p>
                    <p className="text-4xl font-black font-mono text-white tracking-widest select-all">
                      {membershipModal.code}
                    </p>
                  </div>

                  {/* Card footer */}
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] tracking-[3px] text-white/40 uppercase">Benefit</p>
                      <p className="text-xs font-bold text-white/70 tracking-widest">10% OFF ALL PURCHASES</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] tracking-[3px] text-white/40 uppercase">Status</p>
                      <p className="text-xs font-bold text-green-400 tracking-widest">● ACTIVE</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member email */}
              {membershipModal.email && (
                <p className="text-center text-xs text-white/40 mb-4">Issued to <span className="text-white/70">{membershipModal.email}</span></p>
              )}

              {/* Actions */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:brightness-110 transition-all"
                >
                  {codeCopied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Code</>}
                </button>
                <button
                  onClick={handlePrintCard}
                  className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
                >
                  <Printer size={16} /> Print Card
                </button>
              </div>

              <p className="text-center text-xs text-white/40 mb-4">
                Screenshot or print this card — your code is always available at checkout.
              </p>

              <button onClick={() => setMembershipModal(null)} className="w-full text-white/40 hover:text-white/70 text-sm py-2 transition-colors">
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Banner */}
      {checkoutBanner && (
        <div className={`flex items-center justify-between px-6 py-3 text-sm font-bold ${checkoutBanner.type === 'success' ? 'bg-green-600 text-white' : 'bg-destructive text-destructive-foreground'}`}>
          <span>{checkoutBanner.text}</span>
          <button onClick={() => setCheckoutBanner(null)} className="ml-4 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Topbar */}
      <div className="bg-primary text-primary-foreground text-xs font-bold py-2 px-4 text-center tracking-wider">
        {shop.promoBanner}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b-2 border-primary/30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between gap-4">

          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <a href="#" className="flex items-center gap-2 group">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg rotate-3 group-hover:rotate-12 transition-transform">
                <Gamepad2 size={24} strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-black tracking-tight uppercase italic text-foreground">
                {content.site.name}
              </span>
            </a>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <input 
              type="text" 
              placeholder="Search products, accessories, cables..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-card border-2 border-transparent focus:border-primary text-foreground rounded-full py-3 px-5 pl-12 outline-none transition-all placeholder:text-muted-foreground font-medium"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <button
              onClick={() => navigate(user ? '/shop' : '/sign-in')}
              title={user ? `Signed in as ${user.firstName || user.emailAddresses[0]?.emailAddress}` : 'Sign in'}
              className="hidden md:flex items-center justify-center p-3 rounded-full hover:bg-card transition-colors relative"
            >
              {user ? (
                <span className="w-[22px] h-[22px] rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                  {(user.firstName?.[0] || user.emailAddresses[0]?.emailAddress?.[0] || '?').toUpperCase()}
                </span>
              ) : (
                <User size={22} className="text-foreground" />
              )}
            </button>
            <div className="relative">
              <button 
                onClick={() => setCartOpen(!cartOpen)}
                className="flex items-center justify-center p-3 rounded-full hover:bg-card transition-colors relative"
              >
                <ShoppingCart size={22} className="text-foreground" />
                {cartItemCount > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-background"
                  >
                    {cartItemCount}
                  </motion.span>
                )}
              </button>

              {/* Cart Dropdown */}
              <AnimatePresence>
                {cartOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col"
                  >
                    <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
                      <h3 className="font-bold text-lg">Your Cart</h3>
                      <button onClick={() => setCartOpen(false)} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto p-4 flex flex-col gap-4">
                      {cart.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <ShoppingCart size={48} className="mx-auto mb-4 opacity-20" />
                          <p>Your cart is empty.</p>
                          <p className="text-sm mt-1">Time to grab some loot!</p>
                        </div>
                      ) : (
                        cart.map(item => (
                          <div key={item.id} className="flex gap-4 items-center">
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                            <div className="flex-1">
                              <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                              <div className="text-primary font-bold mt-1">${item.price}</div>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 bg-background rounded-md px-1">
                                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-primary"><Minus size={14} /></button>
                                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-primary"><Plus size={14} /></button>
                                </div>
                                <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive p-1">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {cart.length > 0 && (
                      <div className="p-4 border-t border-border bg-background/50 flex flex-col gap-3">
                        {/* Promo Code Input */}
                        <div>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <input
                                type="text"
                                placeholder="JQF+ member code"
                                value={promoCode}
                                onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoStatus('idle'); setPromoDiscount(0); }}
                                onKeyDown={e => e.key === 'Enter' && handleValidatePromo()}
                                className="w-full bg-background border border-border rounded-lg py-2 pl-8 pr-3 text-sm font-mono focus:border-primary outline-none transition-colors"
                              />
                            </div>
                            <button
                              onClick={handleValidatePromo}
                              disabled={!promoCode.trim() || promoStatus === 'checking'}
                              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-50 hover:brightness-110 transition-all"
                            >
                              {promoStatus === 'checking' ? '…' : 'Apply'}
                            </button>
                          </div>
                          {promoStatus !== 'idle' && (
                            <p className={`text-xs mt-1 font-medium ${promoStatus === 'valid' ? 'text-green-500' : 'text-destructive'}`}>
                              {promoStatus === 'valid' ? '✓' : '✗'} {promoMessage}
                            </p>
                          )}
                        </div>

                        {/* Totals */}
                        <div className="flex flex-col gap-1">
                          {promoStatus === 'valid' && (
                            <>
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Original</span>
                                <span className="line-through">${cartTotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm text-green-500 font-bold">
                                <span>JQF+ {promoDiscount}% discount</span>
                                <span>−${(cartTotal - discountedTotal).toFixed(2)}</span>
                              </div>
                            </>
                          )}
                          <div className="flex justify-between items-center font-bold text-lg">
                            <span>Total</span>
                            <span>${discountedTotal.toFixed(2)}</span>
                          </div>
                        </div>

                        <button
                          onClick={handleCheckout}
                          disabled={checkoutLoading}
                          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-wait flex items-center justify-center gap-2"
                        >
                          {checkoutLoading ? (
                            <><span className="inline-block w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> Processing…</>
                          ) : (
                            '🔒 Checkout with Stripe'
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* Mobile Search - visible only when menu is closed and on small screens */}
        <div className="md:hidden px-4 pb-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search products, brands, models..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-card border-2 border-transparent focus:border-primary text-foreground rounded-full py-2 px-4 pl-10 outline-none placeholder:text-muted-foreground font-medium text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          </div>
        </div>
      </header>

      {/* Navigation Layer */}
      <nav className="bg-card border-b-2 border-primary/30 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-8 text-sm font-bold tracking-wide">
          <div className="flex items-center gap-5 flex-1">
            {SHOP_TABS.slice(1).map(cat => (
              <button 
                key={cat} 
                onClick={() => {
                  setActiveCategory(cat);
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-1.5 transition-colors uppercase ${activeCategory === cat ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              >
                {cat === 'Apple' && <AppleSVG />}
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-6 border-l border-border pl-6">
            <a href="#trade" className="text-accent hover:text-accent/80 flex items-center gap-1 transition-colors uppercase">
              <RefreshCcw size={16} /> Trade In
            </a>
            <a href="#deals" className="text-primary hover:text-primary/80 flex items-center gap-1 transition-colors uppercase">
              <BadgeDollarSign size={16} /> Hot Deals
            </a>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col md:hidden pt-20"
          >
            <button className="absolute top-4 right-4 p-2 text-foreground" onClick={() => setMenuOpen(false)}>
              <X size={32} />
            </button>
            <div className="flex flex-col p-8 gap-6 text-2xl font-black uppercase tracking-tight">
              {SHOP_TABS.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => { setActiveCategory(cat); setMenuOpen(false); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className={`text-left flex items-center gap-3 ${activeCategory === cat ? 'text-primary' : 'text-foreground'}`}
                >
                  {cat === 'Apple' && <span className="scale-[2]"><AppleSVG /></span>}
                  {cat}
                </button>
              ))}
              <hr className="border-border my-2" />
              <a href="/repair-status" onClick={() => setMenuOpen(false)} className="text-muted-foreground flex items-center gap-3 hover:text-foreground transition-colors">
                <Search size={28} /> Track Repair
              </a>
              <a href="#trade" onClick={() => setMenuOpen(false)} className="text-accent flex items-center gap-3">
                <RefreshCcw size={28} /> Trade In
              </a>
              <a href="#deals" onClick={() => setMenuOpen(false)} className="text-primary flex items-center gap-3">
                <BadgeDollarSign size={28} /> Hot Deals
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative h-[60vh] min-h-[500px] flex items-center">
          <div className="absolute inset-0 z-0">
            <img 
              src={shop.heroImage} 
              alt="Gaming Setup" 
              className="w-full h-full object-cover object-center"
            />
            {/* Cinematic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full px-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-2xl"
            >
              <div className="inline-block bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-sm font-bold uppercase tracking-widest mb-6">
                Next-Gen Has Arrived
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] italic tracking-tight mb-6 text-white drop-shadow-2xl">
                {shop.heroHeadline} <br />
                <span className="text-accent">{shop.heroAccent}</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 font-medium mb-10 max-w-lg leading-relaxed">
                {shop.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })} className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  Shop Now <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={() => document.getElementById('trade')?.scrollIntoView({ behavior: 'smooth' })} className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  Trade & Save
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Tiles */}
        <section className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 w-full mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Shop Accessories', subtitle: 'Cases & Protectors', icon: Gamepad2, image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=600&q=80' },
              { title: 'Trade It In', subtitle: 'Get Store Credit', icon: RefreshCcw, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80' },
              { title: 'Member Rewards', subtitle: 'Earn on Every Visit', icon: Star, image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80' }
            ].map((tile, i) => (
              <motion.div 
                key={tile.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="relative overflow-hidden border border-border rounded-2xl cursor-pointer shadow-xl transition-all duration-300 hover:-translate-y-2 group min-h-[160px] bg-card flex flex-col justify-end p-6"
              >
                <img src={tile.image} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 group-hover:from-black/90 transition-all" />
                <div className="relative z-10 flex items-center gap-4 text-white">
                  <div className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl group-hover:scale-110 transition-transform group-hover:text-primary">
                    <tile.icon size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-tight">{tile.title}</h3>
                    <p className="text-sm font-medium text-white/80">{tile.subtitle}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section id="products" className="py-16 px-6 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-4">
                The <span className="text-primary">Store</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {SHOP_TABS.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all ${
                      activeCategory === cat 
                        ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                        : 'bg-card text-foreground hover:bg-card/80 border border-border'
                    }`}
                  >
                    {cat === 'Apple' && (
                      <span aria-label="Apple" role="img"><AppleSVG /></span>
                    )}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-muted-foreground font-bold">
              {filteredProducts.length} items found
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            <AnimatePresence>
              {filteredProducts.map((product, idx) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  key={product.id}
                  onClick={() => openProduct(product)}
                  className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary hover:scale-[1.02] transition-all duration-300 group flex flex-col shadow-sm hover:shadow-[0_0_30px_rgba(245,158,11,0.12)] cursor-pointer"
                >
                  <div className="relative min-h-[220px] md:min-h-[260px] overflow-hidden bg-black/50">
                    {product.badge && (
                      <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        {product.badge}
                      </div>
                    )}
                    <img
                      src={(product.images && product.images.length > 0) ? product.images[0] : product.image}
                      alt={product.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Quick-add overlay on desktop */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-end justify-center pb-5 backdrop-blur-[2px]">
                      <button
                        onClick={e => { e.stopPropagation(); addToCart(product); }}
                        className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-black uppercase text-sm translate-y-2 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2"
                      >
                        <ShoppingCart size={16} /> Quick Add
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{product.category}</div>
                    <h3 className="font-black text-base md:text-lg tracking-tight leading-tight mb-2 flex-1 group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-3 text-yellow-400">
                      <Star size={13} fill="currentColor" />
                      <span className="text-xs font-bold text-foreground">{product.rating}</span>
                    </div>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        {(product.oldPrice || (product as any).salePrice) && (
                          <div className="text-xs text-muted-foreground line-through font-bold">${product.oldPrice ?? (product as any).salePrice}</div>
                        )}
                        <div className="font-black text-xl text-primary">${product.price}</div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); openProduct(product); }}
                        className="md:hidden bg-primary/20 text-primary p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                        aria-label="View product"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {productsLoading && (
              <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold uppercase tracking-wider">Loading products…</p>
              </div>
            )}
            {!productsLoading && filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center justify-center bg-card rounded-2xl border border-dashed border-border">
                <Search size={48} className="mb-4 opacity-20" />
                <h3 className="text-2xl font-black uppercase mb-2">No products found</h3>
                {query.trim() ? (
                  <div className="space-y-2">
                    <p>No results for <strong className="text-foreground">"{query}"</strong> in {activeCategory === 'All' ? 'any category' : activeCategory}.</p>
                    <p className="text-sm">Try a different spelling, brand name, or model number.</p>
                    <button onClick={() => { setQuery(''); setActiveCategory('All'); }} className="mt-4 px-4 py-2 rounded-full border border-border text-sm font-bold hover:border-primary transition-colors">
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <p>No products in this category yet. Check back soon!</p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Promo Grid */}
        {shop.promoCards && shop.promoCards.length > 0 && (
          <section id="deals" className="max-w-7xl mx-auto w-full px-6 py-12">
            <div className="grid md:grid-cols-2 gap-6">
              {shop.promoCards.map((card, idx) => (
                <div key={card.id} className="relative rounded-3xl overflow-hidden aspect-[16/9] md:aspect-auto md:h-80 group">
                  {card.image && <img src={card.image} alt={card.headline} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                  <div className={`absolute inset-0 ${idx % 2 === 0 ? 'bg-gradient-to-r from-background/90 to-background/20' : 'bg-gradient-to-r from-secondary/90 to-background/20'}`} />
                  <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-center">
                    <span className={`${idx % 2 === 0 ? 'text-primary' : 'text-accent'} font-black uppercase tracking-widest mb-2 text-sm`}>{card.eyebrow}</span>
                    <h3 className="text-3xl md:text-4xl font-black uppercase italic leading-tight mb-4 max-w-[220px]">{card.headline}</h3>
                    <button className={`self-start ${idx % 2 === 0 ? 'bg-white text-black hover:bg-primary' : 'bg-accent text-accent-foreground hover:brightness-110'} px-6 py-2 rounded-full font-bold uppercase transition-colors mt-auto`}>{card.buttonText}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Trade-In Inquiry */}
        <section id="trade" className="py-24 bg-card border-y border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <RefreshCcw size={48} className="mx-auto text-primary mb-6" />
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tight mb-4">
              Trade It In, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Get Paid.</span>
            </h2>
            <p className="text-lg text-muted-foreground font-medium mb-12 max-w-2xl mx-auto">
              Tell us what you've got — we'll review it and reach out with a real offer. No commitment, no pressure.
            </p>

            <AnimatePresence mode="wait">
              {tradeStatus === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-background border border-green-500/30 rounded-3xl p-12 max-w-lg mx-auto flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
                    <Check size={32} className="text-green-400" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground">Inquiry Received!</h3>
                  <p className="text-muted-foreground font-medium text-center">
                    We'll review your device and reach out to the number and email you provided with an offer — usually within 24 hours.
                  </p>
                  <button
                    onClick={() => setTradeStatus('idle')}
                    className="mt-2 px-8 py-3 rounded-xl border border-border font-bold text-sm hover:border-primary transition-colors"
                  >Submit Another</button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleTradeSubmit}
                  className="bg-background border border-border p-8 rounded-3xl shadow-2xl text-left max-w-2xl mx-auto space-y-6"
                >
                  {/* Contact info */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Your Contact Info</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <input
                        required
                        placeholder="Full name"
                        value={tradeForm.name}
                        onChange={e => setTradeForm(f => ({ ...f, name: e.target.value }))}
                        className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors"
                      />
                      <input
                        required type="email"
                        placeholder="Email address"
                        value={tradeForm.email}
                        onChange={e => setTradeForm(f => ({ ...f, email: e.target.value }))}
                        className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors"
                      />
                      <input
                        required type="tel"
                        placeholder="Phone number"
                        value={tradeForm.phone}
                        onChange={e => setTradeForm(f => ({ ...f, phone: e.target.value }))}
                        className="bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors"
                      />
                    </div>
                  </div>

                  {/* Device type */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">What are you trading?</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {DEVICE_TYPES.map(type => (
                        <button
                          key={type} type="button"
                          onClick={() => setTradeForm(f => ({ ...f, deviceType: type }))}
                          className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all text-center ${tradeForm.deviceType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/50 text-muted-foreground'}`}
                        >{type}</button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Describe what you have</p>
                    <textarea
                      required rows={3}
                      placeholder="Make, model, storage size, color — and anything we should know (cracked screen, missing charger, etc.)"
                      value={tradeForm.deviceDescription}
                      onChange={e => setTradeForm(f => ({ ...f, deviceDescription: e.target.value }))}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  {/* Condition */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Condition</p>
                    <div className="grid sm:grid-cols-4 gap-2">
                      {CONDITIONS.map(({ label, sub }) => (
                        <button
                          key={label} type="button"
                          onClick={() => setTradeForm(f => ({ ...f, condition: label }))}
                          className={`p-3 rounded-xl border text-sm font-bold text-left transition-all ${tradeForm.condition === label ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card hover:border-accent/50 text-muted-foreground'}`}
                        >
                          {label}
                          <span className="block text-[10px] font-normal opacity-70 mt-1 leading-tight">{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional notes */}
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Anything else? <span className="font-normal normal-case">(optional)</span></p>
                    <textarea
                      rows={2}
                      placeholder="Accessories included, preferred time to be contacted, etc."
                      value={tradeForm.notes}
                      onChange={e => setTradeForm(f => ({ ...f, notes: e.target.value }))}
                      className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>

                  {tradeError && (
                    <p className="text-destructive text-sm font-bold">{tradeError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={tradeSubmitting || !tradeForm.deviceType || !tradeForm.condition}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {tradeSubmitting ? (
                      <><RefreshCcw size={18} className="animate-spin" /> Submitting…</>
                    ) : (
                      <><RefreshCcw size={18} /> Send My Trade Inquiry</>
                    )}
                  </button>

                  <p className="text-center text-xs text-muted-foreground/60">
                    We'll reach out by phone or email within 24 hours with a real offer. No obligation.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Membership Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-secondary via-background to-black border border-secondary/30 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative shadow-2xl">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-xl">
              {(() => {
                const m = content.shop.membership;
                const jqfInCart = cart.some(i => i.id === 'jqf-plus-membership');
                return (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <Star className="text-primary" size={32} fill="currentColor" />
                      <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight">
                        {m.headline.replace('+', '')}<span className="text-primary">+</span>
                      </h3>
                    </div>
                    <h4 className="text-2xl font-bold mb-4">{m.subtitle}</h4>
                    <ul className="space-y-3 mb-8 text-foreground/80 font-medium">
                      {m.perks.map((perk, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <ChevronRight className="text-primary" size={20} /> {perk}
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <button
                        onClick={() => {
                          if (!jqfInCart) addToCart({
                            id: 'jqf-plus-membership',
                            name: 'JQF+ Membership (1 Year)',
                            category: 'Membership',
                            price: m.price,
                            rating: 5,
                            badge: 'BEST VALUE',
                            image: '',
                            stock: 999,
                            sku: 'JQF-PLUS-YR',
                            active: true,
                          });
                        }}
                        className={`px-8 py-4 rounded-xl font-black uppercase tracking-wider transition-all w-full sm:w-auto shadow-[0_0_20px_rgba(245,158,11,0.3)] ${
                          jqfInCart
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-primary text-primary-foreground hover:brightness-110'
                        }`}
                      >
                        {jqfInCart ? '✓ Added to Cart' : `Join for $${m.price.toFixed(2)}/yr`}
                      </button>
                      {jqfInCart && (
                        <button
                          onClick={() => setCartOpen(true)}
                          className="text-primary font-bold underline underline-offset-4 hover:brightness-110 transition-all text-sm"
                        >
                          View cart →
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="relative z-10 w-full max-w-md aspect-card rotate-[-5deg] hover:rotate-0 transition-transform duration-500">
              <div className="w-full h-56 rounded-2xl bg-gradient-to-tr from-card via-secondary to-primary/80 p-6 flex flex-col justify-between border border-white/20 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-10 -translate-y-10" />
                <div className="flex justify-between items-start">
                  <div className="font-black italic text-2xl">JQF<span className="text-white">+</span></div>
                  <Gamepad2 size={28} className="text-white/80" />
                </div>
                <div className="font-mono text-lg tracking-widest text-white/90">0000 1111 2222 3333</div>
                <div className="flex justify-between items-end font-bold text-sm text-white/80 uppercase tracking-widest">
                  <span>MEMBER SINCE '23</span>
                  <span>PLAYER ONE</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* ── Product Detail Slide-Over ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedProduct && (() => {
          const p = selectedProduct;
          const imgs: string[] = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
          const inCart = cart.some(i => i.id === p.id);
          const handleAdd = () => {
            addToCart(p);
            setAddedToCart(true);
            setTimeout(() => setAddedToCart(false), 2000);
          };
          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProduct(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />

              {/* Panel */}
              <motion.div
                key="panel"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[480px] bg-card border-l border-border flex flex-col shadow-2xl overflow-hidden"
              >
                {/* ── Image area ── */}
                <div className="relative bg-black/60 flex-shrink-0" style={{ minHeight: 300, maxHeight: '45vh' }}>
                  {/* Close */}
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-4 left-4 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>

                  {/* Badge */}
                  {p.badge && (
                    <div className="absolute top-4 right-4 z-10 bg-primary text-primary-foreground text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                      {p.badge}
                    </div>
                  )}

                  {/* Main image */}
                  {imgs.length > 0 ? (
                    <img
                      src={imgs[selectedImageIdx] ?? imgs[0]}
                      alt={p.name}
                      className="w-full h-full object-contain"
                      style={{ minHeight: 300, maxHeight: '45vh' }}
                    />
                  ) : (
                    <div className="w-full flex items-center justify-center text-muted-foreground/30" style={{ minHeight: 300 }}>
                      <ShoppingCart size={64} />
                    </div>
                  )}

                  {/* Prev / Next arrows */}
                  {imgs.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIdx(i => (i - 1 + imgs.length) % imgs.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      >‹</button>
                      <button
                        onClick={() => setSelectedImageIdx(i => (i + 1) % imgs.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                      >›</button>
                    </>
                  )}
                </div>

                {/* Thumbnail strip */}
                {imgs.length > 1 && (
                  <div className="flex gap-1.5 px-4 py-2 bg-background/50 border-b border-border overflow-x-auto flex-shrink-0">
                    {imgs.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIdx(i)}
                        className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${i === selectedImageIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-5">
                    {/* Category + name */}
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1.5">
                        {p.category}{p.subcategory ? ` · ${p.subcategory}` : ''}
                      </div>
                      <h2 className="text-2xl font-black tracking-tight leading-tight text-foreground">
                        {p.name}
                      </h2>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5 text-yellow-400">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} fill={s <= Math.round(p.rating ?? 0) ? 'currentColor' : 'none'} strokeWidth={1.5} />
                        ))}
                      </div>
                      <span className="text-sm font-bold text-foreground">{p.rating}</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-primary">${Number(p.price).toFixed(2)}</span>
                      {(p.oldPrice || (p as any).salePrice) && (
                        <span className="text-base font-bold text-muted-foreground line-through">
                          ${Number(p.oldPrice ?? (p as any).salePrice).toFixed(2)}
                        </span>
                      )}
                      {(p.oldPrice || (p as any).salePrice) && (
                        <span className="text-xs font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase">
                          Save ${(Number(p.oldPrice ?? (p as any).salePrice) - Number(p.price)).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {p.description && (
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        {p.description}
                      </p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-2">
                      {p.condition && (
                        <span className="text-xs font-bold bg-secondary/40 px-3 py-1.5 rounded-full text-foreground">
                          {p.condition}
                        </span>
                      )}
                      {p.sku && (
                        <span className="text-xs font-mono text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-full">
                          SKU: {p.sku}
                        </span>
                      )}
                      {p.stock != null && p.stock > 0 && p.stock < 10 && (
                        <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full">
                          Only {p.stock} left
                        </span>
                      )}
                      {p.stock != null && p.stock === 0 && (
                        <span className="text-xs font-bold text-red-400 bg-red-400/10 px-3 py-1.5 rounded-full">
                          Out of stock
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Sticky CTA ── */}
                <div className="flex-shrink-0 p-4 border-t border-border bg-background/70 backdrop-blur-md space-y-2">
                  <motion.button
                    onClick={handleAdd}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-4 rounded-xl font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                      addedToCart
                        ? 'bg-green-600 text-white shadow-green-600/30'
                        : inCart
                          ? 'bg-primary/20 text-primary border-2 border-primary'
                          : 'bg-primary text-primary-foreground hover:brightness-110 shadow-primary/30'
                    }`}
                  >
                    {addedToCart ? (
                      <><Check size={18} /> Added to Cart!</>
                    ) : inCart ? (
                      <><ShoppingCart size={18} /> Add Another</>
                    ) : (
                      <><ShoppingCart size={18} /> Add to Cart — ${Number(p.price).toFixed(2)}</>
                    )}
                  </motion.button>
                  {inCart && !addedToCart && (
                    <button
                      onClick={() => { setSelectedProduct(null); setCartOpen(true); }}
                      className="w-full py-2.5 rounded-xl font-bold text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      View Cart ({cart.find(i => i.id === p.id)?.quantity}× in cart) →
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      </main>

      <Footer />
    </div>
  );
}
