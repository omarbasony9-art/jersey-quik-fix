import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, ShoppingCart, User, MapPin, ChevronRight, Star, Menu, X, Gamepad2, RefreshCcw, BadgeDollarSign } from 'lucide-react';
import './styles.css';

const products = [
  { id: 1, name: 'PlayBox 5 Console', category: 'Consoles', price: 499.99, oldPrice: 549.99, rating: 4.9, badge: 'Best Seller', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80' },
  { id: 2, name: 'Nebula Pro Wireless Controller', category: 'Accessories', price: 69.99, rating: 4.7, image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=900&q=80' },
  { id: 3, name: 'Monster Quest: Eclipse', category: 'Games', price: 69.99, rating: 4.8, badge: 'New Release', image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=900&q=80' },
  { id: 4, name: 'Elite Gaming Headset', category: 'Accessories', price: 119.99, rating: 4.6, image: 'https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=900&q=80' },
  { id: 5, name: 'Mystic Monsters Booster Box', category: 'Trading Cards', price: 134.99, rating: 4.9, badge: 'Hot', image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&w=900&q=80' },
  { id: 6, name: 'Retro Handheld Console', category: 'Retro', price: 149.99, rating: 4.5, image: 'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?auto=format&fit=crop&w=900&q=80' },
  { id: 7, name: 'Collector Figure - Titan', category: 'Collectibles', price: 39.99, rating: 4.7, image: 'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?auto=format&fit=crop&w=900&q=80' },
  { id: 8, name: 'Velocity Racing 26', category: 'Games', price: 59.99, rating: 4.4, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80' }
];

const categories = ['Games', 'Consoles', 'Accessories', 'Trading Cards', 'Collectibles', 'Retro'];

function App() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tradeType, setTradeType] = useState('Console');
  const [tradeCondition, setTradeCondition] = useState('Good');
  const [tradeValue, setTradeValue] = useState(null);

  const filtered = useMemo(() => products.filter(p => {
    const categoryOk = activeCategory === 'All' || p.category === activeCategory;
    const queryOk = p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase());
    return categoryOk && queryOk;
  }), [query, activeCategory]);

  const addToCart = product => setCart(prev => [...prev, product]);
  const cartTotal = cart.reduce((sum, p) => sum + p.price, 0);

  const estimateTrade = () => {
    const base = { Console: 220, Game: 28, Controller: 35, 'Trading Card': 70 }[tradeType] || 30;
    const modifier = { Excellent: 1.15, Good: 1, Fair: 0.72 }[tradeCondition];
    setTradeValue(Math.round(base * modifier));
  };

  return (
    <div className="app">
      <div className="topbar">FREE SHIPPING ON ORDERS $79+ <span>•</span> MEMBERS EARN MORE</div>

      <header className="header">
        <button className="iconBtn mobile" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
        <div className="logo"><span>GAME</span>VAULT</div>
        <div className="searchWrap">
          <Search size={19}/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search games, consoles, cards & more" />
        </div>
        <div className="headerActions">
          <button className="action"><MapPin size={19}/><span>Stores</span></button>
          <button className="action"><User size={19}/><span>Account</span></button>
          <button className="cartBtn"><ShoppingCart size={21}/><b>{cart.length}</b></button>
        </div>
      </header>

      <nav className={`nav ${menuOpen ? 'open' : ''}`}>
        {categories.map(c => <button key={c} onClick={() => {setActiveCategory(c);setMenuOpen(false)}}>{c}</button>)}
        <button className="tradeNav" onClick={() => document.getElementById('trade').scrollIntoView({behavior:'smooth'})}>Trade In</button>
        <button>Deals</button>
      </nav>

      <section className="hero">
        <div className="heroShade"></div>
        <div className="heroContent">
          <div className="eyebrow">LEVEL UP YOUR SETUP</div>
          <h1>PLAY MORE.<br/>PAY LESS.</h1>
          <p>Shop new releases, pre-owned favorites, consoles, trading cards and collectibles.</p>
          <div className="heroBtns">
            <button className="primary" onClick={() => document.getElementById('shop').scrollIntoView({behavior:'smooth'})}>SHOP NOW</button>
            <button className="secondary" onClick={() => document.getElementById('trade').scrollIntoView({behavior:'smooth'})}>TRADE & SAVE</button>
          </div>
        </div>
      </section>

      <section className="quickTiles">
        <div><Gamepad2/><b>Shop Gaming</b><span>Games, consoles & gear</span></div>
        <div><RefreshCcw/><b>Trade It In</b><span>Get cash or store credit</span></div>
        <div><BadgeDollarSign/><b>Member Rewards</b><span>Earn on every purchase</span></div>
      </section>

      <section id="shop" className="section">
        <div className="sectionHead">
          <div><span className="kicker">TRENDING NOW</span><h2>Featured Products</h2></div>
          <button className="linkBtn" onClick={() => setActiveCategory('All')}>View all <ChevronRight size={18}/></button>
        </div>

        <div className="chips">
          {['All', ...categories].map(c => <button key={c} className={activeCategory===c?'active':''} onClick={() => setActiveCategory(c)}>{c}</button>)}
        </div>

        <div className="productGrid">
          {filtered.map(p => (
            <article className="card" key={p.id}>
              <div className="imgWrap">
                {p.badge && <span className="badge">{p.badge}</span>}
                <img src={p.image} alt={p.name}/>
              </div>
              <div className="cardBody">
                <span className="category">{p.category}</span>
                <h3>{p.name}</h3>
                <div className="rating"><Star size={15} fill="currentColor"/> {p.rating}</div>
                <div className="priceRow"><strong>${p.price.toFixed(2)}</strong>{p.oldPrice && <s>${p.oldPrice.toFixed(2)}</s>}</div>
                <button className="addBtn" onClick={() => addToCart(p)}>ADD TO CART</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="promoGrid section">
        <div className="promo promoDark"><span>PRE-OWNED</span><h3>Save big on games & consoles</h3><p>Tested. Guaranteed. Ready to play.</p><button onClick={() => setActiveCategory('Consoles')}>SHOP PRE-OWNED</button></div>
        <div className="promo promoCards"><span>COLLECT</span><h3>Trading cards are here</h3><p>Sealed product, singles and collector favorites.</p><button onClick={() => setActiveCategory('Trading Cards')}>SHOP CARDS</button></div>
      </section>

      <section id="trade" className="tradeSection">
        <div className="tradeCopy">
          <span className="kicker light">TRADE IN</span>
          <h2>Your old gear has value.</h2>
          <p>Estimate your trade value, then bring your item to a store. Choose cash or get more with store credit.</p>
          <ul><li>Consoles</li><li>Games</li><li>Controllers</li><li>Trading cards</li></ul>
        </div>
        <div className="tradeBox">
          <h3>Estimate Trade Value</h3>
          <label>Item type</label>
          <select value={tradeType} onChange={e=>setTradeType(e.target.value)}>
            <option>Console</option><option>Game</option><option>Controller</option><option>Trading Card</option>
          </select>
          <label>Condition</label>
          <select value={tradeCondition} onChange={e=>setTradeCondition(e.target.value)}>
            <option>Excellent</option><option>Good</option><option>Fair</option>
          </select>
          <button className="primary full" onClick={estimateTrade}>GET ESTIMATE</button>
          {tradeValue !== null && <div className="estimate"><span>Estimated store credit</span><strong>${tradeValue}</strong><small>Demo estimate only. Final value depends on item details and inspection.</small></div>}
        </div>
      </section>

      <section className="membership section">
        <div><span>GAMEVAULT+</span><h2>More rewards. More savings.</h2><p>Members get bonus points, special pricing and exclusive offers.</p></div>
        <button>JOIN NOW</button>
      </section>

      <section className="cartPreview section">
        <div><span className="kicker">YOUR CART</span><h2>{cart.length ? `${cart.length} item${cart.length>1?'s':''}` : 'Your cart is empty'}</h2></div>
        {cart.length > 0 && <div className="cartSummary"><span>Subtotal</span><strong>${cartTotal.toFixed(2)}</strong><button onClick={()=>alert('Demo checkout — connect Stripe or Shopify for live payments.')}>CHECKOUT</button></div>}
      </section>

      <footer>
        <div className="logo footerLogo"><span>GAME</span>VAULT</div>
        <p>Original demo storefront inspired by modern gaming retailers. Not affiliated with GameStop.</p>
        <div className="footerLinks"><a href="#shop">Shop</a><a href="#trade">Trade</a><a href="#">Support</a><a href="#">Privacy</a></div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App/>);
