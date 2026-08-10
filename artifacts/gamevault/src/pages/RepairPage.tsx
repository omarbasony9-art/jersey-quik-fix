import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Laptop, Tablet, Gamepad2, Search, Clock, Shield, DollarSign, 
  MapPin, Star, ChevronRight, X, Plus, Minus, ArrowRight, Check, ClipboardList, Wrench
} from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';
import Footer from '../components/Footer';

const REPAIRS_KEY = 'gv_repairs_v1';

type RepairTicket = {
  id: string;
  ticket: string;
  category: string;
  brand: string;
  model: string;
  issue: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  status: string;
  createdAt: string;
};

const emptyForm = {
  category: 'Phone',
  brand: 'Apple',
  model: '',
  issue: 'Cracked screen',
  name: '',
  phone: '',
  email: '',
  date: '',
};

type DeviceId = string;

const deviceIconMap: Record<string, React.ElementType> = {
  phone: Phone, computer: Laptop, tablet: Tablet, console: Gamepad2
};

const repairOptions: Record<DeviceId, string[]> = {
  phone: ['Cracked screen', 'Battery replacement', 'Charging issue', 'Camera problem', 'Water damage'],
  computer: ["Won't turn on", 'Broken screen', 'Running slow', 'Battery issue', 'Data recovery'],
  tablet: ['Cracked screen', 'Battery replacement', 'Charging issue', 'Button problem', 'Water damage'],
  console: ['HDMI port repair', 'Overheating', 'Disc drive issue', 'Power problem', 'Controller issue'],
};

