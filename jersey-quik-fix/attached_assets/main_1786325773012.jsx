import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const Icon = ({ name, size = 26 }) => {
  const icons = {
    phone: 'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h2',
    laptop: 'M4 5h16v11H4V5Zm-2 14h20',
    tablet: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm4 17h2',
    game: 'M8 10h8l3 2 2 7-3 1-3-3H9l-3 3-3-1 2-7 3-2Zm1 3v4m-2-2h4m5-1h.01M18 16h.01',
    pin: 'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    shield: 'M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Zm-3 9 2 2 4-4',
    check: 'm5 12 4 4L19 6',
    clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5v5l3 2',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 4 4',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
    star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z',
    menu: 'M4 7h16M4 12h16M4 17h16',
    x: 'M6 6l12 12M18 6 6 18'
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]} /></svg>;
};

const devices = [
  { id: 'phone', title: 'Phone', desc: 'Screen, battery, camera & more', icon: 'phone' },
  { id: 'computer', title: 'Computer', desc: 'Laptop & desktop repairs', icon: 'laptop' },
  { id: 'tablet', title: 'Tablet', desc: 'Screens, charging & batteries', icon: 'tablet' },
  { id: 'console', title: 'Game console', desc: 'HDMI, power & overheating', icon: 'game' },
];

const repairOptions = {
  phone: ['Cracked screen', 'Battery replacement', 'Charging issue', 'Camera problem', 'Water damage'],
  computer: ['Won’t turn on', 'Broken screen', 'Running slow', 'Battery issue', 'Data recovery'],
  tablet: ['Cracked screen', 'Battery replacement', 'Charging issue', 'Button problem', 'Water damage'],
  console: ['HDMI port repair', 'Overheating', 'Disc drive issue', 'Power problem', 'Controller issue'],
};

const locations = [
  { city: 'Downtown', address: '125 Market Street', distance: '1.2 mi', open: 'Open until 7 PM' },
  { city: 'Northside', address: '4800 North Avenue', distance: '4.8 mi', open: 'Open until 8 PM' },
  { city: 'West End', address: '892 West Plaza Drive', distance: '7.1 mi', open: 'Open until 7 PM' },
];

