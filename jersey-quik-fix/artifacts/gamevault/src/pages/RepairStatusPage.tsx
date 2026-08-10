import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, Clock, AlertCircle, Phone, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import Footer from '../components/Footer';

type TicketResult = {
  ticket: string;
  category: string;
  brand: string;
  model: string;
  issue: string;
  status: string;
  date: string;
  createdAt: string;
  name: string;
};

const STATUS_STEPS = [
  'Checked In',
  'Diagnosing',
  'Parts Ordered',
  'In Repair',
  'Quality Check',
  'Ready for Pickup',
  'Completed',
];

const STATUS_META: Record<string, { color: string; bg: string; icon: React.ReactNode; msg: string }> = {
  'Checked In':      { color: 'text-blue-400',   bg: 'bg-blue-400/15 border-blue-400/30',   icon: <Clock size={18} />,         msg: "Your device has been received and logged into our system." },
  'Diagnosing':      { color: 'text-yellow-400',  bg: 'bg-yellow-400/15 border-yellow-400/30', icon: <Search size={18} />,       msg: "Our technicians are diagnosing the issue with your device." },
  'Parts Ordered':   { color: 'text-orange-400',  bg: 'bg-orange-400/15 border-orange-400/30', icon: <Clock size={18} />,        msg: "Parts have been ordered and are on their way to us." },
  'In Repair':       { color: 'text-primary',     bg: 'bg-primary/15 border-primary/30',      icon: <ChevronRight size={18} />, msg: "Your device is currently being repaired by our technicians." },
  'Quality Check':   { color: 'text-purple-400',  bg: 'bg-purple-400/15 border-purple-400/30', icon: <CheckCircle size={18} />, msg: "Repair complete — running final quality checks." },
  'Ready for Pickup':{ color: 'text-green-400',   bg: 'bg-green-400/15 border-green-400/30',  icon: <CheckCircle size={18} />, msg: "Your device is ready! Come pick it up at your convenience." },
  'Completed':       { color: 'text-green-400',   bg: 'bg-green-400/15 border-green-400/30',  icon: <CheckCircle size={18} />, msg: "Repair completed and picked up. Thanks for choosing Jersey Quik Fix!" },
  'On Hold':         { color: 'text-yellow-400',  bg: 'bg-yellow-400/15 border-yellow-400/30', icon: <AlertCircle size={18} />, msg: "Your repair is on hold — we may need to reach out to you." },
  'Cancelled':       { color: 'text-red-400',     bg: 'bg-red-400/15 border-red-400/30',      icon: <AlertCircle size={18} />, msg: "This repair was cancelled. Please contact us if you have questions." },
};

const TERMINAL = ['Completed', 'Cancelled'];
const SPECIAL   = ['On Hold', 'Cancelled'];

