import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingCart, X, Plus, Minus, Trash2, Filter,
  ChevronDown, ChevronRight, Star, SlidersHorizontal,
  Package, AlertCircle, RefreshCcw, Tag, ChevronLeft
} from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import Footer from '../components/Footer';

// ── Types ───────────────────────────────────────────────────────────────────
interface ProductConfig {
  storageOptions?: string[];
  pricingByStorage?: Record<string, number>;
  ramOptions?: string[];
  pricingByRam?: Record<string, number>;
  colors?: string[];
  colorImages?: Record<string, string[]>;
  conditions?: string[];
  conditionPricing?: Record<string, number>;
  playerCount?: number;
  cabinetType?: string;
  pickupOnly?: boolean;
  availability?: string;
}

interface Product {
  id: string; sku: string; name: string; category: string; subcategory?: string;
  description: string; price: number; old_price?: number; price_note?: string;
  condition: string; configuration?: ProductConfig;
  stock: number; inventory_quantity?: number; images: string[];
  badge?: string; rating: number; active: boolean; featured: boolean;
  verified: boolean; verification_note?: string;
  created_at: string;
}

interface CartItem {
  cartKey: string; productId: string; name: string; price: number;
  quantity: number; image?: string;
  selectedStorage?: string; selectedColor?: string; selectedCondition?: string; selectedRam?: string;
}

// ── Category tree ────────────────────────────────────────────────────────────
const CATEGORY_TREE: Record<string, string[]> = {
  'All': [],
  'Phones': ['iPhone'],
  'Computers': ['MacBook'],
  'Gaming': ['PlayStation', 'Xbox', 'Nintendo', 'Sega / Retro', 'Arcade Machines', 'Video Games', 'Controllers'],
  'Apple': ['Apple', 'Tablets'],
  'Accessories': ['Accessories'],
};
const ALL_DB_CATEGORIES = Object.values(CATEGORY_TREE).flat();

function dbCategoriesFor(main: string): string[] {
  if (main === 'All') return [];
  return CATEGORY_TREE[main] ?? [];
}

// ── Price helpers ────────────────────────────────────────────────────────────
function computePrice(base: number | string, cfg?: ProductConfig, storage?: string, _color?: string, cond?: string, ram?: string): number {
  let p = Number(base);
  if (storage && cfg?.pricingByStorage?.[storage] != null) p += Number(cfg.pricingByStorage[storage]);
  if (cond   && cfg?.conditionPricing?.[cond]    != null) p += Number(cfg.conditionPricing[cond]);
  if (ram    && cfg?.pricingByRam?.[ram]          != null) p += Number(cfg.pricingByRam[ram]);
  return Math.max(0, p);
}

function formatPrice(n: number | string): string {
  const num = Number(n);
  return '$' + (Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2));
}

function startingAt(p: Product): string {
  const cfg = p.configuration;
  if (!cfg) return formatPrice(p.price);
  let min = p.price;
  if (cfg.pricingByStorage) {
    const deltas = Object.values(cfg.pricingByStorage);
    min = Math.min(min, p.price + Math.min(...deltas));
  }
  if (cfg.conditionPricing) {
    const deltas = Object.values(cfg.conditionPricing);
    min = Math.min(min, p.price + Math.min(...deltas));
  }
  if (min < p.price) return `Starting at ${formatPrice(min)}`;
  return formatPrice(p.price);
}

// ── Availability badge ───────────────────────────────────────────────────────
function availText(p: Product): { text: string; cls: string } {
  if (p.configuration?.pickupOnly) return { text: 'Contact for Pickup/Delivery', cls: 'text-blue-400' };
  const qty = p.inventory_quantity ?? p.stock;
  if (qty <= 0) return { text: 'Contact for Availability', cls: 'text-muted-foreground' };
  if (qty === 1) return { text: '1 in Stock', cls: 'text-green-400' };
  if (qty <= 3) return { text: `${qty} in Stock`, cls: 'text-yellow-400' };
  return { text: 'In Stock', cls: 'text-green-400' };
}

