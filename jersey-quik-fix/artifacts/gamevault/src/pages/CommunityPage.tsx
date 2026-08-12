import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, X, Check } from 'lucide-react';
import { useSiteData } from '../context/SiteDataContext';

export default function CommunityPage() {
  const { content } = useSiteData();
  const { community } = content;

  const [events, setEvents] = useState(community.events);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  const [detailOpen, setDetailOpen] = useState<{title: string, desc: string} | null>(null);
  const [rsvps, setRsvps] = useState<Record<string, boolean>>({});

  const targetDate = new Date(community.countdownTarget).getTime();
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance > 0) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeLeft({ days, hours });
      }
    };
    updateCountdown();
    const timerId = setInterval(updateCountdown, 60000);
    return () => clearInterval(timerId);
  }, [targetDate]);

  // Sync local events state when the authoritative context updates from the API
  useEffect(() => {
    setEvents(community.events);
  }, [community.events]);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toastMsg]);

  const showToast = (msg: string) => setToastMsg(msg);

  const handleRsvp = (id: string) => {
    const isGoing = !rsvps[id];
    setRsvps(prev => ({ ...prev, [id]: isGoing }));
    showToast(isGoing ? "You're going!" : "RSVP cancelled.");
  };

  const formatTime = (time: string) => {
    if (!time) return 'TBD';
    const [h, m] = time.split(':');
    const hh = parseInt(h, 10);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    const [y, m, d] = dateStr.split('-');
    const monthStrs = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${monthStrs[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
  };


  return (
    <div className="min-h-[100dvh] flex flex-col font-sans overflow-x-hidden selection:bg-primary selection:text-primary-foreground bg-background text-foreground">
      {/* Promo Bar */}
      <div className="bg-primary text-primary-foreground text-xs font-bold py-3 px-4 text-center tracking-wider">
        {community.promoBanner}
      </div>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative min-h-[600px] flex items-center overflow-hidden py-20">
          <div className="absolute inset-0 z-0 bg-background overflow-hidden flex items-center justify-center">
            <img 
              src={community.heroBgImage} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-25 z-0"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40 z-0" />
            <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-secondary/20 rounded-full blur-[120px] pointer-events-none z-0" />
            <div className="absolute -bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none z-0" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto w-full px-6 grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                COMMUNITY HUB
              </div>
              <h1 className="text-5xl md:text-7xl font-black uppercase leading-[0.9] italic tracking-tight mb-6 text-foreground drop-shadow-2xl">
                {community.heroHeadline}
              </h1>
              <p className="text-lg md:text-xl text-foreground/80 font-medium mb-10 max-w-lg leading-relaxed">
                {community.heroSubtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })} 
                  className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                >
                  Upcoming Events <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <button 
                  onClick={() => document.getElementById('announcements')?.scrollIntoView({ behavior: 'smooth' })} 
                  className="border-2 border-border text-foreground px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:bg-card active:scale-[0.98] transition-all flex items-center justify-center"
                >
                  Latest Announcements
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex justify-center md:justify-end relative"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="bg-card/80 backdrop-blur-xl border border-primary/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(245,158,11,0.2)] max-w-sm w-full relative"
              >
                <div className="absolute -top-3 -right-3">
                  <div className="relative flex h-6 w-6">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500 border-2 border-background"></span>
                  </div>
                </div>
                
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Next big event
                </h3>
                <div className="mb-6">
                  <h4 className="text-2xl font-black uppercase italic tracking-tight mb-2">{events[0]?.title || 'TBA'}</h4>
                  <p className="text-foreground/80 font-medium">{events[0] ? `${events[0].date} • ${events[0].time}` : 'Check back soon'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-background border border-border p-4 rounded-2xl text-center">
                    <div className="text-3xl font-black text-primary">{timeLeft.days}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Days</div>
                  </div>
                  <div className="bg-background border border-border p-4 rounded-2xl text-center">
                    <div className="text-3xl font-black text-primary">{timeLeft.hours}</div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Hours</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Row */}
        <section className="py-12 bg-background border-y border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { num: '4', label: 'Upcoming Events' },
                { num: '3', label: 'Active Announcements' },
                { num: '2', label: 'Community Actions' },
                { num: '26', label: 'Members Connected' }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border p-6 rounded-3xl text-center"
                >
                  <div className="text-4xl md:text-5xl font-black text-primary mb-2">{stat.num}</div>
                  <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section id="announcements" className="py-24 bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">IMPORTANT UPDATES</div>
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">Big Announcements</h2>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              {community.announcements.map((ann, i) => {
                const isFeatured = !!ann.featured;
                return (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`border p-8 rounded-3xl flex flex-col relative overflow-hidden ${
                      isFeatured 
                      ? 'bg-secondary border-secondary shadow-xl lg:col-span-1 text-secondary-foreground' 
                      : 'bg-card border-border border-l-4 border-l-accent text-foreground hover:border-primary/50 transition-colors'
                    }`}
                  >
                    {isFeatured && (
                      <div className="absolute top-4 bottom-4 left-0 w-1.5 bg-primary rounded-r-full z-20" />
                    )}
                    {isFeatured && ann.image && (
                      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                        <img src={ann.image} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 to-transparent" />
                      </div>
                    )}
                    
                    <div className="relative z-10 flex flex-col h-full">
                      {!isFeatured && ann.image && (
                        <div className="h-36 overflow-hidden rounded-xl mb-6 -mx-2 -mt-2">
                          <img src={ann.image} alt={ann.title} loading="lazy" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-6">
                        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                          isFeatured ? 'bg-background/20 text-white border border-white/20' : 'bg-secondary/10 text-secondary border border-secondary/20'
                        }`}>
                          {ann.badge}
                        </span>
                        <span className={`text-sm font-bold ${isFeatured ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {ann.date}
                        </span>
                      </div>
                      <h3 className={`text-2xl font-black uppercase italic tracking-tight mb-4 ${isFeatured ? 'text-white' : ''}`}>
                        {ann.title}
                      </h3>
                      <p className={`font-medium mb-8 flex-1 ${isFeatured ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {ann.desc}
                      </p>
                      <button 
                        onClick={() => setDetailOpen({ title: ann.title, desc: ann.desc })}
                        className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 group w-max ${
                          isFeatured ? 'text-white hover:text-white/80' : 'text-primary hover:text-primary/80'
                        }`}
                      >
                        Read announcement <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Events */}
        <section id="events" className="py-24 bg-card border-t-4 border-secondary/40 border-b border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">WHAT'S COMING UP</div>
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">Community Events</h2>
            </div>

            <div className="space-y-6">
              {events.map((ev, i) => {
                const isGoing = rsvps[ev.id];
                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-background border border-border p-6 md:p-8 rounded-3xl flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center hover:border-primary/50 transition-colors"
                  >
                    <div className="bg-primary text-primary-foreground rounded-2xl w-24 h-24 flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold uppercase tracking-widest">{ev.date.split(' ')[0]}</span>
                      <span className="text-3xl font-black">{ev.date.split(' ')[1]}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="bg-secondary/20 text-secondary text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                          {ev.badge}
                        </span>
                        <span className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                          <Clock size={14} /> {ev.time}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black uppercase italic tracking-tight mb-2">{ev.title}</h3>
                      <div className="text-muted-foreground font-medium flex items-center gap-1">
                        📍 {ev.location}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
                      <button 
                        onClick={() => handleRsvp(ev.id)}
                        className={`px-8 py-3 rounded-xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                          isGoing 
                          ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                          : 'bg-background border-2 border-border hover:border-primary text-foreground'
                        }`}
                      >
                        {isGoing ? <><Check size={18} /> Going</> : 'RSVP'}
                      </button>
                      <button 
                        onClick={() => setDetailOpen({ title: ev.title, desc: ev.desc })}
                        className="px-8 py-3 rounded-xl font-black uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Community Actions */}
        <section id="actions" className="py-24 bg-background border-b border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="mb-12">
              <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">{(community as any).actionsEyebrow || 'GROUP EFFORTS'}</div>
              <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">{(community as any).actionsHeadline || 'Big Actions Happening'}</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {community.actions.map((act, i) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border p-8 rounded-3xl overflow-hidden flex flex-col"
                >
                  <div className="h-40 overflow-hidden rounded-2xl mb-6 -mt-2 -mx-2 bg-card shrink-0">
                    <img 
                      src={act.image || (i === 0 
                        ? 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80'
                        : 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=80')} 
                      alt={act.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-background border border-border rounded-xl flex items-center justify-center text-2xl shadow-sm -mt-12 relative z-10 shrink-0">
                      {act.icon}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-primary border border-primary/20 bg-primary/5 px-3 py-1 rounded-full">
                      {act.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl font-black uppercase italic tracking-tight mb-3">{act.title}</h3>
                  <p className="text-muted-foreground font-medium mb-8">{act.desc}</p>
                  
                  <div className="mb-8">
                    <div className="flex items-center justify-between text-sm font-bold mb-3">
                      <span className="text-primary">{act.volunteers} volunteers</span>
                      <span>{act.progress}% organized</span>
                    </div>
                    <div className="h-3 bg-background border border-border rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${act.progress}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => showToast(`You joined: ${act.title}`)}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    Join the Action
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Email Signup */}
        <section className="py-24 bg-background">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-gradient-to-br from-secondary to-black border border-secondary/50 p-10 md:p-16 rounded-[3rem] text-center shadow-2xl relative overflow-hidden">
              {/* Added opacity, disabled pointer events for abstract grain */}
              <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"></div>
              
              <div className="relative z-10">
                <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">STAY IN THE LOOP</div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight text-white mb-8 drop-shadow-md">
                  Never miss a major family update.
                </h2>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('email') as HTMLInputElement;
                    if (input.value && input.value.includes('@')) {
                      showToast("You're signed up!");
                      input.value = '';
                    } else {
                      showToast("Please enter a valid email.");
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
                >
                  <input 
                    name="email"
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 bg-black/50 border-2 border-white/10 focus:border-primary text-white rounded-xl py-4 px-6 outline-none transition-all font-bold placeholder:text-white/30"
                  />
                  <button 
                    type="submit"
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 transition-all whitespace-nowrap"
                  >
                    Get Updates
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black border-t border-border pt-16 pb-8 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="text-xl font-black tracking-tight uppercase italic text-foreground">
            {content.site.name} Community
          </div>
          <p className="text-muted-foreground font-medium text-sm">
            {content.settings.footer}
          </p>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            {content.settings.visibility}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {detailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailOpen(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-card border border-border p-8 rounded-3xl shadow-2xl z-10"
            >
              <button 
                onClick={() => setDetailOpen(null)}
                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground bg-background p-2 rounded-full border border-transparent hover:border-border transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-3xl font-black uppercase italic tracking-tight mb-4 pr-8">{detailOpen.title}</h3>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">{detailOpen.desc}</p>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background px-6 py-4 rounded-2xl font-black uppercase tracking-wider shadow-2xl flex items-center gap-3"
          >
            <Check size={20} className="text-primary" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