const reviews = [
  { name: 'Alex M.', device: 'Phone screen repair', text: 'Booked in the morning and had my phone back before lunch. Fast, clear, and easy.' },
  { name: 'Jordan R.', device: 'Laptop repair', text: 'They explained the issue before doing any work and the final price matched the quote.' },
  { name: 'Taylor K.', device: 'Game console repair', text: 'My console stopped displaying through HDMI. They fixed the port and tested everything with me.' },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [repairOpen, setRepairOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState('');
  const [issue, setIssue] = useState('');
  const [zip, setZip] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [faq, setFaq] = useState(null);

  const chosenDevice = useMemo(() => devices.find(d => d.id === device), [device]);

  const startRepair = (deviceId = '') => {
    setDevice(deviceId);
    setIssue('');
    setStep(deviceId ? 2 : 1);
    setRepairOpen(true);
  };

  const closeRepair = () => {
    setRepairOpen(false);
    setStep(1);
  };

  return <div className="site-shell">
    <div className="promo">Same-day appointments available at select locations. <button onClick={() => startRepair()}>Start a repair</button></div>

    <header className="header">
      <a className="logo" href="#top" aria-label="RepairHub home"><span className="logo-mark">R</span><span>Repair<span>Hub</span></span></a>
      <nav className="desktop-nav">
        <a href="#repairs">Repairs</a><a href="#why">Why us</a><a href="#locations">Locations</a><a href="#guides">Guides</a>
      </nav>
      <div className="header-actions">
        <a className="find-link" href="#locations"><Icon name="pin" size={20}/> Find a store</a>
        <button className="btn primary small" onClick={() => startRepair()}>Start a repair</button>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}><Icon name={menuOpen ? 'x' : 'menu'} /></button>
      </div>
    </header>

    {menuOpen && <div className="mobile-menu"><a href="#repairs" onClick={() => setMenuOpen(false)}>Repairs</a><a href="#why" onClick={() => setMenuOpen(false)}>Why us</a><a href="#locations" onClick={() => setMenuOpen(false)}>Locations</a><a href="#guides" onClick={() => setMenuOpen(false)}>Guides</a><button className="btn primary" onClick={() => { setMenuOpen(false); startRepair(); }}>Start a repair</button></div>}

    <main id="top">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Local tech repair, made simple</span>
          <h1>Broken tech?<br/><em>We can fix that.</em></h1>
          <p>Fast, professional repairs for the devices you rely on every day—from cracked phone screens to game console HDMI ports.</p>
          <div className="hero-actions"><button className="btn primary large" onClick={() => startRepair()}>Start a repair <Icon name="arrow" size={20}/></button><a className="btn ghost large" href="#locations"><Icon name="pin" size={20}/> Find a store</a></div>
          <div className="hero-proof"><span><Icon name="check" size={18}/> Free diagnostics</span><span><Icon name="check" size={18}/> Same-day options</span><span><Icon name="check" size={18}/> 1-year warranty</span></div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="blob"></div>
          <div className="device-card phone-card"><div className="speaker"></div><div className="crack c1"></div><div className="crack c2"></div><div className="repair-badge"><span>✓</span> Ready today</div></div>
          <div className="tool-card"><span className="tool-icon">✦</span><div><strong>Expert repair</strong><small>Quality parts. Clear pricing.</small></div></div>
        </div>
      </section>

      <section id="repairs" className="section repairs-section">
        <div className="section-head"><div><span className="eyebrow">What can we fix?</span><h2>Choose your device</h2></div><p>From everyday accidents to the weird stuff, our technicians can diagnose and repair most devices.</p></div>
        <div className="device-grid">{devices.map(d => <button className="device-tile" key={d.id} onClick={() => startRepair(d.id)}><span className="device-icon"><Icon name={d.icon} size={38}/></span><span><strong>{d.title}</strong><small>{d.desc}</small></span><Icon name="arrow" size={20}/></button>)}</div>
        <div className="all-device-note">Don't see your device? <button onClick={() => startRepair()}>Tell us what you need repaired →</button></div>
      </section>

      <section id="why" className="dark-section">
        <div className="section-head light"><div><span className="eyebrow">Repair without the runaround</span><h2>Good service should be simple.</h2></div><p>We built our process around speed, transparency, and repair work you can feel confident about.</p></div>
        <div className="benefit-grid">
          <div className="benefit"><span><Icon name="search"/></span><h3>Free diagnostics</h3><p>We'll inspect your device and explain the problem before any paid work begins.</p></div>
          <div className="benefit"><span><Icon name="clock"/></span><h3>Same-day service</h3><p>Many common repairs can be completed the same day, depending on parts availability.</p></div>
          <div className="benefit"><span><Icon name="shield"/></span><h3>1-year warranty</h3><p>Eligible repairs include a one-year limited warranty for added peace of mind.</p></div>
          <div className="benefit"><span className="price-icon">$</span><h3>Upfront pricing</h3><p>Know what the repair will cost before we get started. No mystery line items.</p></div>
        </div>
      </section>

      <section className="section reviews-section">
        <div className="section-head"><div><span className="eyebrow">Real repair stories</span><h2>People like getting their tech back.</h2></div><div className="rating"><strong>4.8</strong><span>★★★★★</span><small>Demo customer rating</small></div></div>
        <div className="review-grid">{reviews.map((r,i) => <article className="review-card" key={i}><div className="stars">★★★★★</div><p>“{r.text}”</p><footer><span className="avatar">{r.name[0]}</span><div><strong>{r.name}</strong><small>{r.device}</small></div></footer></article>)}</div>
      </section>

      <section id="locations" className="location-section">
        <div className="location-copy"><span className="eyebrow">Repair shops near you</span><h2>Your neighborhood tech team.</h2><p>Search by ZIP code to find a nearby location and see available repair options.</p><div className="zip-search"><Icon name="pin" size={20}/><input value={zip} onChange={e=>setZip(e.target.value)} placeholder="Enter ZIP code" inputMode="numeric"/><button onClick={()=>document.getElementById('store-list').scrollIntoView({behavior:'smooth'})}>Search</button></div><small>Demo store finder—connect this to Google Maps or your location database later.</small></div>
        <div id="store-list" className="store-list">{locations.map((l,i)=><button className={`store-card ${selectedLocation===i?'selected':''}`} onClick={()=>setSelectedLocation(i)} key={i}><div className="store-pin"><Icon name="pin"/></div><div><strong>RepairHub {l.city}</strong><span>{l.address}</span><small>{l.distance} · {l.open}</small></div><Icon name="arrow" size={18}/></button>)}</div>
      </section>

      <section className="section services-section">
        <div className="section-head"><div><span className="eyebrow">Popular repairs</span><h2>Tech repair done right</h2></div><p>Common fixes, clear explanations, and a straightforward way to book.</p></div>
        <div className="service-grid">
          {[
            ['Phone screen repair','Cracked, flickering, or unresponsive screen? We handle popular phone models.','phone'],
            ['Battery replacement','If your device dies too quickly or won’t hold a charge, a new battery may help.','phone'],
            ['Computer repair','Startup problems, broken displays, slow performance, hardware issues, and more.','laptop'],
            ['Console repair','HDMI ports, overheating, disc drives, power failures, and other console problems.','game'],
            ['Tablet repair','Screen, charging port, battery, button, and software troubleshooting.','tablet'],
            ['Data & setup help','Device setup, transfers, backups, cleanup, and troubleshooting for everyday tech.','shield']
          ].map(([t,p,ic],i)=><article className="service-card" key={i}><span><Icon name={ic}/></span><h3>{t}</h3><p>{p}</p><button onClick={()=>startRepair()}>Get started <Icon name="arrow" size={17}/></button></article>)}
        </div>
      </section>

      <section id="guides" className="guide-section">
        <div className="section-head"><div><span className="eyebrow">Tech tips</span><h2>Before you panic, read this.</h2></div><a href="#faq">View FAQs →</a></div>
        <div className="guide-grid">
          <article><div className="guide-art art-one"><Icon name="phone" size={54}/></div><span>Phones</span><h3>What to do right after cracking your phone screen</h3><a href="#faq">Read guide →</a></article>
          <article><div className="guide-art art-two"><Icon name="game" size={54}/></div><span>Game consoles</span><h3>Console has no signal? HDMI cable vs. HDMI port</h3><a href="#faq">Read guide →</a></article>
          <article><div className="guide-art art-three"><Icon name="laptop" size={54}/></div><span>Computers</span><h3>Why your laptop gets hot—and what actually helps</h3><a href="#faq">Read guide →</a></article>
        </div>
      </section>

      <section id="faq" className="section faq-section"><div className="faq-title"><span className="eyebrow">Questions, answered</span><h2>Repair FAQs</h2><p>Everything customers usually want to know before booking.</p></div><div className="faq-list">{[
        ['How long does a repair take?','Many common repairs can be completed the same day. Timing depends on the device, issue, location, and parts availability.'],
        ['Do you charge to diagnose my device?','Basic diagnostics are free in this demo concept. More advanced or specialty diagnostics can be configured as a separate service.'],
        ['What devices do you repair?','Phones, computers, tablets, game consoles, and many other consumer electronics can be supported.'],
        ['Do repairs come with a warranty?','The concept includes a one-year limited warranty on eligible repairs. Your production terms should be reviewed and customized for your business.']
      ].map(([q,a],i)=><div className="faq-item" key={i}><button onClick={()=>setFaq(faq===i?null:i)}><span>{q}</span><strong>{faq===i?'−':'+'}</strong></button>{faq===i&&<p>{a}</p>}</div>)}</div></section>

      <section className="cta-section"><div><span className="eyebrow">Ready when you are</span><h2>Let's get your tech working again.</h2><p>Tell us what broke, choose a location, and request your repair.</p></div><button className="btn white large" onClick={()=>startRepair()}>Start a repair <Icon name="arrow" size={20}/></button></section>
    </main>

    <footer className="footer"><div className="footer-top"><div><a className="logo footer-logo" href="#top"><span className="logo-mark">R</span><span>Repair<span>Hub</span></span></a><p>Fast, friendly repair for the tech you use every day.</p></div><div><strong>Repairs</strong><a href="#repairs">Phone</a><a href="#repairs">Computer</a><a href="#repairs">Tablet</a><a href="#repairs">Game console</a></div><div><strong>Company</strong><a href="#why">Why us</a><a href="#locations">Locations</a><a href="#guides">Guides</a><a href="#faq">FAQ</a></div><div><strong>Support</strong><a href="#faq">Track a repair</a><a href="#faq">Warranty</a><a href="#faq">Contact</a></div></div><div className="footer-bottom"><span>© 2026 RepairHub. Demo website concept.</span><span>Privacy · Terms · Accessibility</span></div></footer>

    {repairOpen && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeRepair()}}><div className="repair-modal"><button className="modal-close" onClick={closeRepair}><Icon name="x" size={22}/></button><div className="steps"><span className={step>=1?'active':''}>1</span><i></i><span className={step>=2?'active':''}>2</span><i></i><span className={step>=3?'active':''}>3</span></div>
      {step===1&&<div className="modal-content"><span className="eyebrow">Start a repair</span><h2>What needs fixing?</h2><p>Choose the type of device you need help with.</p><div className="modal-device-grid">{devices.map(d=><button key={d.id} onClick={()=>{setDevice(d.id);setStep(2)}}><Icon name={d.icon}/><strong>{d.title}</strong></button>)}</div></div>}
      {step===2&&<div className="modal-content"><button className="back" onClick={()=>setStep(1)}>← Back</button><span className="eyebrow">{chosenDevice?.title} repair</span><h2>What's going wrong?</h2><p>Select the closest match. A technician can confirm the exact issue later.</p><div className="issue-list">{(repairOptions[device]||[]).map(item=><button className={issue===item?'selected':''} key={item} onClick={()=>setIssue(item)}><span>{item}</span>{issue===item&&<Icon name="check" size={18}/>}</button>)}</div><button className="btn primary full" disabled={!issue} onClick={()=>setStep(3)}>Continue</button></div>}
      {step===3&&<div className="modal-content"><button className="back" onClick={()=>setStep(2)}>← Back</button><span className="eyebrow">Choose a location</span><h2>Where should we repair it?</h2><p>Enter your ZIP code and select a nearby demo store.</p><div className="zip-search modal-zip"><Icon name="pin" size={20}/><input value={zip} onChange={e=>setZip(e.target.value)} placeholder="ZIP code"/><button>Search</button></div><div className="modal-stores">{locations.slice(0,2).map((l,i)=><button onClick={()=>setSelectedLocation(i)} className={selectedLocation===i?'selected':''} key={i}><div><strong>{l.city}</strong><span>{l.address}</span><small>{l.distance} · {l.open}</small></div>{selectedLocation===i&&<Icon name="check"/>}</button>)}</div><button className="btn primary full" disabled={selectedLocation===null} onClick={()=>alert(`Demo repair request created for ${chosenDevice?.title}: ${issue}. Connect this form to your real booking backend to make it live.`)}>Request appointment</button></div>}
    </div></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