function StatusTimeline({ status }: { status: string }) {
  if (SPECIAL.includes(status)) {
    const meta = STATUS_META[status];
    return (
      <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 ${meta.bg} ${meta.color}`}>
        {meta.icon}
        <div>
          <div className="font-black">{status}</div>
          <div className="text-sm opacity-80 font-medium">{meta.msg}</div>
        </div>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="space-y-2">
      {STATUS_STEPS.map((step, idx) => {
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        const pending = idx > currentIdx;
        return (
          <div key={step} className={`flex items-center gap-4 rounded-2xl border px-5 py-3.5 transition-all ${
            active  ? 'border-primary/40 bg-primary/8' :
            done    ? 'border-green-500/30 bg-green-500/5' :
                      'border-border bg-card/30 opacity-40'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${
              active  ? 'bg-primary text-primary-foreground' :
              done    ? 'bg-green-500 text-white' :
                        'bg-border text-muted-foreground'
            }`}>
              {done ? '✓' : idx + 1}
            </div>
            <div className="flex-1">
              <div className={`font-black text-sm ${active ? 'text-foreground' : done ? 'text-green-400' : 'text-muted-foreground'}`}>{step}</div>
              {active && <div className="text-xs text-muted-foreground font-medium mt-0.5">{STATUS_META[step]?.msg}</div>}
            </div>
            {active && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
          </div>
        );
      })}
    </div>
  );
}

export default function RepairStatusPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TicketResult | null>(null);
  const [error, setError] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/repairs/lookup/${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Ticket not found. Double-check the code on your receipt.');
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  const meta = result ? (STATUS_META[result.status] ?? STATUS_META['Checked In']) : null;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Hero */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-primary text-xs font-black uppercase tracking-wider mb-6">
            <Search size={14} /> Repair Status Lookup
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight mb-4">
            Track Your <span className="text-primary">Repair</span>
          </h1>
          <p className="text-muted-foreground font-medium mb-10">
            Enter the ticket code from your drop-off receipt to see real-time status.
          </p>

          <form onSubmit={handleLookup} className="flex gap-3 max-w-md mx-auto">
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. JQ-123456"
              className="flex-1 bg-card border-2 border-border rounded-2xl px-5 py-4 font-black text-foreground text-lg tracking-widest placeholder:text-muted-foreground/40 outline-none focus:border-primary transition-colors uppercase"
              maxLength={12}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
            </button>
          </form>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mt-4 text-red-400 font-bold text-sm">
              {error}
            </motion.p>
          )}
        </div>
      </section>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pb-20 px-6"
          >
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Ticket summary card */}
              <div className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row gap-5">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-primary/10 text-primary font-black text-sm tracking-wider px-3 py-1.5 rounded-xl">{result.ticket}</span>
                    <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${meta?.bg} ${meta?.color}`}>
                      {result.status}
                    </span>
                  </div>
                  <div className="font-black text-foreground text-lg">{result.brand} {result.model}</div>
                  <div className="text-sm text-muted-foreground font-medium">{result.category} · {result.issue}</div>
                  {result.name && (
                    <div className="text-xs text-muted-foreground">Checked in for <span className="font-bold text-foreground">{result.name}</span></div>
                  )}
                </div>
                {result.date && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Requested Date</div>
                    <div className="font-black text-foreground">{result.date}</div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div>
                <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Repair Progress</div>
                <StatusTimeline status={result.status} />
              </div>

              {/* Ready for pickup CTA */}
              {result.status === 'Ready for Pickup' && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 text-center space-y-3"
                >
                  <CheckCircle size={40} className="mx-auto text-green-400" />
                  <h3 className="text-xl font-black text-green-400">Your device is ready! 🎉</h3>
                  <p className="text-muted-foreground font-medium">Come pick it up at the store. Bring your ticket number or a photo ID.</p>
                  <a href="tel:+19852282888" className="inline-flex items-center gap-2 bg-green-500 text-white font-black px-6 py-3 rounded-xl hover:bg-green-600 transition-colors">
                    <Phone size={18} /> Call us: (985) 228-2888
                  </a>
                </motion.div>
              )}

              {/* Questions */}
              <div className="bg-card border border-border rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div>
                  <div className="font-black mb-1">Have questions about your repair?</div>
                  <div className="text-sm text-muted-foreground font-medium">Our team is ready to help.</div>
                </div>
                <a href="tel:+19852282888"
                  className="flex items-center gap-2 bg-primary text-primary-foreground font-black px-5 py-3 rounded-xl hover:brightness-110 transition-all whitespace-nowrap">
                  <Phone size={16} /> (985) 228-2888
                </a>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* No lookup yet — helpful tips */}
      {!result && !error && (
        <div className="max-w-2xl mx-auto px-6 pb-16 w-full">
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <div className="text-sm font-black uppercase tracking-wider text-muted-foreground">Where's my ticket code?</div>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                Your ticket code is printed on the receipt given to you at drop-off.
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                It looks like <strong className="text-foreground tracking-widest">JQ-123456</strong> — six digits after the JQ- prefix.
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                Can't find it? Call us at <a href="tel:+19852282888" className="text-primary font-black">(985) 228-2888</a> and we'll look it up for you.
              </li>
            </ul>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
