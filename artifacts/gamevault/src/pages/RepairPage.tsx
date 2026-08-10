import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, Laptop, Tablet, Gamepad2, Search, Clock, Shield, DollarSign, 
  MapPin, Star, ChevronRight, X, Plus, Minus, ArrowRight, Check
} from 'lucide-react';
import Footer from '../components/Footer';

const devices = [
  { id: 'phone', title: 'Phone', desc: 'Screen, battery, camera & more', icon: Phone },
  { id: 'computer', title: 'Computer', desc: 'Laptop & desktop repairs', icon: Laptop },
  { id: 'tablet', title: 'Tablet', desc: 'Screens, charging & batteries', icon: Tablet },
  { id: 'console', title: 'Game console', desc: 'HDMI, power & overheating', icon: Gamepad2 },
] as const;

type DeviceId = typeof devices[number]['id'];

const repairOptions: Record<DeviceId, string[]> = {
  phone: ['Cracked screen', 'Battery replacement', 'Charging issue', 'Camera problem', 'Water damage'],
  computer: ["Won't turn on", 'Broken screen', 'Running slow', 'Battery issue', 'Data recovery'],
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

const faqs = [
  { q: 'How long does a repair take?', a: 'Most common repairs like screen and battery replacements take under 2 hours. More complex repairs may take 24-48 hours depending on parts.' },
  { q: 'Do you charge to diagnose?', a: 'No, diagnostics are completely free. We will let you know exactly what is wrong and how much it will cost before we start any work.' },
  { q: 'What devices do you repair?', a: 'We repair all major brands of phones, tablets, laptops, desktops, and game consoles.' },
  { q: 'Do repairs come with a warranty?', a: 'Yes, all repairs are backed by our 1-year warranty against defects in parts and workmanship.' }
];

export default function RepairPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<DeviceId | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
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
      <div className="bg-secondary text-secondary-foreground text-xs font-bold py-3 px-4 text-center tracking-wider flex items-center justify-center gap-2 flex-wrap">
        <span>SAME-DAY APPOINTMENTS AVAILABLE AT SELECT LOCATIONS.</span>
        <button onClick={() => handleOpenModal()} className="underline underline-offset-4 hover:text-primary transition-colors">START A REPAIR</button>
      </div>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative min-h-[600px] flex items-center overflow-hidden py-20">
          {/* Abstract Violet/Amber Blob Background */}
          <div className="absolute inset-0 z-0 bg-background overflow-hidden flex items-center justify-center">
            <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute -bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full px-6 grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                LOCAL TECH REPAIR, MADE SIMPLE
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] italic tracking-tight mb-6 text-foreground drop-shadow-2xl">
                Broken tech?<br />
                <span className="text-primary">We can fix that.</span>
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 font-medium mb-10 max-w-lg leading-relaxed">
                Fast, professional repairs for the devices you rely on every day—from cracked phone screens to game console HDMI ports.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button onClick={() => handleOpenModal()} className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                  Start a repair <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button onClick={() => document.getElementById('locations')?.scrollIntoView({ behavior: 'smooth' })} className="border-2 border-border text-foreground px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-card active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                  Find a store
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-1"><Check size={16} className="text-primary" /> Free diagnostics</span>
                <span className="flex items-center gap-1"><Check size={16} className="text-primary" /> Same-day options</span>
                <span className="flex items-center gap-1"><Check size={16} className="text-primary" /> 1-year warranty</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden md:flex justify-center relative"
            >
              {/* Floating card */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="bg-card/80 backdrop-blur-xl border border-primary/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.2)] max-w-sm w-full"
              >
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6">
                  <Check size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight mb-2">Ready today</h3>
                <p className="text-muted-foreground font-medium">Bring it in by 2 PM, get it back by dinner. Let's get your tech working again.</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Device Picker Section */}
        <section className="py-20 bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight mb-4">
                What needs <span className="text-primary">fixing?</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {devices.map((device, i) => (
                <motion.button
                  key={device.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleOpenModal(device.id)}
                  className="bg-background border border-border hover:border-primary p-8 rounded-3xl text-left group transition-all duration-300 relative overflow-hidden shadow-xl hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(124,58,237,0.3)]"
                >
                  <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/10 transition-colors pointer-events-none" />
                  <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center mb-6 text-foreground group-hover:text-primary transition-colors group-hover:scale-110 duration-300">
                    <device.icon size={28} />
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{device.title}</h3>
                  <p className="text-muted-foreground font-medium mb-6">{device.desc}</p>
                  <div className="flex items-center text-sm font-bold uppercase tracking-wider text-primary group-hover:translate-x-2 transition-transform">
                    Start repair <ChevronRight size={16} />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* Why Us (Dark Section) */}
        <section className="py-24 bg-background relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/10 blur-[100px] rounded-full pointer-events-none" />
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-1">
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight mb-6">
                  Why choose <br /><span className="text-accent">GameVault Repair?</span>
                </h2>
                <p className="text-lg text-muted-foreground font-medium mb-8">
                  We treat your devices like our own. Transparent pricing, expert technicians, and a guarantee you can trust.
                </p>
              </div>
              <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
                {[
                  { title: 'Free Diagnostics', desc: 'Know what is wrong before paying a dime.', icon: Search },
                  { title: 'Same-Day Service', desc: 'Most common repairs finished in under 2 hours.', icon: Clock },
                  { title: '1-Year Warranty', desc: 'Parts and labor guaranteed for a full year.', icon: Shield },
                  { title: 'Upfront Pricing', desc: 'No hidden fees or surprise charges. Ever.', icon: DollarSign }
                ].map((feature, i) => (
                  <motion.div 
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-secondary/30 border border-secondary/50 p-6 rounded-3xl"
                  >
                    <feature.icon className="text-primary mb-4" size={32} />
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">{feature.title}</h3>
                    <p className="text-foreground/80 font-medium">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-20 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight">Trusted by <span className="text-primary">Locals</span></h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((review, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-background border border-border p-8 rounded-3xl shadow-lg relative"
                >
                  <div className="flex gap-1 text-primary mb-6">
                    {[...Array(5)].map((_, j) => <Star key={j} size={18} fill="currentColor" />)}
                  </div>
                  <p className="text-lg font-medium mb-8">"{review.text}"</p>
                  <div className="flex items-center gap-4 mt-auto">
                    <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-black text-xl">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold">{review.name}</h4>
                      <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{review.device}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Location Finder */}
        <section id="locations" className="py-24 bg-background border-t border-border">
          <div className="max-w-3xl mx-auto px-6 text-center">
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
              {locations.map((loc, i) => (
                <div key={loc.city} className="bg-card border border-border p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/50 transition-colors">
                  <div>
                    <h4 className="font-black text-xl tracking-tight mb-1">GameVault {loc.city}</h4>
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
              {faqs.map((faq, i) => (
                <div key={i} className="bg-background border border-border rounded-2xl overflow-hidden">
                  <button 
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4"
                  >
                    <h4 className="font-black text-lg tracking-tight">{faq.q}</h4>
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
                    {devices.map(device => (
                      <button
                        key={device.id}
                        onClick={() => { setSelectedDevice(device.id); setStep(2); }}
                        className="bg-background border border-border hover:border-primary p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-3 transition-colors group"
                      >
                        <device.icon size={32} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-bold">{device.title}</span>
                      </button>
                    ))}
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
                      {locations.slice(0, 2).map((loc, i) => (
                        <button
                          key={loc.city}
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