export default function RepairPage() {
  const { content } = useSiteData();
  const { repair } = content;

  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<DeviceId | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Repair intake form
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');
  const formSectionRef = useRef<HTMLElement>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticket = 'JQ-' + Math.floor(100000 + Math.random() * 900000);
    const entry: RepairTicket = {
      id: crypto.randomUUID(),
      ticket,
      ...form,
      status: 'Checked In',
      createdAt: new Date().toISOString(),
    };
    const existing: RepairTicket[] = (() => {
      try { return JSON.parse(localStorage.getItem(REPAIRS_KEY) || '[]'); } catch { return []; }
    })();
    localStorage.setItem(REPAIRS_KEY, JSON.stringify([...existing, entry]));
    setTicketNumber(ticket);
    setSubmitted(true);
    setForm(emptyForm);
  };

  const handleOpenModal = (device?: DeviceId) => {
    if (device) setSelectedDevice(device);
    setStep(device ? 2 : 1);
    setModalOpen(true);
  };
  
  const closeAndResetModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setStep(1);
      setSelectedDevice(null);
      setSelectedIssue(null);
      setSelectedLocation(null);
    }, 300);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Promo Bar */}
      <div className="bg-primary text-primary-foreground text-xs font-bold py-3 px-4 text-center tracking-wider flex items-center justify-center gap-2 flex-wrap">
        <span>{repair.promoBanner}</span>
        <button onClick={() => handleOpenModal()} className="underline underline-offset-4 hover:text-primary-foreground/80 transition-colors">START A REPAIR</button>
      </div>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative min-h-[600px] flex items-center overflow-hidden py-20">
          <div className="absolute inset-0 z-0">
            <img 
              src={repair.heroBgImage} 
              alt="Hands repairing phone" 
              className="w-full h-full object-cover object-center opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/98 via-background/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full px-6 grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                {repair.heroEyebrow}
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] italic tracking-tight mb-6 text-foreground drop-shadow-2xl">
                {repair.heroHeadline}<br />
                <span className="text-primary">{repair.heroAccent}</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 font-medium mb-10 max-w-lg leading-relaxed">
                {repair.heroSubtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button onClick={() => handleOpenModal()} className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-none">
                  {repair.primaryBtn} <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button onClick={() => document.getElementById('locations')?.scrollIntoView({ behavior: 'smooth' })} className="border-2 border-border text-foreground px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-card active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  {repair.secondaryBtn}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                {repair.checklistItems.map((item, i) => (
                  <span key={i} className="flex items-center gap-1"><Check size={16} className="text-primary" /> {item}</span>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:flex justify-center md:justify-end relative"
            >
              <div className="relative">
                <div className="absolute -top-4 -left-4 z-20 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-xl">
                  Est. in your community
                </div>
                <img 
                  src={repair.heroSideImage || 'https://images.unsplash.com/photo-1556742031-c6961e8560b0?auto=format&fit=crop&w=600&q=80'}
                  alt="Phone repair technician" 
                  className="rounded-3xl border-l-4 border-primary shadow-2xl object-cover w-[400px] h-[500px]"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Device Picker Section */}
        <section className="py-20 bg-background border-t-4 border-primary border-b border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-4">
                We fix what <span className="text-primary">matters most.</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[320px]">
              {repair.devices.map((device, i) => {
                const Icon = deviceIconMap[device.id] ?? Wrench;
                const imgSrc = device.image;

                return (
                  <motion.button
                    key={device.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => handleOpenModal(device.id)}
                    className={`${i === 0 ? 'lg:col-span-2 lg:row-span-2' : ''} relative overflow-hidden rounded-2xl group cursor-pointer text-left w-full h-full bg-card min-h-[320px]`}
                  >
                    <img src={imgSrc} alt={device.title} loading={i > 0 ? "lazy" : "eager"} className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 group-hover:brightness-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent group-hover:from-black/90 transition-all" />
                    <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                      <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center mb-auto text-white group-hover:text-primary transition-colors group-hover:scale-110 duration-300 border border-white/10">
                        <Icon size={24} />
                      </div>
                      <h3 className={`${i === 0 ? 'text-4xl md:text-5xl' : 'text-3xl'} font-black uppercase italic tracking-tight text-white mb-2`}>{device.title}</h3>
                      <p className="text-white/70 font-medium mb-4 text-sm md:text-base">{device.desc}</p>
                      <span className="self-start bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider">Start repair →</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Repair Intake Form */}
        <section ref={formSectionRef} id="repair-form" className="py-24 bg-background border-t-4 border-primary">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <div className="text-xs font-bold uppercase tracking-widest text-primary mb-3">START A REPAIR</div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight mb-4">
                  {repair.formHeadline.replace('.', '').split(' ').slice(0, -1).join(' ')}{' '}
                  <span className="relative after:content-[''] after:absolute after:bottom-1 after:left-0 after:w-full after:h-2 after:bg-primary/50 after:rounded-full text-primary inline-block">
                    {repair.formHeadline.replace('.', '').split(' ').slice(-1)}
                  </span>
                </h2>
                <p className="text-muted-foreground font-medium">{repair.formSubtitle}</p>
              </div>

              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card border border-primary/40 rounded-3xl p-10 text-center shadow-[0_0_40px_rgba(245,158,11,0.15)]"
                  >
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check size={36} className="text-primary" />
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Repair Request Created</div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tight mb-3">You're all set!</h3>
                    <div className="bg-background border border-border rounded-2xl px-8 py-4 inline-block mb-6">
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Your Ticket Number</div>
                      <div className="text-3xl font-black text-primary tracking-wider">{ticketNumber}</div>
                    </div>
                    <p className="text-muted-foreground font-medium mb-8">Bring this ticket number when you drop off your device. We'll have your info ready.</p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black uppercase tracking-wider hover:brightness-110 transition-all"
                    >
                      Submit Another
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleFormSubmit}
                    className="bg-card border border-border rounded-3xl p-8 md:p-10 space-y-6"
                  >
                    <div className="grid sm:grid-cols-2 gap-5">
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Device Category</span>
                        <select
                          value={form.category}
                          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                          className="bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none font-bold transition-colors"
                        >
                          {['Phone', 'Tablet', 'Computer', 'Gaming Console'].map(c => <option key={c}>{c}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Manufacturer</span>
                        <select
                          value={form.brand}
                          onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                          className="bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none font-bold transition-colors"
                        >
                          {['Apple', 'Samsung', 'Google', 'Sony', 'Microsoft', 'Nintendo', 'Other'].map(b => <option key={b}>{b}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Model</span>
                        <input
                          required
                          placeholder="e.g. iPhone 15 Pro"
                          value={form.model}
                          onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                          className="bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none font-bold placeholder:text-muted-foreground/50 transition-colors"
                        />
                      </label>
                      <label className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Issue</span>
                        <select
                          value={form.issue}
                          onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                          className="bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none font-bold transition-colors"
                        >
                          {['Cracked screen', 'Battery replacement', 'Charging port', 'Water damage', 'HDMI port', 'Overheating', 'Diagnostics', 'Other'].map(i => <option key={i}>{i}</option>)}
                        </select>
                      </label>
                    </div>

                    <div className="border-t border-border pt-6">
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Your Info</div>
                      <div className="grid sm:grid-cols-2 gap-5">
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</span>
                          <input
                            required
                            placeholder="Your name"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none font-bold placeholder:text-muted-foreground/50 transition-colors"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Phone Number</span>
                          <input
                            required
                            type="tel"
                            placeholder="(555) 000-0000"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            className="bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none font-bold placeholder:text-muted-foreground/50 transition-colors"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email <span className="text-muted-foreground/50 normal-case font-medium text-[11px]">(optional)</span></span>
                          <input
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            className="bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none font-bold placeholder:text-muted-foreground/50 transition-colors"
                          />
                        </label>
                        <label className="flex flex-col gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preferred Drop-off Date</span>
                          <input
                            type="date"
                            value={form.date}
                            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            className="bg-background border border-border focus:border-primary text-foreground rounded-xl px-4 py-3 outline-none font-bold transition-colors"
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                    >
                      <ClipboardList size={22} /> Create Repair Request
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>

        {/* Why Us (Dark Section) */}
        <section className="py-28 bg-card relative overflow-hidden" style={{ clipPath: 'polygon(0 4%, 100% 0%, 100% 96%, 0% 100%)' }}>
          <div className="absolute inset-0 z-0 bg-card">
            <img src={repair.whyUsBgImage} alt="" loading="lazy" className="w-full h-full object-cover opacity-5" />
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight mb-6">
                  {repair.whyUsHeadline} <br /><span className="text-primary">{repair.whyUsAccent}</span>
                </h2>
                <p className="text-lg text-muted-foreground font-medium mb-8">
                  {repair.whyUsSubtitle}
                </p>
                <div className="space-y-6">
                  {repair.whyUsPoints.map((point, i) => (
                    <motion.div 
                      key={point.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="bg-primary/10 text-primary p-3 rounded-xl h-fit">
                        <Check size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase tracking-tight mb-1">{point.title}</h3>
                        <p className="text-muted-foreground font-medium">{point.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="relative flex justify-center lg:justify-end mt-10 lg:mt-0">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1562408590-e32931084e23?auto=format&fit=crop&w=400&q=80" 
                    alt="Repair tech" 
                    className="w-56 h-56 md:w-80 md:h-80 rounded-full object-cover border-4 border-primary shadow-2xl" 
                  />
                  <img 
                    src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=300&q=80" 
                    alt="Happy family" 
                    className="w-36 h-36 md:w-48 md:h-48 rounded-full object-cover border-4 border-accent absolute -bottom-8 -right-8 shadow-xl" 
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-20 bg-background border-y-4 border-primary/20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight">Trusted by <span className="text-primary">Locals</span></h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {repair.reviews.map((review, i) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border border-l-4 border-l-primary p-8 rounded-3xl relative"
                >
                  <div className="text-primary text-6xl font-black leading-none mb-2 mt-[-10px]">"</div>
                  <div className="flex gap-1 text-primary mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} size={18} fill="currentColor" />)}
                  </div>
                  <p className="text-lg font-medium mb-8">"{review.text}"</p>
                  <div className="flex items-center gap-4 mt-auto">
                    <img src={review.avatar} loading="lazy" alt={review.name} className="w-12 h-12 rounded-full object-cover border border-border" />
                    <div>
                      <h4 className="font-black text-primary">{review.name}</h4>
                      <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{review.device}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Location Finder */}
        <section id="locations" className="py-24 bg-background border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 z-0 bg-background">
            <img src={repair.locationsBgImage} alt="Neighborhood view" className="w-full h-full object-cover opacity-10" />
            <div className="absolute inset-0 bg-background/80" />
          </div>
          <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
            <MapPin size={48} className="mx-auto text-primary mb-6" />
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight mb-6">
              Find a <span className="text-primary">Store</span>
            </h2>
            <p className="text-lg text-muted-foreground font-medium mb-10">
              Enter your ZIP code to find the nearest GameVault repair center.
            </p>
            
            <div className="flex gap-2 max-w-md mx-auto mb-12">
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <input 
                  type="text" 
                  placeholder="Enter ZIP code" 
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full bg-card border-2 border-border focus:border-primary text-foreground rounded-xl py-4 px-5 pl-12 outline-none transition-all font-bold"
                />
              </div>
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black uppercase hover:brightness-110 transition-all">
                Search
              </button>
            </div>

            <div className="space-y-4 text-left">
              {repair.locations.map((loc, i) => (
                <div key={loc.id} className="bg-card/90 backdrop-blur-md border border-border p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                  <div>
                    <h4 className="font-black text-xl tracking-tight mb-1">{content.site.name} {loc.city}</h4>
                    <p className="text-muted-foreground font-medium">{loc.address}</p>
                    <p className="text-sm text-primary font-bold mt-2">{loc.open}</p>
                  </div>
                  <div className="flex flex-col items-end justify-between h-full">
                    <span className="text-sm font-bold bg-background px-3 py-1 rounded-full border border-border mb-4">{loc.distance}</span>
                    <button onClick={() => handleOpenModal()} className="font-bold text-sm uppercase tracking-wider text-accent hover:text-accent/80 transition-colors flex items-center gap-1">
                      Book here <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-8 uppercase font-bold tracking-widest">Demo Store Finder</p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-20 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-12 text-center">
              All <span className="text-accent">Services</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { t: 'Phone Screen Repair', d: 'OLED & LCD replacements for all brands', i: Phone },
                { t: 'Battery Replacement', d: 'Bring your device back to peak capacity', i: DollarSign },
                { t: 'Computer Repair', d: 'Hardware upgrades and OS fixes', i: Laptop },
                { t: 'Console Repair', d: 'HDMI ports, cleaning, and thermal paste', i: Gamepad2 },
                { t: 'Tablet Repair', d: 'Screens, batteries, and charging ports', i: Tablet },
                { t: 'Data & Setup Help', d: 'Data recovery, transfers, and new setups', i: Shield },
              ].map((svc, i) => (
                <div key={i} className="bg-background border border-border p-6 rounded-3xl flex items-start gap-4">
                  <div className="p-3 bg-secondary/20 rounded-xl text-secondary">
                    <svc.i size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-lg tracking-tight mb-1">{svc.t}</h4>
                    <p className="text-sm text-muted-foreground font-medium mb-3">{svc.d}</p>
                    <button onClick={() => handleOpenModal()} className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-1 hover:gap-2 transition-all">
                      Get started <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Guides */}
        <section className="py-20 bg-background border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-12 text-center">
              Tech <span className="text-primary">Guides</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { label: 'Phones', title: 'What to do when your phone screen cracks', grad: 'from-secondary to-accent' },
                { label: 'Consoles', title: 'Is it your HDMI port or your TV?', grad: 'from-primary to-orange-600' },
                { label: 'Laptops', title: 'How to prevent laptop overheating', grad: 'from-blue-600 to-cyan-400' }
              ].map((guide, i) => (
                <div key={i} className="group cursor-pointer flex flex-col bg-card rounded-3xl overflow-hidden border border-border hover:border-primary/50 transition-colors">
                  <div className={`h-48 bg-gradient-to-br ${guide.grad} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2">{guide.label}</span>
                    <h4 className="text-xl font-black italic tracking-tight mb-4 group-hover:text-primary transition-colors">{guide.title}</h4>
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider mt-auto flex items-center gap-1 group-hover:text-foreground transition-colors">
                      Read guide <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 bg-card border-t border-border">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-12 text-center">
              Frequent <span className="text-accent">Questions</span>
            </h2>
            <div className="space-y-4">
              {repair.faqs.map((faq, i) => (
                <div key={faq.id} className={`bg-background border rounded-2xl overflow-hidden transition-all ${openFaq === i ? 'border-border border-l-4 border-l-primary' : 'border-border'}`}>
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4"
                  >
                    <h4 className={`font-black text-lg tracking-tight ${openFaq === i ? 'underline underline-offset-4 text-foreground' : ''}`}>{faq.q}</h4>
                    <div className="text-primary flex-shrink-0">
                      {openFaq === i ? <Minus size={20} /> : <Plus size={20} />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="px-6 pb-6 text-muted-foreground font-medium border-t border-border mt-2 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="relative py-24 bg-gradient-to-r from-secondary to-primary overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center text-white">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tight mb-8 drop-shadow-lg">
              Let's get your tech working again.
            </h2>
            <button onClick={() => handleOpenModal()} className="bg-white text-black px-10 py-5 rounded-xl font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform shadow-2xl flex items-center gap-2 mx-auto">
              Start a repair <ArrowRight size={20} />
            </button>
          </div>
        </section>

      </main>

      <Footer />

      {/* Repair Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={closeAndResetModal}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-background/50">
                <h3 className="font-black text-2xl uppercase tracking-tight italic">
                  {step === 1 && 'Select Device'}
                  {step === 2 && 'What\'s the issue?'}
                  {step === 3 && 'Choose Location'}
                </h3>
                <button onClick={closeAndResetModal} className="text-muted-foreground hover:text-foreground bg-card p-2 rounded-full border border-transparent hover:border-border transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Progress Dots */}
              <div className="bg-background py-4 px-8 border-b border-border flex justify-center items-center gap-2">
                {[1, 2, 3].map(s => (
                  <React.Fragment key={s}>
                    <div className={`w-3 h-3 rounded-full ${s <= step ? 'bg-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-border'}`} />
                    {s < 3 && <div className={`h-0.5 w-12 ${s < step ? 'bg-primary' : 'bg-border'}`} />}
                  </React.Fragment>
                ))}
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-card">
                {step === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {repair.devices.map(device => {
                      const Icon = deviceIconMap[device.id] ?? Wrench;
                      return (
                        <button
                          key={device.id}
                          onClick={() => { setSelectedDevice(device.id); setStep(2); }}
                          className="bg-background border border-border hover:border-primary p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-colors group"
                        >
                          <Icon size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="font-bold">{device.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 2 && selectedDevice && (
                  <div className="flex flex-col h-full">
                    <div className="space-y-3 mb-6">
                      {repairOptions[selectedDevice].map(issue => (
                        <button
                          key={issue}
                          onClick={() => setSelectedIssue(issue)}
                          className={`w-full text-left p-4 rounded-xl border font-bold transition-colors ${selectedIssue === issue ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:border-primary/50'}`}
                        >
                          {issue}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-col h-full">
                    <div className="relative mb-6">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                      <input 
                        type="text" 
                        placeholder="ZIP code" 
                        defaultValue="12345"
                        className="w-full bg-background border-2 border-border focus:border-primary text-foreground rounded-xl py-3 px-5 pl-12 outline-none font-bold"
                      />
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      {repair.locations.slice(0, 2).map((loc, i) => (
                        <button
                          key={loc.id}
                          onClick={() => setSelectedLocation(i)}
                          className={`w-full text-left p-4 rounded-xl border transition-colors flex justify-between items-center ${selectedLocation === i ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/50'}`}
                        >
                          <div>
                            <div className={`font-black tracking-tight mb-1 ${selectedLocation === i ? 'text-primary' : ''}`}>{loc.city}</div>
                            <div className="text-sm font-medium text-muted-foreground">{loc.address}</div>
                          </div>
                          <div className="text-sm font-bold px-3 py-1 rounded-full bg-card border border-border">
                            {loc.distance}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border bg-background flex justify-between gap-4">
                {step > 1 ? (
                  <button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-xl font-bold uppercase hover:bg-card transition-colors border border-transparent hover:border-border">
                    Back
                  </button>
                ) : <div />}
                
                {step === 2 && (
                  <button 
                    disabled={!selectedIssue}
                    onClick={() => setStep(3)} 
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all ml-auto"
                  >
                    Continue
                  </button>
                )}

                {step === 3 && (
                  <button 
                    disabled={selectedLocation === null}
                    onClick={() => {
                      alert('Appointment requested! (Mock flow completed)');
                      closeAndResetModal();
                    }} 
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all ml-auto"
                  >
                    Request Appointment
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
