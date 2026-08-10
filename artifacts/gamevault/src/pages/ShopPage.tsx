import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShoppingCart, User, MapPin, ChevronRight, 
  Star, Menu, X, Gamepad2, RefreshCcw, BadgeDollarSign,
  Plus, Minus, Trash2
} from 'lucide-react';
import { useSiteData, type Product } from '../context/SiteDataContext';
import Footer from '../components/Footer';

const tradeValues: Record<string, number> = {
  'Console': 220,
  'Game': 28,
  'Controller': 35,
  'Trading Card': 70
};

const conditionMultipliers: Record<string, number> = {
  'Excellent': 1.15,
  'Good': 1.0,
  'Fair': 0.72
};

type CartItem = Product & { quantity: number };

export default function ShopPage() {
  const { content } = useSiteData();
  const { shop } = content;
  const products = shop.products.filter(p => p.active);
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  const [tradeType, setTradeType] = useState<string>('Console');
  const [tradeCondition, setTradeCondition] = useState<string>('Good');

  // Filtering products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [query, activeCategory]);

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

  // Trade Estimator calculation
  const estimatedValue = Math.round(tradeValues[tradeType] * conditionMultipliers[tradeCondition]);

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      
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
            <button className="hidden md:flex items-center justify-center p-3 rounded-full hover:bg-card transition-colors">
              <User size={22} className="text-foreground" />
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
                      <div className="p-4 border-t border-border bg-background/50">
                        <div className="flex justify-between items-center mb-4 font-bold text-lg">
                          <span>Subtotal</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => alert('Checkout flow triggered! (Mock)')}
                          className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                          Secure Checkout
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
              placeholder="Search games..." 
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
          <div className="flex items-center gap-6 flex-1">
            {categories.slice(1, 5).map(cat => (
              <button 
                key={cat} 
                onClick={() => {
                  setActiveCategory(cat);
                  // Optional: smooth scroll to products
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-muted-foreground hover:text-primary transition-colors uppercase"
              >
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
              {categories.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => { setActiveCategory(cat); setMenuOpen(false); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className={`text-left ${activeCategory === cat ? 'text-primary' : 'text-foreground'}`}
                >
                  {cat}
                </button>
              ))}
              <hr className="border-border my-2" />
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
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${
                      activeCategory === cat 
                        ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                        : 'bg-card text-foreground hover:bg-card/80 border border-border'
                    }`}
                  >
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
                  className="bg-card rounded-2xl overflow-hidden border border-border hover:border-t-2 hover:border-primary hover:scale-[1.02] transition-all duration-300 group flex flex-col shadow-sm hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]"
                >
                  <div className="relative min-h-[220px] md:min-h-[260px] overflow-hidden bg-black/50">
                    {product.badge && (
                      <div className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                        {product.badge}
                      </div>
                    )}
                    <img 
                      src={product.image} 
                      alt={product.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Add to cart overlay button on desktop */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center backdrop-blur-[2px]">
                      <button 
                        onClick={() => addToCart(product)}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-black uppercase translate-y-4 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2"
                      >
                        <ShoppingCart size={18} /> Add
                      </button>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{product.category}</div>
                    <h3 className="font-black text-lg tracking-tight leading-tight mb-2 flex-1 group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 mb-3 text-yellow-400">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold text-foreground">{product.rating}</span>
                    </div>

                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        {product.oldPrice && (
                          <div className="text-xs text-muted-foreground line-through font-bold">${product.oldPrice}</div>
                        )}
                        <div className="font-black text-xl text-primary">${product.price}</div>
                      </div>
                      <button 
                        onClick={() => addToCart(product)}
                        className="md:hidden bg-primary/20 text-primary p-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <ShoppingCart size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center justify-center bg-card rounded-2xl border border-dashed border-border">
                <Search size={48} className="mb-4 opacity-20" />
                <h3 className="text-2xl font-black uppercase">No loot found</h3>
                <p>Try adjusting your search or category filters.</p>
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

        {/* Trade-In Estimator */}
        <section id="trade" className="py-24 bg-card border-y border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
            <RefreshCcw size={48} className="mx-auto text-primary mb-6" />
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tight mb-6">
              Turn Old Gear <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Into New Loot</span>
            </h2>
            <p className="text-lg text-muted-foreground font-medium mb-12 max-w-2xl mx-auto">
              Answer two quick questions to get an instant estimate on your trade-in value. 
              Bring it into the store to finalize and get paid.
            </p>

            <div className="bg-background border border-border p-8 rounded-3xl shadow-2xl text-left max-w-2xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-sm font-black uppercase tracking-wider text-muted-foreground mb-3">Item Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(tradeValues).map(type => (
                      <button 
                        key={type}
                        onClick={() => setTradeType(type)}
                        className={`p-3 rounded-xl border text-sm font-bold transition-all ${tradeType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card hover:border-primary/50'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-black uppercase tracking-wider text-muted-foreground mb-3">Condition</label>
                  <div className="flex flex-col gap-2">
                    {Object.keys(conditionMultipliers).map(cond => (
                      <button 
                        key={cond}
                        onClick={() => setTradeCondition(cond)}
                        className={`p-3 rounded-xl border text-sm font-bold text-left transition-all ${tradeCondition === cond ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-card hover:border-accent/50'}`}
                      >
                        {cond} 
                        <span className="block text-xs font-normal opacity-70 mt-1">
                          {cond === 'Excellent' && 'Like new, complete in box'}
                          {cond === 'Good' && 'Normal wear, fully functional'}
                          {cond === 'Fair' && 'Heavy wear, missing pieces'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between border border-border gap-6">
                <div>
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Estimated Store Credit</div>
                  <div className="text-4xl font-black text-foreground flex items-baseline gap-2">
                    <motion.span
                      key={estimatedValue}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-primary"
                    >
                      ${estimatedValue}
                    </motion.span>
                    <span className="text-lg text-muted-foreground">.00</span>
                  </div>
                </div>
                <button className="w-full sm:w-auto bg-foreground text-background px-8 py-4 rounded-xl font-black uppercase hover:bg-primary transition-colors">
                  Find a Store
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Membership Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-secondary via-background to-black border border-secondary/30 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 overflow-hidden relative shadow-2xl">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 max-w-xl">
              <div className="flex items-center gap-3 mb-6">
                <Star className="text-primary" size={32} fill="currentColor" />
                <h3 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight">JQF<span className="text-primary">+</span></h3>
              </div>
              <h4 className="text-2xl font-bold mb-4">The ultimate cheat code for gamers.</h4>
              <ul className="space-y-3 mb-8 text-foreground/80 font-medium">
                <li className="flex items-center gap-3"><ChevronRight className="text-primary" size={20} /> Double reward points on all purchases</li>
                <li className="flex items-center gap-3"><ChevronRight className="text-primary" size={20} /> 10% extra trade-in credit</li>
                <li className="flex items-center gap-3"><ChevronRight className="text-primary" size={20} /> Exclusive early access to restocks</li>
                <li className="flex items-center gap-3"><ChevronRight className="text-primary" size={20} /> Free expedited shipping</li>
              </ul>
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 transition-all w-full sm:w-auto shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                Join for $14.99/yr
              </button>
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

      </main>

      <Footer />
    </div>
  );
}