// ── Lazy image ───────────────────────────────────────────────────────────────
function LazyImg({ src, alt, className }: { src?: string; alt: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  if (!src || error) {
    return (
      <div className={`${className} bg-card flex items-center justify-center`}>
        <Package size={40} className="text-muted-foreground/30" />
      </div>
    );
  }
  return (
    <div className={`${className} relative overflow-hidden bg-card`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img
        src={src} alt={alt} loading="lazy"
        className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════
export default function ShopPage() {
  const { content } = useSiteData();
  const { shop } = content;

  // ── Products from API ──────────────────────────────────────────────────────
  const [products, setProducts]       = useState<Product[]>([]);
  const [total, setTotal]             = useState(0);
  const [totalPages, setTotalPages]   = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // ── Filter / search / pagination state ────────────────────────────────────
  const [mainCategory, setMainCategory] = useState('All');
  const [subcategory, setSubcategory]   = useState('');
  const [query, setQuery]               = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort]                 = useState('newest');
  const [page, setPage]                 = useState(1);
  const [conditionFilter, setConditionFilter] = useState('');
  const [inStockOnly, setInStockOnly]   = useState(false);
  const [filterOpen, setFilterOpen]     = useState(false);

  // ── Debounce search ────────────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedQuery(query); setPage(1); }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Fetch products ─────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true); setError(null);
    const cats = subcategory ? [subcategory] : dbCategoriesFor(mainCategory);
    const params = new URLSearchParams({ page: String(page), limit: '24', sort });
    if (cats.length === 1) params.set('category', cats[0]);
    if (debouncedQuery) params.set('search', debouncedQuery);
    if (conditionFilter) params.set('condition', conditionFilter);
    if (inStockOnly) params.set('inStock', 'true');

    // Multi-category: fetch in parallel
    try {
      if (cats.length > 1 && !subcategory) {
        const results = await Promise.all(
          cats.map(c => fetch(`/api/products?${new URLSearchParams({ ...Object.fromEntries(params), category: c })}`).then(r => r.json()))
        );
        const all: Product[] = results.flatMap(r => r.products ?? []);
        setProducts(all);
        setTotal(results.reduce((s, r) => s + (r.total ?? 0), 0));
        setTotalPages(1);
      } else {
        const res  = await fetch(`/api/products?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Failed to load products');
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [mainCategory, subcategory, debouncedQuery, sort, page, conditionFilter, inStockOnly]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const resetPage = () => setPage(1);
  const changeMain = (c: string) => { setMainCategory(c); setSubcategory(''); resetPage(); };
  const changeSub  = (c: string) => { setSubcategory(c); resetPage(); };

  // ── Cart ───────────────────────────────────────────────────────────────────
  const [cart, setCart]         = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutBanner, setCheckoutBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('checkout') === 'success') return { type: 'success', text: '🎉 Order placed! Check your email for confirmation.' };
    if (p.get('checkout') === 'cancelled') return { type: 'error', text: 'Checkout cancelled — your cart is saved.' };
    return null;
  });

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const addToCart = useCallback((p: Product, storage?: string, color?: string, cond?: string, ram?: string) => {
    const price = computePrice(p.price, p.configuration, storage, color, cond, ram);
    const key = [p.id, storage, color, cond, ram].filter(Boolean).join('|');
    setCart(prev => {
      const ex = prev.find(x => x.cartKey === key);
      if (ex) return prev.map(x => x.cartKey === key ? { ...x, quantity: x.quantity + 1 } : x);
      return [...prev, {
        cartKey: key, productId: p.id, name: p.name, price,
        quantity: 1, image: p.images?.[0],
        selectedStorage: storage, selectedColor: color, selectedCondition: cond, selectedRam: ram,
      }];
    });
    setCartOpen(true);
  }, []);

  const removeFromCart  = (key: string) => setCart(p => p.filter(x => x.cartKey !== key));
  const updateQty = (key: string, d: number) =>
    setCart(p => p.map(x => x.cartKey === key ? { ...x, quantity: Math.max(1, x.quantity + d) } : x));

  const handleCheckout = async () => {
    if (!cart.length) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({
            productId: i.productId, quantity: i.quantity,
            storage: i.selectedStorage, color: i.selectedColor, condition: i.selectedCondition,
            ram: i.selectedRam,
          })),
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setCheckoutBanner({ type: 'error', text: data.error ?? 'Checkout failed — please try again.' });
    } catch {
      setCheckoutBanner({ type: 'error', text: 'Network error — please try again.' });
    } finally { setCheckoutLoading(false); }
  };

  // ── Product detail modal ───────────────────────────────────────────────────
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImg, setSelectedImg]         = useState(0);
  const [selStorage, setSelStorage]           = useState('');
  const [selColor, setSelColor]               = useState('');
  const [selRam, setSelRam]                   = useState('');
  const [selCondition, setSelCondition]       = useState('');

  const openProduct = (p: Product) => {
    setSelectedProduct(p);
    setSelectedImg(0);
    const cfg = p.configuration;
    setSelStorage(cfg?.storageOptions?.[0] ?? '');
    setSelColor(cfg?.colors?.[0] ?? '');
    setSelRam(cfg?.ramOptions?.[0] ?? '');
    setSelCondition(cfg?.conditions?.[0] ?? p.condition);
  };

  const detailPrice = selectedProduct
    ? computePrice(selectedProduct.price, selectedProduct.configuration, selStorage, selColor, selCondition, selRam)
    : 0;

  // ── Sub-nav derived from main category ─────────────────────────────────────
  const subcats = CATEGORY_TREE[mainCategory] ?? [];

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground">

      {/* Checkout Banner */}
      <AnimatePresence>
        {checkoutBanner && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`flex items-center justify-between px-6 py-3 text-sm font-bold overflow-hidden ${checkoutBanner.type === 'success' ? 'bg-green-600 text-white' : 'bg-destructive text-destructive-foreground'}`}>
            <span>{checkoutBanner.text}</span>
            <button onClick={() => setCheckoutBanner(null)} className="ml-4 opacity-70 hover:opacity-100">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promo banner */}
      {shop.promoBanner && (
        <div className="bg-primary text-primary-foreground text-xs font-bold py-2 px-4 text-center tracking-wider">
          {shop.promoBanner}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
          <a href="/" className="text-xl font-black tracking-tight uppercase italic text-foreground mr-4">
            {content.site.name}
          </a>

          {/* Search */}
          <div className="flex-1 max-w-2xl relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search iPhones, MacBooks, PS5, arcade cabinets…"
              className="w-full bg-background border border-border focus:border-primary text-foreground rounded-full py-2 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground" />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={16} /></button>}
          </div>

          <div className="flex-1 sm:hidden" />

          {/* Cart */}
          <div className="relative">
            <button onClick={() => setCartOpen(!cartOpen)}
              className="relative p-2.5 rounded-full hover:bg-muted transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-card">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Cart Drawer */}
            <AnimatePresence>
              {cartOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCartOpen(false)} />
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-50 flex flex-col max-h-[85vh]">
                    <div className="p-4 border-b border-border flex justify-between items-center">
                      <h3 className="font-bold text-base">Your Cart</h3>
                      <button onClick={() => setCartOpen(false)}><X size={18} className="text-muted-foreground" /></button>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-4">
                      {!cart.length ? (
                        <div className="text-center text-muted-foreground py-10">
                          <ShoppingCart size={44} className="mx-auto mb-3 opacity-20" />
                          <p className="font-medium">Your cart is empty</p>
                        </div>
                      ) : cart.map(item => (
                        <div key={item.cartKey} className="flex gap-3 items-start">
                          <div className="w-14 h-14 rounded-lg overflow-hidden border border-border flex-shrink-0">
                            <LazyImg src={item.image} alt={item.name} className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold line-clamp-2">{item.name}</p>
                            {[item.selectedStorage, item.selectedRam, item.selectedColor, item.selectedCondition].filter(Boolean).length > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {[item.selectedStorage, item.selectedRam, item.selectedColor, item.selectedCondition].filter(Boolean).join(' · ')}
                              </p>
                            )}
                            <p className="text-primary font-bold text-sm mt-1">{formatPrice(item.price)}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex items-center gap-1 bg-background rounded-lg border border-border px-1">
                                <button onClick={() => updateQty(item.cartKey, -1)} className="p-1 hover:text-primary"><Minus size={12} /></button>
                                <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQty(item.cartKey, 1)} className="p-1 hover:text-primary"><Plus size={12} /></button>
                              </div>
                              <button onClick={() => removeFromCart(item.cartKey)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 size={14} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {cart.length > 0 && (
                      <div className="p-4 border-t border-border bg-background/50">
                        <div className="flex justify-between items-center mb-3 font-bold">
                          <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
                        </div>
                        <button onClick={handleCheckout} disabled={checkoutLoading}
                          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-black hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                          {checkoutLoading
                            ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Processing…</>
                            : '🔒 Checkout with Stripe'}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile search */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full bg-background border border-border text-foreground rounded-full py-2 pl-9 pr-4 text-sm outline-none focus:border-primary placeholder:text-muted-foreground" />
          </div>
        </div>

        {/* Main category nav */}
        <nav className="border-t border-border overflow-x-auto scrollbar-none">
          <div className="flex min-w-max px-4 md:px-6">
            {Object.keys(CATEGORY_TREE).map(c => (
              <button key={c} onClick={() => changeMain(c)}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border-b-2 ${mainCategory === c ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                {c}
              </button>
            ))}
          </div>
        </nav>

        {/* Subcategory tabs */}
        {subcats.length > 0 && (
          <div className="bg-background border-t border-border overflow-x-auto scrollbar-none">
            <div className="flex min-w-max px-4 md:px-6 gap-1 py-1.5">
              <button onClick={() => changeSub('')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${!subcategory ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-card'}`}>
                All {mainCategory}
              </button>
              {subcats.map(s => (
                <button key={s} onClick={() => changeSub(s)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${subcategory === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-card'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground font-medium">
              {loading ? 'Loading…' : `${total.toLocaleString()} products`}
            </span>
            {(conditionFilter || inStockOnly) && (
              <button onClick={() => { setConditionFilter(''); setInStockOnly(false); }}
                className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold hover:bg-primary/20">
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Filter button */}
            <button onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filterOpen ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary'}`}>
              <SlidersHorizontal size={14} /> Filters
            </button>
            {/* Sort */}
            <div className="relative">
              <select value={sort} onChange={e => { setSort(e.target.value); resetPage(); }}
                className="appearance-none bg-card border border-border text-foreground text-xs font-bold rounded-xl px-3 pr-7 py-2 outline-none cursor-pointer hover:border-primary transition-colors">
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="name_asc">Name A–Z</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-5">
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-4 items-end">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Condition</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['', 'New / Open Box', 'Used-Good', 'Used-Fair', 'For Parts'].map(c => (
                      <button key={c} onClick={() => { setConditionFilter(c); resetPage(); }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${conditionFilter === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}>
                        {c || 'Any'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Availability</p>
                  <button onClick={() => { setInStockOnly(!inStockOnly); resetPage(); }}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all border ${inStockOnly ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}>
                    <Package size={12} /> In Stock Only
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 text-center mb-6">
            <AlertCircle size={32} className="mx-auto mb-3 text-destructive" />
            <p className="font-bold text-destructive mb-3">{error}</p>
            <button onClick={fetchProducts}
              className="flex items-center gap-2 mx-auto bg-destructive text-white px-4 py-2 rounded-xl font-bold text-sm hover:brightness-110">
              <RefreshCcw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && !products.length && (
          <div className="text-center py-20 text-muted-foreground">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold mb-2">No products found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
            <button onClick={() => { setQuery(''); setConditionFilter(''); setInStockOnly(false); changeMain('All'); }}
              className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold text-sm hover:brightness-110">
              Clear all filters
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {products.map(p => {
              const avail = availText(p);
              const cfg   = p.configuration;
              const hasVariants = !!(cfg?.storageOptions?.length || cfg?.colors?.length || cfg?.conditions?.length);
              return (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col group cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all"
                  onClick={() => openProduct(p)}>
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    <LazyImg src={p.images?.[0]} alt={p.name} className="w-full h-full group-hover:scale-105 transition-transform duration-300" />
                    {p.badge && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {p.badge}
                      </span>
                    )}
                    {!p.verified && (
                      <span className="absolute top-2 right-2 bg-yellow-500/90 text-black text-[9px] font-black px-2 py-0.5 rounded-full">
                        REVIEW
                      </span>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">{p.subcategory ?? p.category}</p>
                    <p className="text-xs font-bold line-clamp-2 flex-1 mb-2">{p.name}</p>
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10} className={i < Math.round(p.rating) ? 'text-primary fill-primary' : 'text-muted-foreground'} />
                      ))}
                    </div>
                    <div className="flex items-end justify-between gap-1 mt-auto">
                      <div>
                        <p className="text-sm font-black text-foreground">{startingAt(p)}</p>
                        {p.old_price && <p className="text-xs line-through text-muted-foreground">{formatPrice(p.old_price)}</p>}
                      </div>
                      <p className={`text-[10px] font-bold ${avail.cls} text-right leading-tight`}>{avail.text}</p>
                    </div>
                    {hasVariants && <p className="text-[10px] text-muted-foreground mt-1">Select options</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-xl bg-card border border-border disabled:opacity-40 hover:border-primary transition-all">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pg: number;
              if (totalPages <= 7) { pg = i + 1; }
              else if (page <= 4) { pg = i + 1; }
              else if (page >= totalPages - 3) { pg = totalPages - 6 + i; }
              else { pg = page - 3 + i; }
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all ${pg === page ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary'}`}>
                  {pg}
                </button>
              );
            })}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-xl bg-card border border-border disabled:opacity-40 hover:border-primary transition-all">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* ── Product Detail — right-side panel, same format as shop cards ──────── */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedProduct(null)}
            />

            {/* Panel — slides in from right */}
            <motion.div
              key="panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[500px] bg-card border-l border-border flex flex-col shadow-2xl"
            >
              {/* ── Image area ── */}
              <div className="relative flex-shrink-0 bg-background overflow-hidden" style={{ aspectRatio: '1/1', maxHeight: '42vh' }}>
                {/* Close */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 left-3 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                  aria-label="Close"
                ><X size={16} /></button>

                {/* Badge */}
                {selectedProduct.badge && (
                  <span className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {selectedProduct.badge}
                  </span>
                )}

                <LazyImg
                  src={selectedProduct.images?.[selectedImg] ?? selectedProduct.images?.[0]}
                  alt={selectedProduct.name}
                  className="w-full h-full"
                />

                {/* Image prev/next */}
                {selectedProduct.images?.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImg(i => (i - 1 + selectedProduct.images.length) % selectedProduct.images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors text-lg"
                    >‹</button>
                    <button
                      onClick={() => setSelectedImg(i => (i + 1) % selectedProduct.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors text-lg"
                    >›</button>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {selectedProduct.images?.length > 1 && (
                <div className="flex gap-1.5 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 bg-background/60">
                  {selectedProduct.images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)}
                      className={`w-11 h-11 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${i === selectedImg ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                      <LazyImg src={img} alt="" className="w-full h-full" />
                    </button>
                  ))}
                </div>
              )}

              {/* ── Scrollable content ── */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-4">

                  {/* Unverified warning */}
                  {!selectedProduct.verified && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-400 font-bold flex items-center gap-2">
                      <AlertCircle size={14} /> {selectedProduct.verification_note ?? 'This item needs review before purchase — contact us.'}
                    </div>
                  )}

                  {/* Category + name */}
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1">
                      {selectedProduct.subcategory ?? selectedProduct.category}
                    </p>
                    <h2 className="text-xl font-black leading-tight">{selectedProduct.name}</h2>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={13} className={i < Math.round(selectedProduct.rating) ? 'text-primary fill-primary' : 'text-muted-foreground'} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{selectedProduct.rating}/5</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-2xl font-black text-primary">{formatPrice(detailPrice)}</span>
                    {selectedProduct.old_price && (
                      <span className="text-sm font-bold text-muted-foreground line-through">{formatPrice(selectedProduct.old_price)}</span>
                    )}
                    {selectedProduct.old_price && (
                      <span className="text-xs font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                        Save {formatPrice(Number(selectedProduct.old_price) - detailPrice)}
                      </span>
                    )}
                  </div>
                  {selectedProduct.price_note && (
                    <p className="text-xs text-muted-foreground -mt-2">{selectedProduct.price_note}</p>
                  )}

                  {/* Variants */}
                  {selectedProduct.configuration?.storageOptions && (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2">Storage</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.configuration.storageOptions.map(s => (
                          <button key={s} onClick={() => setSelStorage(s)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selStorage === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
                            {s}{selectedProduct.configuration?.pricingByStorage?.[s] ? ` (${selectedProduct.configuration.pricingByStorage[s] > 0 ? '+' : ''}${formatPrice(selectedProduct.configuration.pricingByStorage[s])})` : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.configuration?.ramOptions && (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2">RAM</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.configuration.ramOptions.map(r => (
                          <button key={r} onClick={() => setSelRam(r)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selRam === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
                            {r}{selectedProduct.configuration?.pricingByRam?.[r] ? ` (${selectedProduct.configuration.pricingByRam[r] > 0 ? '+' : ''}${formatPrice(selectedProduct.configuration.pricingByRam[r])})` : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.configuration?.colors && !selectedProduct.configuration?.ramOptions && (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2">Color</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.configuration.colors.map(c => (
                          <button key={c} onClick={() => setSelColor(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selColor === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.configuration?.conditions && (
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2">Condition</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProduct.configuration.conditions.map(c => (
                          <button key={c} onClick={() => setSelCondition(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selCondition === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary'}`}>
                            {c}{selectedProduct.configuration?.conditionPricing?.[c] ? ` (${selectedProduct.configuration.conditionPricing[c] > 0 ? '+' : ''}${formatPrice(selectedProduct.configuration.conditionPricing[c])})` : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Availability */}
                  {(() => { const av = availText(selectedProduct); return (
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${av.cls}`}>{av.text}</span>
                    </div>
                  ); })()}

                  {/* Pickup/delivery note */}
                  {selectedProduct.configuration?.availability && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-400 font-medium">
                      📦 {selectedProduct.configuration.availability}
                    </div>
                  )}

                  {/* Description */}
                  {selectedProduct.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                      {selectedProduct.description}
                    </p>
                  )}

                  {/* Tags */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <Tag size={11} className="text-muted-foreground/60" />
                    {[selectedProduct.category, selectedProduct.subcategory, selectedProduct.condition].filter(Boolean).map(t => (
                      <span key={t} className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Sticky CTA ── */}
              <div className="flex-shrink-0 p-4 border-t border-border bg-background/70 backdrop-blur-md">
                <button
                  onClick={() => {
                    addToCart(selectedProduct, selStorage, selColor || undefined, selCondition || undefined, selRam || undefined);
                    setSelectedProduct(null);
                  }}
                  disabled={!selectedProduct.verified}
                  className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  <ShoppingCart size={16} />
                  {selectedProduct.configuration?.pickupOnly
                    ? 'Contact for Purchase'
                    : selectedProduct.verified
                      ? `Add to Cart — ${formatPrice(detailPrice)}`
                      : 'Item Needs Verification'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
